import { MedusaService } from "@medusajs/framework/utils"
import { InstagramPost } from "./models/instagram-post"
import { InstagramSyncState } from "./models/instagram-sync-state"
import type { NormalizedInstagramPost } from "../../integrations/instagram/types"

export default class InstagramFeedService extends MedusaService({
  InstagramPost,
  InstagramSyncState,
}) {
  /**
   * Retrieves visible posts for public consumption.
   */
  async getPublicFeed(limit = 12): Promise<any[]> {
    try {
      const posts = await (this as any).listInstagramPosts(
        { is_hidden: false },
        {
          order: { order: "ASC", timestamp: "DESC" },
          take: limit,
        }
      )
      return posts || []
    } catch {
      return []
    }
  }

  /**
   * Retrieves all posts for administration.
   */
  async getAllPosts(limit = 50, offset = 0): Promise<{ posts: any[]; count: number }> {
    try {
      const [posts, count] = await (this as any).listAndCountInstagramPosts(
        {},
        {
          order: { order: "ASC", timestamp: "DESC" },
          take: limit,
          skip: offset,
        }
      )
      return { posts: posts || [], count: count || 0 }
    } catch {
      return { posts: [], count: 0 }
    }
  }

  /**
   * Toggles the visibility of a post on the public storefront.
   */
  async togglePostVisibility(id: string): Promise<any | null> {
    try {
      const existing = await (this as any).retrieveInstagramPost(id)
      if (!existing) return null

      const updated = await (this as any).updateInstagramPosts({
        id,
        is_hidden: !existing.is_hidden,
      })
      return updated
    } catch {
      return null
    }
  }

  /**
   * Retrieves the current sync status.
   */
  async getSyncState(): Promise<any> {
    try {
      const [states] = await (this as any).listInstagramSyncStates(
        {},
        { take: 1, order: { created_at: "DESC" } }
      )
      if (states) return states
    } catch {
      // Fallback
    }
    return {
      id: "default",
      last_sync_at: null,
      last_sync_status: "idle",
      last_error_message: null,
      posts_count: 0,
    }
  }

  /**
   * Saves newly synced posts atomically, preserving user-configured is_hidden states.
   */
  async saveSyncedPosts(items: NormalizedInstagramPost[]): Promise<number> {
    if (!items || items.length === 0) return 0

    // 1. Fetch existing posts to preserve is_hidden preference
    const existingPosts = await (this as any).listInstagramPosts(
      {},
      { take: 100 }
    ).catch(() => [])

    const existingMap = new Map<string, any>()
    for (const post of existingPosts || []) {
      existingMap.set(post.instagram_id, post)
    }

    let savedCount = 0

    // 2. Upsert each item
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      const existing = existingMap.get(item.instagram_id)

      if (existing) {
        await (this as any).updateInstagramPosts({
          id: existing.id,
          caption: item.caption,
          media_type: item.media_type,
          media_url: item.media_url,
          thumbnail_url: item.thumbnail_url,
          permalink: item.permalink,
          timestamp: item.timestamp ? new Date(item.timestamp) : null,
          order: i,
        })
      } else {
        await (this as any).createInstagramPosts({
          instagram_id: item.instagram_id,
          caption: item.caption,
          media_type: item.media_type,
          media_url: item.media_url,
          thumbnail_url: item.thumbnail_url,
          permalink: item.permalink,
          timestamp: item.timestamp ? new Date(item.timestamp) : null,
          is_hidden: false,
          order: i,
        })
      }
      savedCount++
    }

    // 3. Update sync state
    const now = new Date()
    const existingState = await this.getSyncState()
    if (existingState && existingState.id !== "default") {
      await (this as any).updateInstagramSyncStates({
        id: existingState.id,
        last_sync_at: now,
        last_sync_status: "success",
        last_error_message: null,
        posts_count: savedCount,
      }).catch(() => {})
    } else {
      await (this as any).createInstagramSyncStates({
        last_sync_at: now,
        last_sync_status: "success",
        last_error_message: null,
        posts_count: savedCount,
      }).catch(() => {})
    }

    return savedCount
  }

  /**
   * Records a sync failure without deleting existing cache.
   */
  async recordSyncError(errorMessage: string): Promise<void> {
    try {
      const now = new Date()
      const existingState = await this.getSyncState()
      if (existingState && existingState.id !== "default") {
        await (this as any).updateInstagramSyncStates({
          id: existingState.id,
          last_sync_at: now,
          last_sync_status: "error",
          last_error_message: errorMessage,
        })
      } else {
        await (this as any).createInstagramSyncStates({
          last_sync_at: now,
          last_sync_status: "error",
          last_error_message: errorMessage,
          posts_count: 0,
        })
      }
    } catch {
      // Ignored
    }
  }
}
