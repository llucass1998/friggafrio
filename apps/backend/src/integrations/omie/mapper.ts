import {
  CommercialApproval,
  CommercialStatus,
  NormalizedInventory,
  NormalizedPrice,
  NormalizedProduct,
  NormalizedVariant,
  OmieCustomerUpsertInput,
  OmieOrderUpsertInput,
  OmieProductRecord,
  OmieRecord,
  OmieTechnicalAttributes,
} from "./types"
import type { FiscalCustomerInput, FiscalOrderInput } from "./fiscal-types"

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
  if (typeof value === "string" && value.trim()) {
    return value.trim()
  }
  return typeof value === "number" && Number.isFinite(value) ? String(value) : null
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

/**
 * Regra Crítica de Estoque Omie:
 * saldo_disponivel = Math.max(0, saldoFisico - reservado)
 */
export function calculateAvailableStock(
  saldoFisico: number | null | undefined,
  reservado: number | null | undefined,
): number {
  if (typeof saldoFisico !== "number" || !Number.isFinite(saldoFisico)
    || typeof reservado !== "number" || !Number.isFinite(reservado)
    || saldoFisico < 0 || reservado < 0) throw new Error("OMIE_INVALID_STOCK")
  return Math.max(0, saldoFisico - reservado)
}

const KNOWN_BRANDS = [
  "Daikin",
  "Fujitsu",
  "Midea",
  "Elgin",
  "Carrier",
  "Gree",
  "LG",
  "Samsung",
  "Springer",
  "Philco",
  "Consul",
  "Electrolux",
  "TCL",
  "Hitachi",
  "Trane",
] as const

export const extractTechnicalAttributes = (
  record: OmieRecord,
  title?: string | null,
): OmieTechnicalAttributes => {
  const text = `${title ?? ""} ${stringValue(record, ["descricao", "nome", "descricao_detalhada"]) ?? ""}`

  // 1. Marca / Brand
  let brand = stringValue(record, ["marca", "brand", "fabricante"])
  if (!brand && text) {
    for (const b of KNOWN_BRANDS) {
      if (new RegExp(`\\b${b}\\b`, "i").test(text)) {
        brand = b
        break
      }
    }
  }

  // 2. Capacidade BTU
  let capacityBtu = numberValue(record, ["btu", "capacity_btu", "capacidade_btu", "btus"])
  if (capacityBtu === null && text) {
    const match = text.match(/\b(9000|12000|18000|24000|30000|36000|48000|60000|\d{4,5})\s*btus?\b/i)
    if (match?.[1]) {
      capacityBtu = Number(match[1])
    }
  }

  // 3. Tensão / Voltagem
  let voltage = stringValue(record, ["voltagem", "tensao", "voltage"])
  if (!voltage && text) {
    const match = text.match(/\b(110[vV]|127[vV]|220[vV]|380[vV]|[Bb]ivolt)\b/)
    if (match?.[1]) {
      voltage = match[1].toLowerCase() === "bivolt" ? "Bivolt" : match[1].toUpperCase()
    }
  }

  // 4. Gás Refrigerante
  let gasType = stringValue(record, ["gas", "gas_refrigerante", "gas_type", "refrigerante"])
  if (!gasType && text) {
    const match = text.match(/\b(R-?32|R-?410[aA]?|R-?22|R-?134[aA]?|R-?404[aA]?)\b/i)
    if (match?.[1]) {
      const clean = match[1].toUpperCase().replace("-", "")
      gasType = clean.startsWith("R410") ? "R410A" : clean.startsWith("R134") ? "R134a" : clean
    }
  }

  // 5. Inverter
  let inverter: boolean | null = null
  const rawInverter = firstValue(record, ["inverter", "tecnologia_inverter"])
  if (typeof rawInverter === "boolean") {
    inverter = rawInverter
  } else if (typeof rawInverter === "string") {
    inverter = ["s", "sim", "true", "1", "y"].includes(rawInverter.trim().toLowerCase())
  } else if (text) {
    if (/\binverter\b/i.test(text)) inverter = true
    else if (/\b(convencional|on\s*\/?\s*off)\b/i.test(text)) inverter = false
  }

  return {
    brand,
    capacity_btu: capacityBtu,
    voltage,
    gas_type: gasType,
    inverter,
    warranty_days: numberValue(record, ["dias_garantia", "garantia", "garantia_dias"]),
    ncm: stringValue(record, ["ncm", "codigo_fiscal", "fiscal_code"]),
    cest: stringValue(record, ["cest"]),
    ean: stringValue(record, ["ean", "barcode", "codigo_barras"]),
    net_weight: numberValue(record, ["peso_liquido", "net_weight"]),
    gross_weight: numberValue(record, ["peso_bruto", "peso", "weight"]),
    height: numberValue(record, ["altura", "height"]),
    width: numberValue(record, ["largura", "width"]),
    length: numberValue(record, ["profundidade", "comprimento", "length"]),
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
  const code = stringValue(record, ["codigo", "cCodigo", "cCodInt"])
  const unit = stringValue(record, ["unidade", "unidade_medida", "unit"])
  const sku = stringValue(record, ["codigo", "cCodigo", "sku"]) || stringValue(record, ["codigo_produto", "nCodProd", "id_produto"])
  const ncm = stringValue(record, ["ncm", "codigo_fiscal", "fiscal_code"])
  const cest = stringValue(record, ["cest"])
  const ean = stringValue(record, ["ean", "barcode", "codigo_barras"])
  const netWeight = numberValue(record, ["peso_liquido", "net_weight"])
  const grossWeight = numberValue(record, ["peso_bruto", "peso", "weight"])
  const height = numberValue(record, ["altura", "height"])
  const width = numberValue(record, ["largura", "width"])
  const length = numberValue(record, ["profundidade", "comprimento", "length"])

  return {
    externalId: stringValue(record, ["id_produto", "id_variante", "nCodProd", "codigo_produto", "codigo"]),
    code,
    title: stringValue(record, ["descricao", "nome", "titulo"]),
    sku,
    unit,
    weight: grossWeight,
    weightUnit: stringValue(record, ["peso_unidade", "weight_unit"]),
    shippingProfile: stringValue(record, ["shipping_profile", "perfil_envio"]),
    fiscalCode: ncm,
    ncm,
    cest,
    ean,
    netWeight,
    grossWeight,
    height,
    width,
    length,
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
  const fallbackVariant = variants.length === 0 && stringValue(record, ["codigo", "cCodigo", "sku", "codigo_produto"])
    ? [variantFrom(record)]
    : variants
  const representativePrice = fallbackVariant[0]?.price ?? priceFrom(record)
  const representativeInventory = fallbackVariant[0]?.inventory ?? inventoryFrom(record)
  const code = stringValue(record, ["codigo", "cCodigo", "cCodInt"]) || fallbackVariant[0]?.code || null
  const unit = stringValue(record, ["unidade", "unidade_medida", "unit"]) || fallbackVariant[0]?.unit || null
  const title = stringValue(record, ["descricao", "nome", "titulo"])
  const technicalAttributes = extractTechnicalAttributes(record, title)

  return {
    externalId: stringValue(record, ["id_produto", "nCodProd", "codigo_produto", "codigo"]),
    code,
    title,
    handle: stringValue(record, ["handle", "slug"]),
    unit,
    category: stringValue(record, ["categoria", "categoria_nome", "category"]),
    tags: stringArrayValue(record, ["tags", "etiquetas"]),
    image: stringValue(record, ["imagem", "image", "url_imagem"]),
    variants: fallbackVariant,
    approval,
    commercialStatus: commercialStatusFor(approval, representativePrice, representativeInventory),
    source: "omie",
    technicalAttributes,
  }
}

/**
 * Mapeador de cliente fiscal Medusa 2.x -> Omie UpsertClienteCpfCnpj
 */
export function mapCustomerToOmieUpsert(customer: FiscalCustomerInput): OmieCustomerUpsertInput {
  const digits = customer.document.number.replace(/\D/g, "")
  const isCnpj = customer.document.type === "CNPJ" || digits.length === 14
  let phoneDigits = customer.phone?.replace(/\D/g, "")
  if (phoneDigits && phoneDigits.length > 11 && phoneDigits.startsWith("55")) phoneDigits = phoneDigits.slice(2)
  const ddd = phoneDigits?.slice(0, 2)
  const phone = phoneDigits?.slice(2)

  return {
    codigo_cliente_integracao: customer.external_id,
    cnpj_cpf: digits,
    razao_social: customer.name.slice(0, 100),
    nome_fantasia: customer.name.slice(0, 100),
    email: customer.email ?? undefined,
    telefone1_ddd: ddd,
    telefone1_numero: phone,
    endereco: customer.address.address_1.slice(0, 80),
    endereco_numero: customer.address.number || "",
    bairro: customer.address.neighborhood || "",
    cidade_ibge: customer.address.ibge_code || "",
    estado: customer.address.state.slice(0, 2).toUpperCase(),
    cep: customer.address.postal_code.replace(/\D/g, "").slice(0, 8),
    contribuinte: customer.consumer_final ? "N" : isCnpj ? "S" : "N",
    inscricao_estadual: customer.state_registration ?? undefined,
    tags: [
      { tag: "ECOMMERCE" },
      { tag: isCnpj ? "CLIENTE_B2B" : "CLIENTE_B2C" },
    ],
  }
}

export interface MapOrderToOmieOptions {
  stage?: string
  defaultCenarioImpostos?: number
  defaultCategory?: string
  defaultBankAccount?: number
}

/**
 * Mapeador de pedido Medusa 2.x -> Omie IncluirPedido
 */
export function mapOrderToOmieOrder(
  order: FiscalOrderInput,
  options: MapOrderToOmieOptions = {},
): OmieOrderUpsertInput {
  const stage = options.stage ?? "20"
  const cenarioImpostos = options.defaultCenarioImpostos
  const categoria = options.defaultCategory
  const contaCorrente = options.defaultBankAccount
  if (!cenarioImpostos || !categoria || !contaCorrente) throw new Error("OMIE_FISCAL_CONFIGURATION_REQUIRED")

  const today = new Date()
  const dataPrevisao = `${String(today.getDate()).padStart(2, "0")}/${String(today.getMonth() + 1).padStart(2, "0")}/${today.getFullYear()}`

  return {
    cabecalho: {
      codigo_cliente_integracao: order.customer.external_id,
      codigo_pedido_integracao: order.medusa_order_id,
      data_previsao: dataPrevisao,
      etapa: stage,
      codigo_cenario_impostos: cenarioImpostos,
      origem_pedido: "ECOMMERCE",
    },
    det: order.items.map((item, idx) => ({
      ide: {
        codigo_item_integracao: `item_${idx + 1}_${item.sku}`,
      },
      produto: {
        codigo_produto: Number(item.product.omie_code),
        quantidade: item.quantity,
        valor_unitario: item.unit_price,
        tipo_desconto: "V",
        valor_desconto: item.discount,
      },
    })),
    frete: {
      modalidade: order.shipping_method.pickup ? "9" : "0", // 9 = sem frete / retirada, 0 = CIF
      valor_frete: order.shipping,
    },
    informacoes_adicionais: {
      codigo_categoria: categoria,
      codigo_conta_corrente: contaCorrente,
      dados_adicionais_nf: `Pedido Medusa #${order.medusa_order_id} - Pagamento: ${order.payment.method} (${order.payment.status})`,
    },
    parcelas: Array.from({ length: Math.max(1, order.payment.installments || 1) }, (_, i) => {
      const installments = Math.max(1, order.payment.installments || 1)
      const valorParcela = Math.round((order.total / installments) * 100) / 100
      return {
        numero_parcela: i + 1,
        data_vencimento: dataPrevisao,
        valor:
          i === installments - 1
            ? Math.round((order.total - valorParcela * (installments - 1)) * 100) / 100
            : valorParcela,
        percentual: Math.round((100 / installments) * 100) / 100,
      }
    }),
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
