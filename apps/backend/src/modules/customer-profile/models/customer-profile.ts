import { model } from "@medusajs/framework/utils"

export const CustomerProfile = model.define("customer_profile", {
  id: model.id().primaryKey(),
  customer_id: model.text().unique(),
  document_type: model.enum(["cpf", "cnpj"]).default("cpf"),
  document: model.text().unique(), // We will store this encrypted/hashed ideally, but for now we store the raw or normalized value.
  document_hash: model.text().nullable(), // Hash for searching without decrypting
  document_last_four: model.text().nullable(),
  corporate_name: model.text().nullable(),
  state_inscription: model.text().nullable(),
  is_state_inscription_exempt: model.boolean().default(false),
  accepted_terms_at: model.dateTime().nullable(),
  accepted_terms_version: model.text().nullable(),
  marketing_consent: model.boolean().default(false),
})
