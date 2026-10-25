import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import type { MedusaRequest } from "@medusajs/framework/http"
import type { IPricingModuleService, PricingContext } from "@medusajs/framework/types"

export type CatalogDatabase = { raw: (sql: string, bindings?: unknown[]) => Promise<{ rows: Record<string, any>[] }> }
export type PublicCatalogInput = {
  region: string; channels: string[]; q: string; categories: string[]; brands: string[]; options: string[]
  stock: boolean; promotion: boolean; min?: number; max?: number; sort: string; limit: number; offset: number
}
const values = (value: unknown): string[] => [...new Set((Array.isArray(value) ? value : [value])
  .flatMap((entry) => String(entry ?? "").split(",")).map((entry) => entry.trim()).filter(Boolean))].sort()
const number = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === "") return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined
}
export const foldCatalogText = (value: unknown): string => String(value ?? "").normalize("NFD")
  .replace(/[̀-ͯ]/g, "").toLocaleLowerCase("pt-BR").replace(/\s+/g, " ").trim()

export function publicCatalogInput(req: MedusaRequest): PublicCatalogInput {
  const query = req.query ?? {}
  const context = (req as MedusaRequest & { publishable_key_context?: { sales_channel_ids?: string[] } }).publishable_key_context
  const sorts = ["relevance", "-id", "id", "title", "-title", "price_asc", "price_desc"]
  return {
    region: String(query.region_id ?? ""), channels: values(context?.sales_channel_ids),
    q: foldCatalogText(query.q), categories: values(query.category_id ?? query.category),
    brands: values(query.brand ?? query.collection_id), options: values(query.option_value_id),
    stock: ["true", "1", "in_stock"].includes(String(query.availability ?? query.in_stock)),
    promotion: ["true", "1"].includes(String(query.promotion)), min: number(query.price_min), max: number(query.price_max),
    sort: sorts.includes(String(query.sort)) ? String(query.sort) : "-id",
    limit: Math.min(100, Math.max(1, Math.floor(Number(query.limit) || 24))),
    offset: Math.max(0, Math.floor(Number(query.offset) || 0)),
  }
}

// PostgreSQL UTF-8 normalize evita depender de uma extensão unaccent em produção.
const fold = (expression: string) => `trim(regexp_replace(lower(regexp_replace(normalize(coalesce(${expression}, ''), NFD), U&'[\\0300-\\036f]', '', 'g')), '\\s+', ' ', 'g'))`
const like = (text: string) => `%${text.replace(/[\\%_]/g, "\\$&")}%`

export function catalogBase(input: PublicCatalogInput): { sql: string; bindings: unknown[] } {
  const bindings: unknown[] = []
  const bind = (value: unknown) => { bindings.push(value); return "?" }
  const predicates = ["p.deleted_at IS NULL", "p.status = 'published'"]
  if (input.channels.length) predicates.push(`EXISTS (SELECT 1 FROM product_sales_channel sc WHERE sc.product_id=p.id AND sc.deleted_at IS NULL AND sc.sales_channel_id = ANY(${bind(input.channels)}::text[]))`)
  if (input.categories.length) predicates.push(`EXISTS (SELECT 1 FROM product_category_product cp JOIN product_category c ON c.id=cp.product_category_id AND c.deleted_at IS NULL WHERE cp.product_id=p.id AND cp.product_category_id = ANY(${bind(input.categories)}::text[]))`)
  if (input.brands.length) predicates.push(`p.collection_id = ANY(${bind(input.brands)}::text[])`)
  if (input.q) predicates.push(`EXISTS (SELECT 1 FROM unnest(ARRAY[p.title,p.subtitle,c.title] || ARRAY(SELECT value FROM jsonb_each_text(coalesce(p.metadata,'{}'::jsonb)) WHERE key ~* '^(brand|manufacturer|model|reference|ref|omie|codigo|code|sku|ean|upc|barcode|technical|spec)') || ARRAY(SELECT code FROM product_variant sv CROSS JOIN LATERAL unnest(ARRAY[sv.sku,sv.barcode,sv.ean,sv.upc]) code WHERE sv.product_id=p.id AND sv.deleted_at IS NULL)) text(value) WHERE ${fold("text.value")} LIKE ${bind(like(input.q))} ESCAPE '\\')`)
  const options = input.options.length ? `AND (SELECT count(*) FROM product_option_value selected WHERE selected.id=ANY(${bind(input.options)}::text[]) AND selected.deleted_at IS NULL) = ${bind(input.options.length)} AND NOT EXISTS (
    SELECT selected.option_id FROM product_option_value selected WHERE selected.id=ANY(${bind(input.options)}::text[]) AND selected.deleted_at IS NULL
    GROUP BY selected.option_id HAVING NOT EXISTS (
      SELECT 1 FROM product_variant_option vo JOIN product_option_value ov ON ov.id=vo.option_value_id AND ov.deleted_at IS NULL
      WHERE vo.variant_id=v.id AND ov.option_id=selected.option_id AND ov.id=ANY(${bind(input.options)}::text[])
    )) AND EXISTS (SELECT 1 FROM product_variant_option vo WHERE vo.variant_id=v.id AND vo.option_value_id=ANY(${bind(input.options)}::text[]))` : ""
  // As reservas já são subtraídas por localização, exatamente como no adaptador anterior.
  return { bindings, sql: `WITH candidates AS MATERIALIZED (
    SELECT p.id,p.title,p.subtitle,p.metadata,p.created_at,p.collection_id,c.title AS collection_title
    FROM product p LEFT JOIN product_collection c ON c.id=p.collection_id AND c.deleted_at IS NULL
    WHERE ${predicates.join(" AND ")}
  ), variants AS MATERIALIZED (
    SELECT v.id,v.product_id,v.sku,v.barcode,v.ean,v.upc,ps.price_set_id,
      (v.allow_backorder IS TRUE OR v.manage_inventory IS FALSE OR EXISTS (
        SELECT 1 FROM product_variant_inventory_item vi JOIN inventory_level il ON il.inventory_item_id=vi.inventory_item_id AND il.deleted_at IS NULL
        WHERE vi.variant_id=v.id AND vi.deleted_at IS NULL GROUP BY vi.inventory_item_id
        HAVING sum(greatest(0,il.stocked_quantity-il.reserved_quantity)) > 0
      )) AS available
    FROM product_variant v JOIN candidates c ON c.id=v.product_id
    LEFT JOIN product_variant_price_set ps ON ps.variant_id=v.id AND ps.deleted_at IS NULL
    WHERE v.deleted_at IS NULL ${options}
  )` }
}

export async function canCachePublicCatalog(req: MedusaRequest, input: PublicCatalogInput, needsPrice: boolean): Promise<boolean> {
  const customer = (req as MedusaRequest & { auth_context?: { actor_id?: string } }).auth_context
  if (customer?.actor_id || req.headers?.authorization || req.headers?.cookie) return false
  if (!input.channels.length) return false
  if (!needsPrice) return true
  // Datas de início/fim de listas mudam sem evento: não compartilhar projeção temporal.
  const db = req.scope.resolve<CatalogDatabase>(ContainerRegistrationKeys.PG_CONNECTION)
  const result = await db.raw("SELECT EXISTS (SELECT 1 FROM price WHERE deleted_at IS NULL AND price_list_id IS NOT NULL) AS scheduled")
  return result.rows[0]?.scheduled === false
}

async function currencyFor(db: CatalogDatabase, region: string): Promise<string> {
  const { rows } = await db.raw("SELECT currency_code FROM region WHERE id=? AND deleted_at IS NULL", [region])
  if (!rows[0]?.currency_code) throw new Error("CATALOG_REGION_REQUIRED")
  return String(rows[0].currency_code)
}

async function priceProjection(req: MedusaRequest, db: CatalogDatabase, input: PublicCatalogInput, currency: string) {
  // Só o contexto inequivocamente simples pode usar preço-base no SQL. Listas,
  // regras, faixas de quantidade e preços ambíguos delegam ao Pricing Module.
  const base = catalogBase(input)
  const { rows } = await db.raw(`${base.sql} SELECT EXISTS (
    SELECT 1 FROM price p JOIN variants v ON v.price_set_id=p.price_set_id
    WHERE p.deleted_at IS NULL AND (p.price_list_id IS NOT NULL OR p.min_quantity IS NOT NULL OR p.max_quantity IS NOT NULL OR coalesce(p.rules_count,0)<>0
      OR EXISTS (SELECT 1 FROM price_rule r WHERE r.price_id=p.id AND r.deleted_at IS NULL))
    UNION ALL
    SELECT 1 FROM price p JOIN variants v ON v.price_set_id=p.price_set_id WHERE p.deleted_at IS NULL AND p.currency_code=?
    GROUP BY p.price_set_id HAVING count(DISTINCT p.id)>1
  ) AS complex`, [...base.bindings, currency])
  // Ativação separada: só após ensaio diferencial contra o Pricing Module no dataset alvo.
  if (process.env.CATALOG_BASE_PRICE_EQUIVALENCE_APPROVED === "true" && !req.headers?.cookie && !req.headers?.authorization && !(req as MedusaRequest & { auth_context?: { actor_id?: string } }).auth_context?.actor_id && !rows[0]?.complex) return {
    sql: "SELECT p.price_set_id,min(p.amount) AS amount FROM price p WHERE p.deleted_at IS NULL AND p.currency_code=? GROUP BY p.price_set_id",
    bindings: [currency] as unknown[],
  }
  const sets = await db.raw(`${base.sql} SELECT DISTINCT price_set_id FROM variants WHERE price_set_id IS NOT NULL`, base.bindings)
  const pricing = req.scope.resolve<IPricingModuleService>(Modules.PRICING)
  const prices: Array<{ price_set_id: string; amount: number | null }> = []
  const pricingContext: NonNullable<PricingContext["context"]> = { currency_code: currency, region_id: input.region }
  const actor = (req as MedusaRequest & { auth_context?: { actor_id?: string; actor_type?: string } }).auth_context
  if (actor?.actor_type === "customer" && actor.actor_id) {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const { data: groups } = await query.graph({ entity: "customer_group", fields: ["id"], filters: { customers: { id: actor.actor_id } } })
    // O middleware oficial usa este contexto aninhado; o DTO público ainda é escalar.
    Object.assign(pricingContext, { customer: { groups: groups.map((group) => ({ id: group.id })) } })
  }
  const ids = sets.rows.map((row) => String(row.price_set_id))
  for (let offset = 0; offset < ids.length; offset += 250) {
    const calculated = await pricing.calculatePrices({ id: ids.slice(offset, offset + 250) }, {
      context: pricingContext,
    })
    for (const price of calculated) prices.push({ price_set_id: price.id, amount: price.calculated_amount == null ? null : Number(price.calculated_amount) })
  }
  return { sql: "SELECT * FROM jsonb_to_recordset(?::jsonb) AS prices(price_set_id text,amount numeric)", bindings: [JSON.stringify(prices)] as unknown[] }
}

export async function queryPublicCatalog(req: MedusaRequest, input: PublicCatalogInput) {
  if (input.promotion) return { product_ids: [] as string[], count: 0 }
  if (!input.channels.length) throw new Error("CATALOG_PUBLIC_CHANNEL_REQUIRED")
  const db = req.scope.resolve<CatalogDatabase>(ContainerRegistrationKeys.PG_CONNECTION)
  const currency = await currencyFor(db, input.region)
  const needsPrice = input.min !== undefined || input.max !== undefined || input.sort.startsWith("price_")
  const projection = needsPrice ? await priceProjection(req, db, input, currency) : { sql: "SELECT NULL::text AS price_set_id,NULL::numeric AS amount WHERE false", bindings: [] }
  const base = catalogBase(input)
  const filters = ["true"]
  if (input.options.length) filters.push("variant_count>0")
  if (input.stock) filters.push("available")
  const bindings = [...base.bindings, ...projection.bindings]
  if (input.min !== undefined) { filters.push("amount>=?"); bindings.push(input.min) }
  if (input.max !== undefined) { filters.push("amount<=?"); bindings.push(input.max) }
  const orders: Record<string, string> = {
    "id": "created_at DESC,id ASC", "-id": "created_at DESC,id ASC", title: `${fold("title")} COLLATE "pt-BR-x-icu" ASC,id ASC`,
    "-title": `${fold("title")} COLLATE "pt-BR-x-icu" DESC,id ASC`,
    price_asc: "amount ASC NULLS LAST,id ASC", price_desc: "amount DESC NULLS FIRST,id ASC",
  }
  // Mantém prioridade de código exato, nome e disponibilidade na busca textual.
  let order = orders[input.sort] ?? "created_at DESC,id ASC"
  if (input.sort === "relevance" && input.q) {
    order = `(CASE WHEN EXISTS(SELECT 1 FROM variants v WHERE v.product_id=matched.id AND ?=ANY(ARRAY[${fold("v.sku")},${fold("v.barcode")},${fold("v.ean")},${fold("v.upc")}])) THEN 1000
      WHEN ${fold("title") }=? THEN 900
      WHEN EXISTS(SELECT 1 FROM variants v WHERE v.product_id=matched.id AND (${fold("v.sku")} LIKE ? ESCAPE '\\' OR ${fold("v.barcode")} LIKE ? ESCAPE '\\' OR ${fold("v.ean")} LIKE ? ESCAPE '\\' OR ${fold("v.upc")} LIKE ? ESCAPE '\\')) THEN 750
      WHEN ${fold("title")} LIKE ? ESCAPE '\\' THEN 650 ELSE 500 END + CASE WHEN available THEN 80 ELSE 0 END) DESC,created_at DESC,id ASC`
    bindings.push(input.q,input.q,...Array(5).fill(like(input.q)))
  }
  const { rows } = await db.raw(`${base.sql}, prices AS (${projection.sql}), aggregates AS MATERIALIZED (
    SELECT v.product_id,bool_or(v.available) AS available,min(pr.amount) AS amount,count(v.id) AS variant_count
    FROM variants v LEFT JOIN prices pr ON pr.price_set_id=v.price_set_id GROUP BY v.product_id
  ), projected AS (
    SELECT c.*,coalesce(a.available,false) AS available,a.amount,coalesce(a.variant_count,0) AS variant_count
    FROM candidates c LEFT JOIN aggregates a ON a.product_id=c.id
  ), matched AS MATERIALIZED (SELECT * FROM projected WHERE ${filters.join(" AND ")}
  ), page AS (SELECT id,row_number() OVER (ORDER BY ${order}) AS position FROM matched ORDER BY position LIMIT ? OFFSET ?)
  SELECT (SELECT count(*) FROM matched)::int AS count,coalesce((SELECT jsonb_agg(id ORDER BY position) FROM page),'[]'::jsonb) AS product_ids`, [...bindings,input.limit,input.offset])
  return { product_ids: rows[0]?.product_ids as string[] ?? [], count: Number(rows[0]?.count ?? 0) }
}

export async function queryPublicFacets(req: MedusaRequest, input: PublicCatalogInput) {
  if (!input.channels.length) throw new Error("CATALOG_PUBLIC_CHANNEL_REQUIRED")
  const db = req.scope.resolve<CatalogDatabase>(ContainerRegistrationKeys.PG_CONNECTION)
  const currency = await currencyFor(db, input.region)
  const base = catalogBase({ ...input, options: [], stock: false, min: undefined, max: undefined })
  const projection = await priceProjection(req, db, { ...input, options: [] }, currency)
  const { rows } = await db.raw(`${base.sql}, prices AS (${projection.sql}) SELECT
    coalesce((SELECT jsonb_agg(b ORDER BY b.name) FROM (SELECT collection_id AS id,collection_title AS name,count(*)::int AS count FROM candidates WHERE collection_id IS NOT NULL AND collection_title IS NOT NULL GROUP BY collection_id,collection_title) b),'[]'::jsonb) AS brands,
    (SELECT jsonb_build_object('min',min(p.amount),'max',max(p.amount)) FROM prices p JOIN variants v ON v.price_set_id=p.price_set_id) AS price`, [...base.bindings,...projection.bindings])
  let options: unknown[] = []
  if (input.categories.length) {
    const optionRows = await db.raw(`${base.sql} SELECT o.id,o.title,ov.id AS value_id,ov.value,count(DISTINCT v.id)::int AS count
      FROM variants v JOIN product_variant_option vo ON vo.variant_id=v.id JOIN product_option_value ov ON ov.id=vo.option_value_id AND ov.deleted_at IS NULL
      JOIN product_option o ON o.id=ov.option_id AND o.deleted_at IS NULL GROUP BY o.id,o.title,ov.id,ov.value ORDER BY o.title,ov.value`, base.bindings)
    const grouped = new Map<string,{ id: string; title: string; values: unknown[] }>()
    for (const row of optionRows.rows) {
      const option = grouped.get(row.id) ?? { id: row.id, title: row.title, values: [] as unknown[] }
      option.values.push({ id: row.value_id, value: row.value, count: row.count }); grouped.set(row.id,option)
    }
    options = [...grouped.values()]
  }
  const price = rows[0]?.price
  return { brands: rows[0]?.brands ?? [], price: price?.min == null ? {} : price, options, promotion_available: false }
}
