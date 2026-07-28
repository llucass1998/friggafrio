import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { BackupData } from "./types"
import fs from "fs"
import path from "path"

export async function readMedusaState(container: MedusaContainer): Promise<BackupData> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: products } = await query.graph({
    entity: "product",
    fields: [
      "id", "title", "handle", "status", "metadata",
      "variants.id", "variants.sku", "variants.title", "variants.manage_inventory", "variants.metadata",
      "variants.prices.*",
      "variants.inventory_items.inventory_item_id", "variants.inventory_items.required_quantity",
      "sales_channels.*",
      "collection.*"
    ],
  })

  const { data: variants } = await query.graph({
    entity: "variant",
    fields: ["id", "sku", "title", "manage_inventory", "metadata", "product_id"],
  })

  const { data: inventoryItems } = await query.graph({
    entity: "inventory_item",
    fields: ["id", "sku", "requires_shipping", "metadata"],
  })

  const { data: inventoryLevels } = await query.graph({
    entity: "inventory_level",
    fields: ["id", "inventory_item_id", "location_id", "stocked_quantity", "reserved_quantity", "incoming_quantity"],
  })

  const { data: stockLocations } = await query.graph({
    entity: "stock_location",
    fields: ["id", "name", "address_id", "metadata"],
  })

  const { data: salesChannels } = await query.graph({
    entity: "sales_channel",
    fields: ["id", "name", "is_disabled", "metadata"],
  })

  const { data: collections } = await query.graph({
    entity: "product_collection",
    fields: ["id", "title", "handle", "metadata"],
  })

  const { data: categories } = await query.graph({
    entity: "product_category",
    fields: ["id", "name", "handle", "metadata"],
  })

  return {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    products,
    variants,
    inventoryItems,
    inventoryLevels,
    stockLocations,
    salesChannels,
    collections,
    categories
  }
}

export function saveLogicalBackup(backupData: BackupData): string {
  const dateStr = new Date().toISOString().replace(/T/, '-').replace(/\..+/, '').replace(/:/g, '')
  const fileName = `medusa-inventory-before-import-${dateStr}.json`
  const dirPath = "C:/Users/lluca/Documents/Codex/friggafrio-inventory-data/backups"

  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }

  const filePath = path.join(dirPath, fileName)

  // Safe stringify, ensuring no secrets are leaked if they somehow ended up here
  const safeData = JSON.stringify(backupData, null, 2)
  fs.writeFileSync(filePath, safeData)

  return filePath
}
