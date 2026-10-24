import {
  OmieClientConfig,
  OmieClientErrorOptions,
  OmieErrorCode,
  OmieLogger,
  OmieRecord,
  OmieRequestPayload,
  OmieTransportDependencies,
} from "./types"
import { getOmieOperation, WRITE_OPERATIONS } from "./endpoints"

const DEFAULT_TIMEOUT_MS = 10_000
const DEFAULT_MAX_ATTEMPTS = 3
const DEFAULT_BASE_BACKOFF_MS = 250
const MIN_CALL_INTERVAL_MS = 250
const DEFAULT_OMIE_ORIGIN = "https://app.omie.com.br"

export { WRITE_OPERATIONS }

interface SharedRateLimitState {
  nextStartAt: number
}

const rateLimitersByAppKey = new Map<string, SharedRateLimitState>()

const sleepFor = (milliseconds: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, milliseconds))

const isRecord = (value: unknown): value is OmieRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value)

const normalizedOrigin = (baseUrl: string | undefined): string => {
  const candidate = baseUrl?.trim() || DEFAULT_OMIE_ORIGIN
  try {
    const url = new URL(candidate.startsWith("http://") || candidate.startsWith("https://") ? candidate : `https://${candidate}`)
    return url.origin
  } catch {
    return DEFAULT_OMIE_ORIGIN
  }
}

const endpointFor = (operation: string, baseUrl: string | undefined): string | null => {
  const definition = getOmieOperation(operation)
  if (!definition) return null
  return new URL(`/api/v1/${definition.endpoint}`, normalizedOrigin(baseUrl)).toString()
}

/**
 * Resolves only registered operations. The nullable result intentionally forces
 * callers to handle unknown or ambiguous operations explicitly.
 */
export const RESOLVE_OMIE_ENDPOINT = (operation: string, baseUrl = DEFAULT_OMIE_ORIGIN): string | null =>
  endpointFor(operation, baseUrl)

export const isWriteOperation = (operation: string): boolean =>
  getOmieOperation(operation)?.kind === "write"

const retryAfterMilliseconds = (response: Response): number | null => {
  const value = response.headers.get("retry-after")
  if (!value) return null

  const seconds = Number(value)
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.min(seconds * 1_000, 60_000)
  }

  const timestamp = Date.parse(value)
  return Number.isNaN(timestamp) ? null : Math.max(0, Math.min(timestamp - Date.now(), 60_000))
}

const isAbortError = (cause: unknown): boolean =>
  (typeof DOMException !== "undefined" && cause instanceof DOMException && cause.name === "AbortError") ||
  (isRecord(cause) && cause.name === "AbortError")

const sanitizedFaultField = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined
  const normalized = value.trim()
  if (!normalized || normalized.length > 160) return undefined
  // Error fields can be logged by callers. Retain only bounded diagnostic tokens,
  // never free-form text that could contain customer data or credentials.
  return /^[A-Za-z0-9_.:-]+$/.test(normalized) ? normalized : undefined
}

const faultFrom = (value: unknown): { code?: string; message?: string } | null => {
  if (!isRecord(value)) return null

  const nested = isRecord(value.fault) ? value.fault : null
  const code = sanitizedFaultField(value.faultcode) ?? sanitizedFaultField(nested?.faultcode)
  const message = sanitizedFaultField(value.faultstring) ?? sanitizedFaultField(nested?.faultstring)
  return value.faultstring || value.faultcode || nested?.faultstring || nested?.faultcode
    ? { code, message: message ?? "Falha retornada pelo Omie; conteúdo protegido" } : null
}

export class OmieClientError extends Error {
  readonly code: OmieErrorCode
  readonly operation: string
  readonly status?: number
  readonly retryable: boolean
  readonly upstreamCode?: string
  readonly upstreamMessage?: string

  constructor(options: OmieClientErrorOptions) {
    super(`Omie ${options.operation} failed (${options.code})`)
    this.name = "OmieClientError"
    this.code = options.code
    this.operation = options.operation
    this.status = options.status
    this.retryable = options.retryable ?? false

    const cause = isRecord(options.cause) ? options.cause : null
    const upstreamCode = sanitizedFaultField(cause?.code)
    const upstreamMessage = sanitizedFaultField(cause?.message)
    if (upstreamCode) this.upstreamCode = upstreamCode
    else delete (this as unknown as Record<string, unknown>).upstreamCode
    if (upstreamMessage) this.upstreamMessage = upstreamMessage
    else delete (this as unknown as Record<string, unknown>).upstreamMessage
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
  private readonly rateLimiter: SharedRateLimitState

  constructor(
    private readonly config: OmieClientConfig,
    dependencies: OmieTransportDependencies = {},
  ) {
    this.fetchImpl = dependencies.fetchImpl ?? fetch
    this.sleep = dependencies.sleep ?? sleepFor
    this.random = dependencies.random ?? Math.random
    this.logger = dependencies.logger ?? {}
    this.timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS
    this.maxAttempts = Math.min(DEFAULT_MAX_ATTEMPTS, Math.max(1, config.maxAttempts ?? DEFAULT_MAX_ATTEMPTS))
    this.baseBackoffMs = Math.max(0, config.baseBackoffMs ?? DEFAULT_BASE_BACKOFF_MS)

    const key = config.appKey.trim()
    const existing = rateLimitersByAppKey.get(key)
    if (existing) {
      this.rateLimiter = existing
    } else {
      this.rateLimiter = { nextStartAt: 0 }
      rateLimitersByAppKey.set(key, this.rateLimiter)
    }
  }

  private throttleDelay(): number {
    const now = Date.now()
    const scheduledStart = Math.max(now, this.rateLimiter.nextStartAt)
    this.rateLimiter.nextStartAt = scheduledStart + MIN_CALL_INTERVAL_MS
    return scheduledStart - now
  }

  private retryDelay(attempt: number, response?: Response): number {
    const retryAfter = response ? retryAfterMilliseconds(response) : null
    if (retryAfter !== null) return retryAfter
    const exponential = this.baseBackoffMs * 2 ** (attempt - 1)
    return exponential + Math.round(exponential * 0.25 * this.random())
  }

  private retryLog(operation: string, attempt: number, context: Record<string, unknown>): void {
    this.logger.warn?.("Retrying Omie request", { operation, attempt, ...context })
  }

  async request<T>(operation: string, params: OmieRecord = {}): Promise<T> {
    const definition = getOmieOperation(operation)
    if (!definition) {
      throw new OmieClientError({ code: "INVALID_RESPONSE", operation, retryable: false })
    }

    if (definition.kind === "write" && this.config.writesEnabled !== true) {
      throw new OmieClientError({ code: "READ_ONLY_VIOLATION", operation, retryable: false })
    }

    if (!this.config.apiUrl || !this.config.appKey || !this.config.appSecret) {
      throw new OmieConfigurationError(operation)
    }

    const endpoint = operation === "ListarPosEstoque" && this.config.inventoryApiUrl?.trim()
      ? this.config.inventoryApiUrl.trim()
      : endpointFor(operation, this.config.apiUrl)
    if (!endpoint) {
      throw new OmieClientError({ code: "INVALID_RESPONSE", operation, retryable: false })
    }

    const payload: OmieRequestPayload = {
      call: operation,
      app_key: this.config.appKey,
      app_secret: this.config.appSecret,
      param: [params],
    }

    for (let attempt = 1; attempt <= this.maxAttempts; attempt += 1) {
      const delay = this.throttleDelay()
      if (delay > 0) await this.sleep(delay)
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs)

      try {
        const response = await this.fetchImpl(endpoint, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        })
        const responseFault = response.status === 200 || response.status >= 500
          ? await this.readFault(response, operation)
          : null

        if (responseFault) throw responseFault

        if (response.ok) {
          let parsed: unknown
          try {
            parsed = await response.json()
          } catch {
            throw new OmieClientError({
              code: "INVALID_RESPONSE",
              operation,
              status: response.status,
              retryable: false,
            })
          }

          if (!isRecord(parsed) && !Array.isArray(parsed)) {
            throw new OmieClientError({
              code: "INVALID_RESPONSE",
              operation,
              status: response.status,
              retryable: false,
            })
          }

          return parsed as T
        }

        const retryable = response.status === 429 || (response.status >= 500 && definition.kind === "read")
        const code: OmieErrorCode = response.status === 429
          ? "RATE_LIMITED"
          : response.status >= 500
            ? "UPSTREAM"
            : "INVALID_RESPONSE"
        if (!retryable || attempt === this.maxAttempts) {
          throw new OmieClientError({ code, operation, status: response.status, retryable })
        }

        const delay = this.retryDelay(attempt, response)
        this.retryLog(operation, attempt, { status: response.status, delayMs: delay })
        await this.sleep(delay)
      } catch (cause) {
        if (cause instanceof OmieClientError) throw cause

        const code: OmieErrorCode = isAbortError(cause) ? "TIMEOUT" : "NETWORK"
        // A completed write may have reached Omie even if no response was received.
        const retryable = definition.kind === "read"
        if (!retryable || attempt === this.maxAttempts) {
          throw new OmieClientError({ code, operation, retryable })
        }

        const delay = this.retryDelay(attempt)
        this.retryLog(operation, attempt, { delayMs: delay, code })
        await this.sleep(delay)
      } finally {
        clearTimeout(timeout)
      }
    }

    throw new OmieClientError({ code: "NETWORK", operation, retryable: false })
  }

  private async readFault(response: Response, operation: string): Promise<OmieClientError | null> {
    let body: unknown
    try {
      body = await response.clone().json()
    } catch {
      return null
    }

    const fault = faultFrom(body)
    return fault
      ? new OmieClientError({
        code: "SOAP_FAULT",
        operation,
        status: response.status,
        retryable: false,
        cause: fault,
      })
      : null
  }
}

export const loadOmieConfig = (
  env: NodeJS.ProcessEnv = process.env,
): OmieClientConfig | null => {
  const apiUrl = env.OMIE_API_URL?.trim() || "https://app.omie.com.br/api/v1/geral/produtos/"
  const appKey = env.OMIE_APP_KEY?.trim()
  const appSecret = env.OMIE_APP_SECRET?.trim()
  const inventoryApiUrl = env.OMIE_INVENTORY_API_URL?.trim()
  const writesEnabled = env.OMIE_FISCAL_WRITES_ENABLED === "true"

  if (!apiUrl || !appKey || !appSecret) return null
  return { apiUrl, appKey, appSecret, inventoryApiUrl, writesEnabled }
}
