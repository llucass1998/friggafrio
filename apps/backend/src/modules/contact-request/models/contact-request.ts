import { model } from "@medusajs/framework/utils";

export enum ContactRequestStatus {
  RECEIVED = "received",
  READ = "read",
  RESOLVED = "resolved",
  SPAM = "spam",
}

export const ContactRequest = model
  .define("contact_request", {
    id: model.id({ prefix: "creq" }).primaryKey(),
    name: model.text(),
    email: model.text(),
    phone: model.text().nullable(),
    subject: model.text().nullable(),
    message: model.text(),
    status: model.enum(Object.values(ContactRequestStatus)).default(ContactRequestStatus.RECEIVED),
    source: model.text().default("storefront_home"),
    notification_sent: model.boolean().default(false),
  })
  .indexes([
    {
      name: "IDX_contact_request_status",
      on: ["status"],
      where: '"deleted_at" IS NULL',
    },
    {
      name: "IDX_contact_request_email",
      on: ["email"],
      where: '"deleted_at" IS NULL',
    },
  ]);
