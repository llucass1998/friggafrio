import { model } from "@medusajs/framework/utils"

// A customer can have historical soft-deleted wishlists, but only one active
// primary wishlist is allowed by the partial unique index in the migration.
export const Wishlist = model
  .define("wishlist", {
    id: model.id().primaryKey(),
    customer_id: model.text(),
    is_primary: model.boolean().default(true),
  })
  .indexes([
    {
      name: "IDX_wishlist_customer_primary",
      on: ["customer_id", "is_primary"],
    },
  ])
