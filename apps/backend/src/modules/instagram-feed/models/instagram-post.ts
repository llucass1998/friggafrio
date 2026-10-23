import { model } from "@medusajs/framework/utils"

export const InstagramPost = model
  .define("instagram_post", {
    id: model.id().primaryKey(),
    instagram_id: model.text(),
    caption: model.text().nullable(),
    media_type: model.text().default("IMAGE"),
    media_url: model.text(),
    thumbnail_url: model.text().nullable(),
    permalink: model.text(),
    timestamp: model.dateTime().nullable(),
    is_hidden: model.boolean().default(false),
    order: model.number().default(0),
  })
  .indexes([
    { name: "IDX_instagram_post_instagram_id", on: ["instagram_id"] },
    { name: "IDX_instagram_post_is_hidden", on: ["is_hidden"] },
    { name: "IDX_instagram_post_order", on: ["order"] },
  ])

export default InstagramPost
