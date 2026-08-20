import { model } from "@medusajs/framework/utils"

export const WishlistItem = model
  .define("wishlist_item", {
    id: model.id().primaryKey(),
    wishlist_id: model.text(),
    product_id: model.text(),
  })
  .indexes([
    {
      name: "IDX_wishlist_item_wishlist_product",
      on: ["wishlist_id", "product_id"],
    },
  ])
