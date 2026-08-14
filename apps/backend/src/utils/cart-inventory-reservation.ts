import type { MedusaContainer } from "@medusajs/framework/types"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import {
  createReservationsWorkflow,
  deleteReservationsByLineItemsWorkflow,
} from "@medusajs/medusa/core-flows"

type InventoryLevel = {
  location_id?: string | null
  stocked_quantity?: number | string | null
  reserved_quantity?: number | string | null
  stock_locations?: {
    id?: string | null
    sales_channels?: Array<{ id?: string | null }> | null
  } | null
}

type VariantInventoryItem = {
  inventory_item_id?: string | null
  required_quantity?: number | null
  inventory?: { location_levels?: InventoryLevel[] | null } | null
}

export type CartInventoryLine = {
  id: string
  quantity: number
  variant?: {
    id?: string | null
    manage_inventory?: boolean | null
    allow_backorder?: boolean | null
    inventory_items?: VariantInventoryItem[] | null
  } | null
}

export type CartInventoryReservation = {
  line_item_id: string
  inventory_item_id: string
  location_id: string
  quantity: number
  allow_backorder: boolean
}

const asFiniteNumber = (value: number | string | null | undefined): number | null => {
  const numeric = typeof value === "number" ? value : Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

const isAvailableInSalesChannel = (
  level: InventoryLevel,
  salesChannelId: string | null | undefined,
): level is InventoryLevel & { location_id: string } => {
  if (!level.location_id) return false
  if (!salesChannelId) return true
  return level.stock_locations?.sales_channels?.some(
    (salesChannel) => salesChannel.id === salesChannelId,
  ) === true
}

/**
 * Derives reservation inputs exclusively from persisted Medusa cart/variant links.
 * The client never supplies inventory or stock-location identifiers.
 */
export const buildCartInventoryReservations = (
  lines: CartInventoryLine[],
  salesChannelId?: string | null,
): CartInventoryReservation[] => {
  const reservations: CartInventoryReservation[] = []

  for (const line of lines) {
    if (!Number.isSafeInteger(line.quantity) || line.quantity < 1) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Invalid cart item quantity")
    }

    const variant = line.variant
    if (!variant?.manage_inventory || variant.allow_backorder) continue

    const inventoryItems = variant.inventory_items ?? []
    if (!inventoryItems.length) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Managed cart item is missing an inventory mapping",
      )
    }

    for (const inventoryItem of inventoryItems) {
      const inventoryItemId = inventoryItem.inventory_item_id
      const requiredQuantity = inventoryItem.required_quantity
      if (
        !inventoryItemId ||
        !Number.isSafeInteger(requiredQuantity) ||
        typeof requiredQuantity !== "number" ||
        requiredQuantity < 1
      ) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Managed cart item has an invalid inventory mapping",
        )
      }
      // The guard above narrows at runtime; retain a concrete number for TS.
      const required = requiredQuantity as number

      const level = (inventoryItem.inventory?.location_levels ?? []).find((candidate) =>
        isAvailableInSalesChannel(candidate, salesChannelId),
      )
      if (!level) {
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          "No inventory location is available for this cart item",
          MedusaError.Codes.INSUFFICIENT_INVENTORY,
        )
      }

      // The workflow below is authoritative for this check. This preflight only
      // prevents a missing inventory level from being interpreted as available.
      const stocked = asFiniteNumber(level.stocked_quantity)
      const reserved = asFiniteNumber(level.reserved_quantity)
      if (stocked === null || reserved === null || stocked - reserved < line.quantity * required) {
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          "Cart item no longer has sufficient inventory",
          MedusaError.Codes.INSUFFICIENT_INVENTORY,
        )
      }

      reservations.push({
        line_item_id: line.id,
        inventory_item_id: inventoryItemId,
        location_id: level.location_id,
        quantity: line.quantity * required,
        allow_backorder: false,
      })
    }
  }

  return reservations
}

/**
 * Replaces line-item reservations through Medusa's locking-backed workflows.
 * Releasing stale line reservations first keeps a quantity change from leaking
 * a previous commitment; creation remains the authoritative availability check.
 */
export const reserveCartInventory = async (
  container: MedusaContainer,
  lines: CartInventoryLine[],
  salesChannelId?: string | null,
) => {
  const reservations = buildCartInventoryReservations(lines, salesChannelId)
  const lineItemIds = lines.map((line) => line.id)

  if (lineItemIds.length) {
    await deleteReservationsByLineItemsWorkflow(container).run({
      input: { ids: lineItemIds },
    })
  }

  if (!reservations.length) return []

  const { result } = await createReservationsWorkflow(container).run({
    input: { reservations },
  })
  return result
}

export const releaseCartInventoryReservations = async (
  container: MedusaContainer,
  lineItemIds: string[],
) => {
  if (!lineItemIds.length) return
  await deleteReservationsByLineItemsWorkflow(container).run({
    input: { ids: lineItemIds },
  })
}
