import { InstagramApiClient } from "./client"
import { normalizeMetaMediaItem } from "./normalizer"
import type { InstagramSyncResult, NormalizedInstagramPost } from "./types"
import type InstagramFeedService from "../../modules/instagram-feed/service"

let isSyncRunning = false

export async function syncInstagramFeed(
  feedService: InstagramFeedService,
  client = new InstagramApiClient()
): Promise<InstagramSyncResult> {
  if (isSyncRunning) {
    return {
      success: false,
      synced_count: 0,
      total_count: 0,
      error: "SYNC_ALREADY_IN_PROGRESS",
      synced_at: new Date().toISOString(),
    }
  }

  isSyncRunning = true

  try {
    if (!client.isConfigured()) {
      return {
        success: false,
        synced_count: 0,
        total_count: 0,
        error: "INSTAGRAM_NOT_CONFIGURED",
        synced_at: new Date().toISOString(),
      }
    }

    const rawItems = await client.fetchRecentMedia(12)
    const normalizedList: NormalizedInstagramPost[] = []

    for (const raw of rawItems) {
      const normalized = normalizeMetaMediaItem(raw)
      if (normalized) {
        normalizedList.push(normalized)
      }
    }

    const savedCount = await feedService.saveSyncedPosts(normalizedList)

    return {
      success: true,
      synced_count: savedCount,
      total_count: normalizedList.length,
      synced_at: new Date().toISOString(),
    }
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    // Record error safely without storing credentials
    const safeError = errorMsg.replace(/access_token=[^&]+/g, "access_token=REDACTED")
    await feedService.recordSyncError(safeError).catch(() => {})

    return {
      success: false,
      synced_count: 0,
      total_count: 0,
      error: safeError,
      synced_at: new Date().toISOString(),
    }
  } finally {
    isSyncRunning = false
  }
}
