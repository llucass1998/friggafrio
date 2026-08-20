import { model } from "@medusajs/framework/utils"

export const PasswordResetToken = model
  .define("password_reset_token", {
    id: model.id().primaryKey(),
    token_hash: model.text().unique(),
    customer_email: model.text(),
    expires_at: model.dateTime(),
    consumed_at: model.dateTime().nullable(),
  })
  .indexes([
    {
      name: "IDX_password_reset_token_customer_active",
      on: ["customer_email", "consumed_at"],
      where: '"deleted_at" IS NULL AND "consumed_at" IS NULL',
    },
  ])
