import { model } from "@medusajs/framework/utils"
import { FISCAL_STATES } from "../../../integrations/omie/fiscal-types"

export const FiscalOrder = model
  .define("fiscal_order", {
    id: model.id().primaryKey(),
    medusa_order_id: model.text().unique(),
    integration_code: model.text().unique(),
    state: model.enum([...FISCAL_STATES]).default("NOT_ELIGIBLE"),
    environment: model.enum(["homologation", "production"]).default("homologation"),
    omie_customer_id: model.text().nullable(),
    omie_sales_order_id: model.text().nullable(),
    nfe_id: model.text().nullable(),
    nfe_number: model.text().nullable(),
    nfe_series: model.text().nullable(),
    nfe_access_key: model.text().nullable(),
    nfe_authorized_at: model.dateTime().nullable(),
    xml_url: model.text().nullable(),
    danfe_url: model.text().nullable(),
    attempts: model.number().default(0),
    last_error: model.text().nullable(),
    external_event_id: model.text().nullable(),
  })
  .indexes([
    { name: "IDX_fiscal_order_state", on: ["state"] },
    { name: "IDX_fiscal_order_omie_customer", on: ["omie_customer_id"] },
    { name: "IDX_fiscal_order_nfe_id", on: ["nfe_id"] },
  ])
  .checks([
    { name: "fiscal_order_attempts_nonnegative_check", expression: (columns) => `${columns.attempts} >= 0` },
  ])

export default FiscalOrder
