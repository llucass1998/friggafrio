import type { MedusaContainer } from "@medusajs/framework/types"
import { INSTAGRAM_FEED_MODULE } from "../modules/instagram-feed"
import { syncInstagramFeed } from "../integrations/instagram/sync"
import type InstagramFeedService from "../modules/instagram-feed/service"

export default async function syncInstagramFeedJob(container: MedusaContainer) {
  try {
    const feedService = container.resolve(INSTAGRAM_FEED_MODULE) as InstagramFeedService
    if (!feedService) return

    await syncInstagramFeed(feedService)
  } catch (error) {
    console.error(
      "[ScheduledJob: sync-instagram-feed] Execution error:",
      error instanceof Error ? error.message : error
    )
  }
}

export const config = {
  name: "sync-instagram-feed",
  schedule: process.env.INSTAGRAM_SYNC_SCHEDULE || "*/30 * * * *",
}
