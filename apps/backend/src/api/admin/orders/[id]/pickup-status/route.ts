import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils"
import {
  PICKUP_STATUS,
  isPickupMetadata,
  transitionPickupMetadata,
  type PickupStatus,
} from "../../../../../utils/pickup-state"
import { withPostgresAdvisoryLock } from "../../../../../lib/postgres-advisory-lock"

type PickupStatusBody = { status?: unknown }
type OrderProjection = {
  id: string
  metadata?: Record<string, unknown> | null
  shipping_methods?: Array<{ shipping_option?: { data?: Record<string, unknown> | null } | null; data?: Record<string, unknown> | null }>
}

const allowedStatuses = new Set<PickupStatus>(Object.values(PICKUP_STATUS))

export const POST = async (
  req: AuthenticatedMedusaRequest<PickupStatusBody>,
  res: MedusaResponse,
) => {
  const operatorId = req.auth_context?.actor_id
  if (!operatorId) throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Admin session required")
  const status = req.body?.status
  if (typeof status !== "string" || !allowedStatuses.has(status as PickupStatus) || status === PICKUP_STATUS.AWAITING_PREPARATION) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Use ready_for_pickup or collected")
  }

  const database = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as { transaction: <T>(handler: (transaction: unknown) => Promise<T>) => Promise<T> }
  return await withPostgresAdvisoryLock(
    (handler) => database.transaction(handler),
    `pickup-status:${req.params.id}`,
    async () => {
      const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
      const { data } = await query.graph({
        entity: "order",
        fields: ["id", "metadata", "shipping_methods.shipping_option.data", "shipping_methods.data"],
        filters: { id: req.params.id },
      })
      const order = data[0] as OrderProjection | undefined
      if (!order) throw new MedusaError(MedusaError.Types.NOT_FOUND, "Order not found")

      const pickupFromMethod = order.shipping_methods?.some((method) =>
        method.shipping_option?.data?.commercial_shipping_option === "FRIGGAFRIO_PICKUP_STORE_1"
        || method.data?.commercial_shipping_option === "FRIGGAFRIO_PICKUP_STORE_1",
      )
      if (!isPickupMetadata(order.metadata) && !pickupFromMethod) {
        throw new MedusaError(MedusaError.Types.INVALID_DATA, "Order is not a store pickup")
      }

      const metadata = transitionPickupMetadata({
        metadata: order.metadata,
        nextStatus: status as PickupStatus,
        operatorId,
      })
      const orderModule = req.scope.resolve(Modules.ORDER)
      const [updated] = await orderModule.updateOrders([{ id: order.id, metadata }])
      return res.status(200).json({ order: updated, pickup: metadata })
    },
  )
}
