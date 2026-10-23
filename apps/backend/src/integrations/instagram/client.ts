import type { MetaInstagramMediaItem, MetaInstagramMediaResponse } from "./types"

export interface InstagramClientConfig {
  accessToken?: string
  userId?: string
  apiVersion?: string
  baseUrl?: string
  timeoutMs?: number
  maxRetries?: number
}

export class InstagramApiClient {
  private readonly accessToken?: string
  private readonly userId?: string
  private readonly apiVersion: string
  private readonly baseUrl: string
  private readonly timeoutMs: number
  private readonly maxRetries: number

  constructor(config: InstagramClientConfig = {}) {
    this.accessToken = config.accessToken ?? process.env.INSTAGRAM_ACCESS_TOKEN
    this.userId = config.userId ?? process.env.INSTAGRAM_USER_ID
    this.apiVersion = config.apiVersion ?? process.env.INSTAGRAM_GRAPH_API_VERSION ?? "v21.0"
    this.baseUrl = config.baseUrl ?? process.env.INSTAGRAM_GRAPH_API_BASE_URL ?? "https://graph.instagram.com"
    this.timeoutMs = config.timeoutMs ?? 10_000
    this.maxRetries = config.maxRetries ?? 2
  }

  public isConfigured(): boolean {
    return Boolean(this.accessToken && this.accessToken.trim().length > 0)
  }

  public getMaskedToken(): string | null {
    if (!this.accessToken) return null
    const trimmed = this.accessToken.trim()
    if (trimmed.length <= 8) return "****"
    return `${trimmed.slice(0, 4)}...${trimmed.slice(-4)}`
  }

  /**
   * Fetches the latest published media from the official Instagram Graph API.
   */
  public async fetchRecentMedia(limit = 12): Promise<MetaInstagramMediaItem[]> {
    if (!this.isConfigured()) {
      throw new Error("INSTAGRAM_NOT_CONFIGURED: INSTAGRAM_ACCESS_TOKEN is missing or empty.")
    }

    const endpoint = this.userId
      ? `${this.baseUrl}/${this.apiVersion}/${encodeURIComponent(this.userId)}/media`
      : `${this.baseUrl}/me/media`

    const fields = "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp"
    const url = new URL(endpoint)
    url.searchParams.set("fields", fields)
    url.searchParams.set("limit", String(Math.min(limit, 25)))
    url.searchParams.set("access_token", this.accessToken!)

    let lastError: Error | null = null

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const backoffMs = Math.min(500 * Math.pow(2, attempt), 2000)
          await new Promise((resolve) => setTimeout(resolve, backoffMs))
        }

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs)

        const response = await fetch(url.toString(), {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          let errorDetail = `HTTP ${response.status}`
          try {
            const errJson = (await response.json()) as MetaInstagramMediaResponse
            if (errJson?.error?.message) {
              errorDetail = `${errorDetail}: ${errJson.error.message}`
            }
          } catch {
            // Ignore JSON parse errors for non-200 responses
          }
          throw new Error(`META_API_ERROR: ${errorDetail}`)
        }

        const data = (await response.json()) as MetaInstagramMediaResponse
        if (!data || !Array.isArray(data.data)) {
          return []
        }

        return data.data
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(String(err))
        // If it's a configuration or auth error (401/400), don't retry
        if (lastError.message.includes("HTTP 401") || lastError.message.includes("HTTP 400")) {
          break
        }
      }
    }

    throw lastError ?? new Error("META_API_UNKNOWN_ERROR")
  }
}
