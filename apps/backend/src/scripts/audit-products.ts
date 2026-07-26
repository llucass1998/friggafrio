import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { MedusaContainer } from "@medusajs/framework/types";

export default async function audit_products({
  container,
}: {
  container: MedusaContainer;
}) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);

  const { data: products } = await query.graph({
    entity: "product",
    fields: [
      "id", "title", "handle", "status", "thumbnail", "metadata", "deleted_at",
      "categories.*",
      "variants.*",
      "variants.prices.*",
      "variants.inventory_items.*",
      "sales_channels.*",
    ],
  });

  const { data: regions } = await query.graph({
    entity: "region",
    fields: ["id", "name", "currency_code", "country_code"],
  });

  const { data: salesChannels } = await query.graph({
    entity: "sales_channel",
    fields: ["id", "name"],
  });

  const { data: stockLocations } = await query.graph({
    entity: "stock_location",
    fields: ["id", "name"],
  });

  const { data: shippingProfiles } = await query.graph({
    entity: "shipping_profile",
    fields: ["id", "name"],
  });

  const fs = require("fs");
  const path = require("path");

  const report = {
    products,
    regions,
    salesChannels,
    stockLocations,
    shippingProfiles
  };

  fs.writeFileSync(
    path.join(process.cwd(), "../../docs/catalog/audit-results.json"),
    JSON.stringify(report, null, 2)
  );

  logger.info("Auditoria concluída. Resultados em docs/catalog/audit-results.json");
}
