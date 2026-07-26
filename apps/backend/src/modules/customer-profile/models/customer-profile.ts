import { model } from "@medusajs/framework/utils";

export const CustomerProfile = model
  .define("customer_profile", {
    id: model.id().primaryKey(),
    customer_id: model.text().unique(),
    document_type: model.enum(["cpf", "cnpj"]).default("cpf"),
    document_ciphertext: model.text().nullable(),
    document_iv: model.text().nullable(),
    document_auth_tag: model.text().nullable(),
    document_hash: model.text().unique().nullable(),
    document_last_four: model.text().nullable(),
    corporate_name: model.text().nullable(),
    state_inscription: model.text().nullable(),
    is_state_inscription_exempt: model.boolean().default(false),
    accepted_terms_at: model.dateTime().nullable(),
    accepted_terms_version: model.text().nullable(),
    marketing_consent: model.boolean().default(false),
  })
  .indexes([
    {
      name: "IDX_customer_profile_terms_version",
      on: ["accepted_terms_version"],
      where: '"deleted_at" IS NULL AND "accepted_terms_version" IS NOT NULL',
    },
  ])
  .checks([
    {
      name: "customer_profile_document_bundle_check",
      expression: (columns) =>
        `((${columns.document_ciphertext} IS NULL AND ${columns.document_iv} IS NULL AND ${columns.document_auth_tag} IS NULL AND ${columns.document_hash} IS NULL AND ${columns.document_last_four} IS NULL) OR (${columns.document_ciphertext} IS NOT NULL AND ${columns.document_iv} IS NOT NULL AND ${columns.document_auth_tag} IS NOT NULL AND ${columns.document_hash} IS NOT NULL AND ${columns.document_last_four} IS NOT NULL))`,
    },
    {
      name: "customer_profile_terms_bundle_check",
      expression: (columns) =>
        `((${columns.accepted_terms_at} IS NULL AND ${columns.accepted_terms_version} IS NULL) OR (${columns.accepted_terms_at} IS NOT NULL AND ${columns.accepted_terms_version} IS NOT NULL))`,
    },
  ]);
