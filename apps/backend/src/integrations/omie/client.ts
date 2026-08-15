import {
  OmieClientConfig,
  OmieClientErrorOptions,
  OmieErrorCode,
  OmieLogger,
  OmieRecord,
  OmieRequestPayload,
  OmieTransportDependencies,
} from "./types"

const DEFAULT_TIMEOUT_MS = 10_000
const DEFAULT_MAX_ATTEMPTS = 3
const DEFAULT_BASE_BACKOFF_MS = 250
const READ_ONLY_OPERATIONS = new Set(["ListarProdutos", "ListarPosEstoque"])

const noopLogger: OmieLogger = {}

const sleepFor = (milliseconds: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, milliseconds))

const isRecord = (value: unknown): value is OmieRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value)

const retryAfterMilliseconds = (response: Response): number | null => {
  const value = response.headers.get("retry-after")
  if (!value) {
    return null
  }

  const seconds = Number(value)
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.min(seconds * 1_000, 60_000)
  }

  const timestamp = Date.parse(value)
  if (!Number.isNaN(timestamp)) {
    return Math.max(0, Math.min(timestamp - Date.now(), 60_000))
  }

  return null
}

export class OmieClientError extends Error {
  readonly code: OmieErrorCode
  readonly operation: string
  readonly status?: number
  readonly retryable: boolean

  constructor(options: OmieClientErrorOptions) {
    super(`Omie ${options.operation} failed (${options.code})`)
    this.name = "OmieClientError"
    this.code = options.code
    this.operation = options.operation
    this.status = options.status
    this.retryable = options.retryable ?? false
  }
}

export class OmieConfigurationError extends OmieClientError {
  constructor(operation: string) {
    super({ code: "CONFIGURATION", operation, retryable: false })
    this.name = "OmieConfigurationError"
  }
}

export class OmieClient {
  private readonly fetchImpl: typeof fetch
  private readonly sleep: (milliseconds: number) => Promise<void>
  private readonly random: () => number
  private readonly logger: OmieLogger
  private readonly timeoutMs: number
  private readonly maxAttempts: number
  private readonly baseBackoffMs: number

  constructor(
    private readonly config: OmieClientConfig,
    dependencies: OmieTransportDependencies = {},
  ) {
    this.fetchImpl = dependencies.fetchImpl ?? fetch
    this.sleep = dependencies.sleep ?? sleepFor
    this.random = dependencies.random ?? Math.random
    this.logger = dependencies.logger ?? noopLogger
    this.timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS
    this.maxAttempts = config.maxAttempts ?? DEFAULT_MAX_ATTEMPTS
    this.baseBackoffMs = config.baseBackoffMs ?? DEFAULT_BASE_BACKOFF_MS
  }

  async request<T>(
    operation: string,
    params: OmieRecord = {},
  ): Promise<T> {
    if (!READ_ONLY_OPERATIONS.has(operation)) {
      throw new OmieClientError({
        code: "READ_ONLY_VIOLATION",
        operation,
        retryable: false,
      })
    }

    if (!this.config.apiUrl || !this.config.appKey || !this.config.appSecret) {
      throw new OmieConfigurationError(operation)
    }

    const payload: OmieRequestPayload = {
      call: operation,
      app_key: this.config.appKey,
      app_secret: this.config.appSecret,
      param: [params],
    }

    for (let attempt = 1; attempt <= this.maxAttempts; attempt += 1) {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs)

      try {
        const endpoint = operation === "ListarPosEstoque"
          ? this.config.inventoryApiUrl ?? new URL("/api/v1/estoque/consulta/", this.config.apiUrl).toString()
          : this.config.apiUrl
        const response = await this.fetchImpl(endpoint, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        })

        if (response.ok) {
          let parsed: unknown
          try {
            parsed = await response.json()
          } catch (cause) {
            throw new OmieClientError({
              code: "INVALID_RESPONSE",
              operation,
              status: response.status,
              cause,
            })
          }

          if (!isRecord(parsed) && !Array.isArray(parsed)) {
            throw new OmieClientError({
              code: "INVALID_RESPONSE",
              operation,
              status: response.status,
            })
          }

          return parsed as T
        }

        const retryable = response.status === 429 || response.status >= 500
        const code: OmieErrorCode =
          response.status === 429
            ? "RATE_LIMITED"
            : response.status >= 500
              ? "UPSTREAM"
              : "INVALID_RESPONSE"
        if (!retryable || attempt === this.maxAttempts) {
          throw new OmieClientError({
            code,
            operation,
            status: response.status,
            retryable,
          })
        }

        const retryAfter = retryAfterMilliseconds(response)
        const exponential = this.baseBackoffMs * 2 ** (attempt - 1)
        const jitter = Math.round(exponential * 0.25 * this.random())
        const delay = retryAfter ?? exponential + jitter
        this.logger.warn?.("Retrying Omie request", {
          operation,
          attempt,
          status: response.status,
          delayMs: delay,
        })
        await this.sleep(delay)
      } catch (cause) {
        if (cause instanceof OmieClientError) {
          throw cause
        }

        const timedOut = cause instanceof DOMException && cause.name === "AbortError"
        const code: OmieErrorCode = timedOut ? "TIMEOUT" : "NETWORK"
        const retryable = true
        if (attempt === this.maxAttempts) {
          throw new OmieClientError({
            code,
            operation,
            retryable,
            cause,
          })
        }

        const exponential = this.baseBackoffMs * 2 ** (attempt - 1)
        const jitter = Math.round(exponential * 0.25 * this.random())
        const delay = exponential + jitter
        this.logger.warn?.("Retrying Omie request", {
          operation,
          attempt,
          delayMs: delay,
          code,
        })
        await this.sleep(delay)
      } finally {
        clearTimeout(timeout)
      }
    }

    throw new OmieClientError({
      code: "NETWORK",
      operation,
      retryable: false,
    })
  }
}

export const loadOmieConfig = (
  env: NodeJS.ProcessEnv = process.env,
): OmieClientConfig | null => {
  const apiUrl = env.OMIE_API_URL?.trim()
  const appKey = env.OMIE_APP_KEY?.trim()
  const appSecret = env.OMIE_APP_SECRET?.trim()

  if (!apiUrl || !appKey || !appSecret) {
    return null
  }

  return { apiUrl, appKey, appSecret }
}
