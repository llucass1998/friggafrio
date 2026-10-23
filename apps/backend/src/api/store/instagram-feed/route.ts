import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { INSTAGRAM_FEED_MODULE } from "../../../modules/instagram-feed"
import { SNAPWIDGET_REAL_POSTS } from "../../../integrations/instagram/snapwidget-feed"
import type InstagramFeedService from "../../../modules/instagram-feed/service"

const OFFICIAL_PROFILE = {
  handle: "@frigga.frio",
  profile_url: "https://www.instagram.com/frigga.frio/",
} as const

export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  try {
    const feedService = req.scope.resolve(INSTAGRAM_FEED_MODULE, { allowUnregistered: true }) as InstagramFeedService | undefined
    if (!feedService) {
      res.status(200).json({
        posts: [],
        count: 0,
        last_sync_at: null,
        profile: OFFICIAL_PROFILE,
      })
      return
    }

    let posts = await feedService.getPublicFeed(12)
    const syncState = await feedService.getSyncState()

    if (!posts || posts.length === 0) {
      await feedService.saveSyncedPosts(SNAPWIDGET_REAL_POSTS).catch(() => {})
      posts = await feedService.getPublicFeed(12).catch(() => SNAPWIDGET_REAL_POSTS as any[])
    }

    const effectivePosts = posts && posts.length > 0 ? posts : SNAPWIDGET_REAL_POSTS
    const sanitizedPosts = effectivePosts.map((p) => ({
      id: p.id,
      instagram_id: p.instagram_id,
      caption: p.caption || "",
      media_type: p.media_type,
      media_url: p.media_url,
      thumbnail_url: p.thumbnail_url || null,
      permalink: p.permalink,
      timestamp: p.timestamp ? new Date(p.timestamp).toISOString() : null,
    }))

    res.status(200).json({
      posts: sanitizedPosts,
      count: sanitizedPosts.length,
      last_sync_at: syncState?.last_sync_at ? new Date(syncState.last_sync_at).toISOString() : new Date().toISOString(),
      profile: OFFICIAL_PROFILE,
    })
  } catch (error) {
    // Fail-closed to client: return graceful empty payload instead of crashing public Home
    res.status(200).json({
      posts: [],
      count: 0,
      last_sync_at: null,
      profile: OFFICIAL_PROFILE,
    })
  }
}
