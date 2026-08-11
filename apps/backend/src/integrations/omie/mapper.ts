import {
  CommercialApproval,
  CommercialStatus,
  NormalizedInventory,
  NormalizedPrice,
  NormalizedProduct,
  NormalizedVariant,
  OmieProductRecord,
  OmieRecord,
} from "./types.js"

const firstValue = (record: OmieRecord, keys: readonly string[]): unknown => {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) {
      return record[key]
    }
  }
  return null
}

const stringValue = (record: OmieRecord, keys: readonly string[]): string | null => {
  const value = firstValue(record, keys)
  return typeof value === "string" && value.trim() ? value.trim() : null
}

const numberValue = (record: OmieRecord, keys: readonly string[]): number | null => {
  const value = firstValue(record, keys)
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.replace(",", "."))
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

const stringArrayValue = (record: OmieRecord, keys: readonly string[]): string[] => {
  const value = firstValue(record, keys)
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean)
  }
  if (typeof value === "string") {
    return value.split(",").map((item) => item.trim()).filter(Boolean)
  }
  return []
}

const asRecord = (value: unknown): OmieRecord | null =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as OmieRecord)
    : null

const asRecords = (value: unknown): OmieRecord[] =>
  Array.isArray(value)
    ? value.map(asRecord).filter((item): item is OmieRecord => item !== null)
    : []

const priceFrom = (record: OmieRecord): NormalizedPrice => {
  const priceKeys = ["approved_price_brl", "preco_venda", "valor_unitario", "preco"]
  const sourceField = priceKeys.find((key) => record[key] !== undefined && record[key] !== null) ?? null
  return {
    amount: numberValue(record, priceKeys),
    currency: stringValue(record, ["currency", "moeda", "codigo_moeda"]),
    sourceField,
  }
}

const inventoryFrom = (record: OmieRecord): NormalizedInventory => {
  const inventoryKeys = ["initial_inventory", "quantidade_estoque", "estoque", "saldo_estoque"]
  const sourceField = inventoryKeys.find((key) => record[key] !== undefined && record[key] !== null) ?? null
  return {
    quantity: numberValue(record, inventoryKeys),
    location: stringValue(record, ["stock_location", "local_estoque", "localizacao"]),
    sourceField,
  }
}

export const commercialStatusFor = (
  approval: CommercialApproval,
  price: NormalizedPrice,
  inventory: NormalizedInventory,
): CommercialStatus => {
  const approved = Object.values(approval).every(Boolean)
  return approved && price.amount !== null && inventory.quantity !== null
    ? "SELLABLE"
    : "QUOTE_ONLY"
}

const variantFrom = (record: OmieRecord): NormalizedVariant => {
  const approval: CommercialApproval = {
    product: false,
    price: false,
    inventory: false,
    fiscal: false,
    shipping: false,
  }
  const price = priceFrom(record)
  const inventory = inventoryFrom(record)
  return {
    externalId: stringValue(record, ["id_produto", "id_variante", "codigo_produto", "codigo"]),
    title: stringValue(record, ["descricao", "nome", "titulo"]),
    sku: stringValue(record, ["sku", "codigo_produto", "codigo"]),
    weight: numberValue(record, ["peso", "peso_bruto", "weight"]),
    weightUnit: stringValue(record, ["peso_unidade", "weight_unit"]),
    shippingProfile: stringValue(record, ["shipping_profile", "perfil_envio"]),
    fiscalCode: stringValue(record, ["fiscal_code", "ncm", "codigo_fiscal"]),
    price,
    inventory,
    commercialStatus: commercialStatusFor(approval, price, inventory),
  }
}

export const normalizeOmieProduct = (record: OmieProductRecord): NormalizedProduct => {
  const approval: CommercialApproval = {
    product: false,
    price: false,
    inventory: false,
    fiscal: false,
    shipping: false,
  }
  const rawVariants = firstValue(record, ["variacoes", "variantes", "variants", "itens"])
  const variants = asRecords(rawVariants).map(variantFrom)
  const fallbackVariant = variants.length === 0 && stringValue(record, ["sku", "codigo_produto", "codigo"])
    ? [variantFrom(record)]
    : variants
  const representativePrice = fallbackVariant[0]?.price ?? priceFrom(record)
  const representativeInventory = fallbackVariant[0]?.inventory ?? inventoryFrom(record)

  return {
    externalId: stringValue(record, ["id_produto", "codigo_produto", "codigo"]),
    title: stringValue(record, ["descricao", "nome", "titulo"]),
    handle: stringValue(record, ["handle", "slug"]),
    category: stringValue(record, ["categoria", "categoria_nome", "category"]),
    tags: stringArrayValue(record, ["tags", "etiquetas"]),
    image: stringValue(record, ["imagem", "image", "url_imagem"]),
    variants: fallbackVariant,
    approval,
    commercialStatus: commercialStatusFor(approval, representativePrice, representativeInventory),
    source: "omie",
  }
}

const comparable = (left: NormalizedProduct, right: NormalizedProduct): boolean =>
  left.externalId === right.externalId &&
  left.title === right.title &&
  left.handle === right.handle &&
  left.category === right.category &&
  JSON.stringify(left.tags) === JSON.stringify(right.tags) &&
  JSON.stringify(left.variants) === JSON.stringify(right.variants)

export const planCatalogSync = (
  incoming: readonly NormalizedProduct[],
  existing: readonly NormalizedProduct[],
): { dryRun: true; items: Array<{ operation: "create" | "update" | "no-op" | "conflict"; externalId: string | null; sku: string | null; reason: string }> } => {
  const items: Array<{ operation: "create" | "update" | "no-op" | "conflict"; externalId: string | null; sku: string | null; reason: string }> = []
  const incomingExternal = new Map<string, NormalizedProduct>()
  const incomingSkus = new Map<string, NormalizedProduct>()
  const existingExternal = new Map<string, NormalizedProduct>()
  const existingSkus = new Map<string, NormalizedProduct>()
  const duplicateExistingExternal = new Set<string>()
  const duplicateExistingSkus = new Set<string>()

  for (const product of existing) {
    if (product.externalId) {
      if (existingExternal.has(product.externalId)) {
        duplicateExistingExternal.add(product.externalId)
      }
      existingExternal.set(product.externalId, product)
    }

    for (const variant of product.variants) {
      if (variant.sku) {
        if (existingSkus.has(variant.sku)) {
          duplicateExistingSkus.add(variant.sku)
        }
        existingSkus.set(variant.sku, product)
      }
    }
  }

  for (const product of incoming) {
    const sku = product.variants[0]?.sku ?? null
    const duplicateExternal = product.externalId ? incomingExternal.get(product.externalId) : undefined
    const duplicateSku = sku ? incomingSkus.get(sku) : undefined
    const byExternal = product.externalId ? existingExternal.get(product.externalId) : undefined
    const bySku = sku ? existingSkus.get(sku) : undefined

    if (
      duplicateExternal ||
      duplicateSku ||
      (product.externalId && duplicateExistingExternal.has(product.externalId)) ||
      (sku && duplicateExistingSkus.has(sku)) ||
      (byExternal && bySku && byExternal !== bySku)
    ) {
      items.push({ operation: "conflict", externalId: product.externalId, sku, reason: "stable identifier is ambiguous" })
    } else if (!byExternal && !bySku) {
      items.push({ operation: "create", externalId: product.externalId, sku, reason: "no matching Medusa record" })
    } else if (byExternal && comparable(product, byExternal)) {
      items.push({ operation: "no-op", externalId: product.externalId, sku, reason: "source and projection are unchanged" })
    } else {
      items.push({ operation: "update", externalId: product.externalId, sku, reason: "matching stable identifier with changed source data" })
    }

    if (!product.externalId && !sku) {
      items[items.length - 1] = {
        operation: "conflict",
        externalId: null,
        sku: null,
        reason: "stable externalId or SKU is required",
      }
    }

    if (product.externalId) incomingExternal.set(product.externalId, product)
    if (sku) incomingSkus.set(sku, product)
  }

  return { dryRun: true, items }
}
