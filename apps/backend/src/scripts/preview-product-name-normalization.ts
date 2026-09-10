import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { normalizeProductDisplayName } from "../integrations/omie/product-name"

type ProductRow = {
  id: string
  title?: string | null
  handle?: string | null
  metadata?: Record<string, unknown> | null
}

type Query = {
  graph: (input: {
    entity: string
    fields: string[]
    filters?: Record<string, unknown>
    pagination?: { skip: number; take: number }
  }) => Promise<{ data: unknown[] }>
}

const protectedTermsFor = (metadata: Record<string, unknown> | null | undefined): string[] => {
  const value = metadata?.protected_terms
  return Array.isArray(value) ? value.filter((term): term is string => typeof term === "string") : []
}

/** Read-only report; applying a title change requires a separately authorized wave. */
export default async function previewProductNameNormalization({ container }: ExecArgs): Promise<void> {
  if (process.env.PRODUCT_NAME_NORMALIZATION_APPLY === "true") {
    throw new Error("PRODUCT_NAME_NORMALIZATION_APPLY is disabled in the preview command")
  }

  const query = container.resolve<Query>(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "product",
    fields: ["id", "title", "handle", "metadata"],
    filters: { deleted_at: null },
    pagination: { skip: 0, take: 5_000 },
  })

  const rows = (data as ProductRow[]).map((product) => ({
    id: product.id,
    handle: product.handle ?? null,
    before: product.title ?? "",
    proposed: normalizeProductDisplayName(product.title ?? "", protectedTermsFor(product.metadata)),
  }))
  const changed = rows.filter((row) => row.before !== row.proposed)
  console.log(JSON.stringify({ mode: "dry-run", total: rows.length, changed: changed.length, unchanged: rows.length - changed.length, changes: changed }))
}
