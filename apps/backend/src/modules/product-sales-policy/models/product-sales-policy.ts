import { model } from "@medusajs/framework/utils";

export const ProductSalesPolicy = model.define("product_sales_policy", {
  id: model.id().primaryKey(),
  product_id: model.text().unique(),
  is_quote_only: model.boolean().default(false),
  is_inflammatory: model.boolean().default(false),
  requires_contact: model.boolean().default(false),
});
