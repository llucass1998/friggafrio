import { model } from "@medusajs/framework/utils"

export const InstagramSyncState = model
  .define("instagram_sync_state", {
    id: model.id().primaryKey(),
    last_sync_at: model.dateTime().nullable(),
    last_sync_status: model.text().default("idle"),
    last_error_message: model.text().nullable(),
    posts_count: model.number().default(0),
  })

export default InstagramSyncState
