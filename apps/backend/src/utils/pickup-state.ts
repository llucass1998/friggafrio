export const PICKUP_STORE_ID = "frigga_store_1" as const
export const PICKUP_STATUS = {
  AWAITING_PREPARATION: "awaiting_preparation",
  READY_FOR_PICKUP: "ready_for_pickup",
  COLLECTED: "collected",
} as const

export type PickupStatus = (typeof PICKUP_STATUS)[keyof typeof PICKUP_STATUS]

export type PickupMetadata = Record<string, unknown> & {
  frigga_fulfillment_mode?: "pickup" | "delivery"
  frigga_pickup_store_id?: string
  frigga_pickup_status?: PickupStatus
  frigga_pickup_ready_at?: string
  frigga_pickup_ready_by?: string
  frigga_pickup_collected_at?: string
  frigga_pickup_collected_by?: string
}

export const isPickupMetadata = (metadata: Record<string, unknown> | null | undefined): boolean =>
  metadata?.frigga_fulfillment_mode === "pickup"

export const initialPickupMetadata = (
  metadata: Record<string, unknown> | null | undefined,
): PickupMetadata => ({
  ...(metadata ?? {}),
  frigga_fulfillment_mode: "pickup",
  frigga_pickup_store_id: PICKUP_STORE_ID,
  frigga_pickup_status: PICKUP_STATUS.AWAITING_PREPARATION,
})

const canTransition = (current: PickupStatus, next: PickupStatus): boolean =>
  (current === PICKUP_STATUS.AWAITING_PREPARATION && next === PICKUP_STATUS.READY_FOR_PICKUP)
  || (current === PICKUP_STATUS.READY_FOR_PICKUP && next === PICKUP_STATUS.COLLECTED)

export const transitionPickupMetadata = ({
  metadata,
  nextStatus,
  operatorId,
  now = new Date(),
}: {
  metadata: Record<string, unknown> | null | undefined
  nextStatus: PickupStatus
  operatorId: string
  now?: Date
}): PickupMetadata => {
  if (!operatorId.trim()) throw new Error("Pickup status changes require an operator")
  const current = (metadata?.frigga_pickup_status as PickupStatus | undefined) ?? PICKUP_STATUS.AWAITING_PREPARATION
  if (!canTransition(current, nextStatus)) {
    throw new Error(`Invalid pickup status transition: ${current} -> ${nextStatus}`)
  }
  const timestamp = now.toISOString()
  const next: PickupMetadata = initialPickupMetadata(metadata)
  next.frigga_pickup_status = nextStatus
  if (nextStatus === PICKUP_STATUS.READY_FOR_PICKUP) {
    next.frigga_pickup_ready_at = timestamp
    next.frigga_pickup_ready_by = operatorId
  } else {
    next.frigga_pickup_collected_at = timestamp
    next.frigga_pickup_collected_by = operatorId
  }
  return next
}
