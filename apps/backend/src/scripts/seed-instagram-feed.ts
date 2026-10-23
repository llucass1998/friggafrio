import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { INSTAGRAM_FEED_MODULE } from "../modules/instagram-feed"
import { SNAPWIDGET_REAL_POSTS } from "../integrations/instagram/snapwidget-feed"
import type InstagramFeedService from "../modules/instagram-feed/service"

export default async function seedInstagramFeed({ container }: ExecArgs): Promise<void> {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  try {
    const feedService = container.resolve(INSTAGRAM_FEED_MODULE) as InstagramFeedService
    const count = await feedService.saveSyncedPosts(SNAPWIDGET_REAL_POSTS)
    logger.info(`[seed-instagram-feed] Successfully seeded ${count} real Instagram posts from SnapWidget.`)
  } catch (error) {
    logger.error(
      `[seed-instagram-feed] Failed to seed Instagram feed: ${
        error instanceof Error ? error.message : String(error)
      }`
    )
  }
}
