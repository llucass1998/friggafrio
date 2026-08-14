import type { MedusaContainer } from "@medusajs/framework/types"
import { MedusaError } from "@medusajs/framework/utils"
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

export type ExistingCartInventoryReservation = {
  line_item_id?: string | null
  inventory_item_id?: string | null
  location_id?: string | null
  quantity?: unknown
  allow_backorder?: boolean | null
  deleted_at?: string | Date | null
}

const asFiniteNumber = (value: unknown): number | null => {
  if (value && typeof value === "object") {
    const candidate = value as { value?: unknown; numeric?: unknown }
    if (candidate.value !== undefined && candidate.value !== value) return asFiniteNumber(candidate.value)
    if (candidate.numeric !== undefined && candidate.numeric !== value) return asFiniteNumber(candidate.numeric)
  }
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
 * Derives the reservation identities without checking stock availability. This
 * is used only to validate a previously-created reservation before deciding if
 * the authoritative reservation workflow must run again.
 */
export const deriveCartInventoryReservations = (
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
        !inventoryItemId
        || !Number.isSafeInteger(requiredQuantity)
        || typeof requiredQuantity !== "number"
        || requiredQuantity < 1
      ) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Managed cart item has an invalid inventory mapping",
        )
      }

      const level = (inventoryItem.inventory?.location_levels ?? []).find((candidate) =>
        isAvailableInSalesChannel(candidate, salesChannelId),
      )
      if (!level?.location_id) {
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          "No inventory location is available for this cart item",
          MedusaError.Codes.INSUFFICIENT_INVENTORY,
        )
      }

      reservations.push({
        line_item_id: line.id,
        inventory_item_id: inventoryItemId,
        location_id: level.location_id,
        quantity: line.quantity * requiredQuantity,
        allow_backorder: false,
      })
    }
  }

  return reservations
}

/**
 * Confirms that active persisted reservations still represent the current
 * cart lines. Reservation ids are intentionally ignored; ownership is derived
 * from line, inventory, location, and quantity persisted on the cart.
 */
export const areCartInventoryReservationsValid = (
  lines: CartInventoryLine[],
  existingReservations: ExistingCartInventoryReservation[],
  salesChannelId?: string | null,
): boolean => {
  let expected: CartInventoryReservation[]
  try {
    expected = deriveCartInventoryReservations(lines, salesChannelId)
  } catch {
    return false
  }

  const active = existingReservations.filter((reservation) => !reservation.deleted_at)
  if (active.length !== expected.length) return false

  const unmatched = [...active]
  return expected.every((required) => {
    const index = unmatched.findIndex((candidate) => {
      const quantity = asFiniteNumber(candidate.quantity)
      return candidate.line_item_id === required.line_item_id
        && candidate.inventory_item_id === required.inventory_item_id
        && candidate.location_id === required.location_id
        && quantity === required.quantity
        && candidate.allow_backorder !== true
    })
    if (index < 0) return false
    unmatched.splice(index, 1)
    return true
  })
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
  const lineItemIds = lines.map((line) => line.id)

  // Release this cart's previous reservations before reading availability. The
  // inventory level includes reservations, so preflighting first makes a
  // repeated checkout-ready transition reject its own still-valid reservation.
  if (lineItemIds.length) {
    await deleteReservationsByLineItemsWorkflow(container).run({
      input: { ids: lineItemIds },
    })
  }

  const reservations = buildCartInventoryReservations(lines, salesChannelId)

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
