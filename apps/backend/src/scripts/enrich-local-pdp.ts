import { Modules } from "@medusajs/framework/utils"
import type { ExecArgs } from "@medusajs/framework/types"
import { createHash } from "node:crypto"
import { mkdir, writeFile } from "node:fs/promises"
import { resolve } from "node:path"

type AnyRecord = Record<string, unknown>

type ProductRow = {
  id: string
  title?: string | null
  description?: string | null
  metadata?: AnyRecord | null
  variants?: Array<{
    inventory_quantity?: number | null
    manage_inventory?: boolean | null
    allow_backorder?: boolean | null
  }> | null
  categories?: Array<{ name?: string | null }> | null
}

type ProductVariantRow = NonNullable<ProductRow["variants"]>[number]

type RegistryEntry = {
  product_id: string
  handle?: string | null
  title: string
  eligibility: { inventory_quantity: number | null; rule: string }
  previous: { description: string | null; metadata: AnyRecord }
  applied: { description: string | null; metadata: AnyRecord }
  fields_updated: string[]
  sources: Array<{ kind: string; reference: string }>
  document: { status: "pending" | "linked"; urls: string[] }
  status: "enriched" | "partial" | "pending" | "skipped_concurrent_change"
  notes?: string[]
}

const PRODUCT_FIELDS = [
  "id",
  "title",
  "description",
  "metadata",
  "handle",
  "categories.name",
  "variants.inventory_quantity",
  "variants.manage_inventory",
  "variants.allow_backorder",
]

const isEligible = (variant: ProductVariantRow | undefined) => {
  if (!variant) return false
  if (variant.allow_backorder === true || variant.manage_inventory === false) return true
  return variant.manage_inventory === true && typeof variant.inventory_quantity === "number" && variant.inventory_quantity > 0
}

const stableJson = (value: unknown) => JSON.stringify(value, Object.keys((value ?? {}) as object).sort())
const baselineHash = (product: ProductRow) => createHash("sha256").update(stableJson({ description: product.description ?? null, metadata: product.metadata ?? {} })).digest("hex")

const normalized = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase()

const buildEnrichment = (product: ProductRow) => {
  const title = String(product.title ?? "").trim()
  const upper = normalized(title)
  const category = String(product.categories?.[0]?.name ?? "").trim()
  const patch: AnyRecord = {}
  const sources: RegistryEntry["sources"] = [
    { kind: "medusa_catalog", reference: `Produto local ${product.id}: título e categoria cadastrados` },
  ]
  const notes: string[] = []
  let description: string | null = null

  if (upper.includes("JATO PLUS") && upper.includes("METASIL")) {
    description = "Desincrustante Jato Plus da Metasil, apresentado no cadastro local em embalagem de 5 L. Indicado para operações de limpeza e desincrustação conforme o rótulo e a documentação de segurança do fabricante."
    patch.brand = "Metasil"
    patch.application = "Limpeza e desincrustação em aplicações industriais, conforme rótulo e ficha de segurança do fabricante."
    patch.dimensions = "Embalagem de 5 L"
    sources.push({ kind: "manufacturer", reference: "https://metasil.com.br/" })
    notes.push("Fabricante e apresentação estão explícitos no título do cadastro; não foram inferidas concentrações ou compatibilidades.")
  } else if (upper.includes("COBRE FLEX")) {
    description = "Tubo de cobre flexível para montagem e manutenção de linhas em instalações de refrigeração. A seleção de diâmetro, comprimento e método de união deve seguir o projeto e as orientações do fabricante do equipamento."
    patch.material = "Cobre"
    patch.application = "Linhas de refrigeração e climatização, conforme projeto da instalação."
  } else if (upper.includes("COBRE RIG")) {
    description = "Tubo de cobre rígido para montagem e manutenção de linhas em instalações de refrigeração. Utilize o diâmetro e o método de união previstos no projeto da instalação."
    patch.material = "Cobre"
    patch.application = "Linhas de refrigeração e climatização, conforme projeto da instalação."
  } else if (upper.includes("LUVA RED")) {
    description = "Luva de redução para união de trechos de tubulação com diâmetros diferentes em instalações de refrigeração. A aplicação deve ser conferida pelo profissional responsável antes da montagem."
    patch.application = "União de tubulações de diâmetros diferentes em instalações de refrigeração."
  } else if (upper.includes("LUVA COBRE")) {
    description = "Luva de cobre para união de trechos de tubulação em instalações de refrigeração. A aplicação e o método de brasagem devem seguir o projeto e as orientações técnicas do equipamento."
    patch.material = "Cobre"
    patch.application = "União de tubulações em instalações de refrigeração."
  } else if (upper.includes("CURVA COBRE")) {
    description = "Curva de cobre para mudança de direção em tubulações de instalações de refrigeração. Confirme o raio, o diâmetro e o método de união no projeto antes da montagem."
    patch.material = "Cobre"
    patch.application = "Mudança de direção em tubulações de refrigeração."
  } else if (upper.includes("SIFAO COBRE")) {
    description = "Sifão de cobre para composição de trechos de tubulação em instalações de refrigeração. A montagem deve respeitar o sentido do fluxo e o projeto do sistema."
    patch.material = "Cobre"
    patch.application = "Composição de trechos de tubulação em instalações de refrigeração."
  } else if (upper.includes("MANIFOLD COBRE")) {
    description = "Manifold de cobre para derivação e conexão de tubulações em instalações de refrigeração. Confirme a configuração da instalação antes de executar a montagem."
    patch.material = "Cobre"
    patch.application = "Derivação e conexão de tubulações de refrigeração."
  } else if (category) {
    description = `${title}. Produto cadastrado na categoria ${category}. Consulte o projeto e a documentação do equipamento para confirmar aplicação, medidas e compatibilidade antes da instalação.`
    notes.push("Descrição limitada ao título e à categoria por falta de fabricante/modelo confirmados no cadastro.")
  }

  return { description, patch, sources, notes }
}

export default async function enrichLocalPdp({ container }: ExecArgs) {
  console.log("PDP enrichment: resolving Medusa services")
  const query = container.resolve("query")
  const productModule = container.resolve(Modules.PRODUCT)
  console.log("PDP enrichment: reading products")
  const { data: products } = await query.graph({
    entity: "product",
    fields: PRODUCT_FIELDS,
    pagination: { skip: 0, take: 10_000 },
  }) as unknown as { data: ProductRow[] }
  console.log(`PDP enrichment: read ${products.length} products`)

  const eligible = products.filter((product) => (product.variants ?? []).some((variant) => isEligible(variant)))
  const registry: RegistryEntry[] = []

  for (const product of eligible) {
    console.log(`PDP enrichment: checking ${product.id}`)
    const variant = (product.variants ?? []).find((candidate) => isEligible(candidate))
    const quantity = typeof variant?.inventory_quantity === "number" ? variant.inventory_quantity : null
    const previousMetadata = { ...(product.metadata ?? {}) }
    const baseline = baselineHash(product)
    const enrichment = buildEnrichment(product)
    const mergedMetadata = { ...previousMetadata }
    const fieldsUpdated: string[] = []

    for (const [key, value] of Object.entries(enrichment.patch)) {
      if (mergedMetadata[key] === undefined || mergedMetadata[key] === null || mergedMetadata[key] === "") {
        mergedMetadata[key] = value
        fieldsUpdated.push(`metadata.${key}`)
      }
    }
    const nextDescription = product.description?.trim() ? product.description : enrichment.description
    if (!product.description?.trim() && nextDescription) fieldsUpdated.push("description")

    if (fieldsUpdated.length > 0) {
      const { data: latestRows } = await query.graph({
        entity: "product",
        fields: PRODUCT_FIELDS,
        filters: { id: product.id },
        pagination: { skip: 0, take: 1 },
      }) as unknown as { data: ProductRow[] }
      const latest = latestRows[0]
      if (!latest || baselineHash(latest) !== baseline) {
        registry.push({
          product_id: product.id,
          title: String(product.title ?? ""),
          eligibility: { inventory_quantity: quantity, rule: "allow_backorder=true OR manage_inventory=false OR manage_inventory=true && inventory_quantity>0" },
          previous: { description: product.description ?? null, metadata: previousMetadata },
          applied: { description: latest?.description ?? null, metadata: latest?.metadata ?? {} },
          fields_updated: [],
          sources: enrichment.sources,
          document: { status: "pending", urls: [] },
          status: "skipped_concurrent_change",
          notes: ["Produto alterado após a leitura inicial; nenhuma atualização foi aplicada."],
        })
        continue
      }

      console.log(`PDP enrichment: updating ${product.id}`)
      await productModule.updateProducts(product.id, { description: nextDescription ?? undefined, metadata: mergedMetadata })
    }

    registry.push({
      product_id: product.id,
      title: String(product.title ?? ""),
      eligibility: { inventory_quantity: quantity, rule: "allow_backorder=true OR manage_inventory=false OR manage_inventory=true && inventory_quantity>0" },
      previous: { description: product.description ?? null, metadata: previousMetadata },
      applied: { description: nextDescription ?? null, metadata: mergedMetadata },
      fields_updated: fieldsUpdated,
      sources: enrichment.sources,
      document: { status: "pending", urls: [] },
      status: fieldsUpdated.length > 0 ? (enrichment.patch.application || enrichment.patch.material || enrichment.patch.brand ? "enriched" : "partial") : "pending",
      ...(enrichment.notes.length > 0 ? { notes: enrichment.notes } : {}),
    })
  }

  const report = {
    generated_at: new Date().toISOString(),
    environment: "Windows Maestro local Medusa",
    eligible_total: eligible.length,
    enriched_total: registry.filter((entry) => entry.status === "enriched").length,
    partially_enriched_total: registry.filter((entry) => entry.status === "partial").length,
    pending_total: registry.filter((entry) => entry.status === "pending").length,
    skipped_concurrent_change_total: registry.filter((entry) => entry.status === "skipped_concurrent_change").length,
    documents_pending_total: registry.filter((entry) => entry.document.status === "pending").length,
    prohibited_fields_changed: false,
    entries: registry,
  }
  const outputDir = resolve(process.cwd(), "../../docs/pdp")
  await mkdir(outputDir, { recursive: true })
  await writeFile(resolve(outputDir, "FRIGGAFRIO_PDP_ENRICHMENT_REGISTRY.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8")
  console.log(JSON.stringify({ eligible: eligible.length, enriched: report.enriched_total, partial: report.partially_enriched_total, pending: report.pending_total, skipped: report.skipped_concurrent_change_total }))
}
