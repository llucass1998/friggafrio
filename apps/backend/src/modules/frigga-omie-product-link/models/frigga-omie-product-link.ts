import { model } from "@medusajs/framework/utils"

export const FriggaOmieProductLink = model.define("frigga_omie_product_link", {
  id: model.id().primaryKey(),
  code_display: model.text(),
  code_normalized: model.text(),
  product_id: model.text(),
  variant_id: model.text().nullable(),
  source: model.text().default("manual"),
})
