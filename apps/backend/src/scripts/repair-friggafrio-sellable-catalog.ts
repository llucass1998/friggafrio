import type { ExecArgs } from "@medusajs/framework/types"
import { z } from "@medusajs/framework/zod"
import {
  ContainerRegistrationKeys,
  MedusaError,
  ProductStatus,
} from "@medusajs/framework/utils"
import {
  updateProductsWorkflow,
  type UpdateProductsWorkflowInputProducts,
} from "@medusajs/medusa/core-flows"

const AUTHORIZED_PRODUCT_HANDLES = [
  "gas-r22-freon",
  "gas-r134-freon",
  "gas-r404-freon",
  "gas-r410-freon",
  "gas-r22-eos",
] as const

const ProductSnapshotSchema = z.object({
  id: z.string(),
  title: z.string(),
  handle: z.string().nullable(),
  status: z.string(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
})

type RepairMode = "dry-run" | "apply"
type ProductUpdate = UpdateProductsWorkflowInputProducts["products"][number]

export const resolveRepairMode = (
  argumentsList: readonly string[] = process.argv.slice(2)
): RepairMode => {
  const normalizedArguments = argumentsList.map((argument) =>
    argument.replace(/^--/, "")
  )
  const applyRequested = normalizedArguments.includes("apply")
  const dryRunRequested = normalizedArguments.includes("dry-run")

  if (applyRequested && dryRunRequested) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Use apenas --dry-run ou --apply, nunca os dois ao mesmo tempo."
    )
  }

  return applyRequested ? "apply" : "dry-run"
}

const isAuthorizedHandle = (
  handle: string | null
): handle is (typeof AUTHORIZED_PRODUCT_HANDLES)[number] =>
  handle !== null &&
  AUTHORIZED_PRODUCT_HANDLES.some(
    (authorizedHandle) => authorizedHandle === handle
  )

const isCommerciallyHomologated = (
  metadata: Record<string, unknown>
): boolean =>
  metadata.commercial_scope_approved === true &&
  metadata.price_approval_status === "approved" &&
  metadata.inventory_approval_status === "approved" &&
  metadata.fiscal_approval_status === "approved" &&
  metadata.shipping_approval_status === "approved"

const needsSafeState = (
  status: string,
  metadata: Record<string, unknown>,
  catalogHomologationStatus: "out_of_scope" | "pending"
): boolean =>
  status !== ProductStatus.DRAFT ||
  metadata.storefront_visible !== false ||
  metadata.purchase_enabled !== false ||
  metadata.catalog_homologation_status !== catalogHomologationStatus

export default async function repairCatalog({
  container,
}: ExecArgs): Promise<void> {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const mode = resolveRepairMode()

  logger.info(`[catalog-repair] mode=${mode}`)

  const { data } = await query.graph({
    entity: "product",
    fields: ["id", "title", "handle", "status", "metadata"],
  })
  const products = ProductSnapshotSchema.array().parse(data)

  const updates: ProductUpdate[] = []
  const existingAuthorizedHandles = new Set<string>()

  for (const product of products) {
    const metadata = product.metadata ?? {}

    if (isAuthorizedHandle(product.handle)) {
      existingAuthorizedHandles.add(product.handle)

      if (
        !isCommerciallyHomologated(metadata) &&
        needsSafeState(product.status, metadata, "pending")
      ) {
        updates.push({
          id: product.id,
          status: ProductStatus.DRAFT,
          metadata: {
            ...metadata,
            storefront_visible: false,
            purchase_enabled: false,
            catalog_homologation_status: "pending",
          },
        })
      }

      continue
    }

    if (needsSafeState(product.status, metadata, "out_of_scope")) {
      updates.push({
        id: product.id,
        status: ProductStatus.DRAFT,
        metadata: {
          ...metadata,
          storefront_visible: false,
          purchase_enabled: false,
          catalog_homologation_status: "out_of_scope",
        },
      })
    }
  }

  const missingAuthorizedHandles = AUTHORIZED_PRODUCT_HANDLES.filter(
    (handle) => !existingAuthorizedHandles.has(handle)
  )

  logger.info(
    `[catalog-repair] products=${products.length} updates=${updates.length} missing_authorized=${missingAuthorizedHandles.length}`
  )

  for (const handle of missingAuthorizedHandles) {
    logger.warn(
      `[catalog-repair] authorized product missing and not created without approved data: ${handle}`
    )
  }

  if (mode === "dry-run") {
    logger.info(
      "[catalog-repair] dry-run complete; no product or database state was changed"
    )
    return
  }

  if (updates.length === 0) {
    logger.info("[catalog-repair] apply complete; catalog was already in safe state")
    return
  }

  await updateProductsWorkflow(container).run({
    input: { products: updates },
  })

  logger.info(
    `[catalog-repair] apply complete; ${updates.length} products moved to safe state`
  )
}
