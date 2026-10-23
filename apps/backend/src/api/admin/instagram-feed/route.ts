import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { INSTAGRAM_FEED_MODULE } from "../../../modules/instagram-feed"
import { InstagramApiClient } from "../../../integrations/instagram/client"
import { syncInstagramFeed } from "../../../integrations/instagram/sync"
import type InstagramFeedService from "../../../modules/instagram-feed/service"

export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  try {
    const feedService = req.scope.resolve(INSTAGRAM_FEED_MODULE, { allowUnregistered: true }) as InstagramFeedService | undefined
    const client = new InstagramApiClient()

    if (!feedService) {
      res.status(200).json({
        configured: client.isConfigured(),
        masked_token: client.getMaskedToken(),
        sync_state: {
          last_sync_at: null,
          last_sync_status: "idle",
          last_error_message: null,
          posts_count: 0,
        },
        posts: [],
        count: 0,
      })
      return
    }

    const { posts, count } = await feedService.getAllPosts(50, 0)
    const syncState = await feedService.getSyncState()

    res.status(200).json({
      configured: client.isConfigured(),
      masked_token: client.getMaskedToken(),
      sync_state: syncState,
      posts,
      count,
    })
  } catch (error) {
    res.status(500).json({
      error: "FAILED_TO_LOAD_INSTAGRAM_FEED_STATUS",
      message: error instanceof Error ? error.message : String(error),
    })
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  try {
    const feedService = req.scope.resolve(INSTAGRAM_FEED_MODULE, { allowUnregistered: true }) as InstagramFeedService | undefined
    if (!feedService) {
      res.status(500).json({ error: "INSTAGRAM_FEED_MODULE_NOT_REGISTERED" })
      return
    }

    const client = new InstagramApiClient()
    const result = await syncInstagramFeed(feedService, client)
    res.status(200).json(result)
  } catch (error) {
    res.status(500).json({
      error: "INSTAGRAM_SYNC_FAILED",
      message: error instanceof Error ? error.message : String(error),
    })
  }
}
