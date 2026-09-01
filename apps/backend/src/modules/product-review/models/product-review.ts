import { model } from "@medusajs/framework/utils"

export enum ProductReviewStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  HIDDEN = "hidden",
}

export const ProductReview = model
  .define("product_review", {
    id: model.id().primaryKey(),
    product_id: model.text(),
    customer_id: model.text(),
    order_id: model.text().nullable(),
    author_name: model.text(),
    rating: model.number(),
    title: model.text().nullable(),
    body: model.text(),
    verified_purchase: model.boolean().default(true),
    status: model.enum(Object.values(ProductReviewStatus)).default(ProductReviewStatus.PENDING),
    admin_reply: model.text().nullable(),
  })
  .indexes([
    { name: "IDX_product_review_product_status", on: ["product_id", "status"] },
    { name: "IDX_product_review_customer_product", on: ["customer_id", "product_id"] },
  ])

export default ProductReview
