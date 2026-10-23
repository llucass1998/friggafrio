import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { INSTAGRAM_FEED_MODULE } from "../../../../../../modules/instagram-feed"
import type InstagramFeedService from "../../../../../../modules/instagram-feed/service"

export async function POST(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const { id } = req.params

  if (!id) {
    res.status(400).json({ error: "MISSING_POST_ID" })
    return
  }

  try {
    const feedService = req.scope.resolve(INSTAGRAM_FEED_MODULE, { allowUnregistered: true }) as InstagramFeedService | undefined
    if (!feedService) {
      res.status(500).json({ error: "INSTAGRAM_FEED_MODULE_NOT_REGISTERED" })
      return
    }

    const updated = await feedService.togglePostVisibility(id)
    if (!updated) {
      res.status(404).json({ error: "POST_NOT_FOUND" })
      return
    }

    res.status(200).json({ success: true, post: updated })
  } catch (error) {
    res.status(500).json({
      error: "FAILED_TO_TOGGLE_POST_VISIBILITY",
      message: error instanceof Error ? error.message : String(error),
    })
  }
}
