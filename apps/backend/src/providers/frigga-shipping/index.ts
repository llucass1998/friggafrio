import { AbstractFulfillmentProviderService } from "@medusajs/framework/utils"
import type {
  CalculatedShippingOptionPrice,
  CalculateShippingOptionPriceContext,
  CreateFulfillmentResult,
  FulfillmentOption,
  ValidateFulfillmentDataContext,
} from "@medusajs/types"
import {
  carAmountCentavos,
  createShippingDistanceProviderFromEnv,
  classifyShippingRegion,
  eligibleCommercialSubtotalCentavos,
  motoboyAmountCentavos,
  type CommercialShippingAddress,
} from "../../utils/commercial-shipping-policy"
import { initialPickupMetadata, isPickupMetadata, PICKUP_STATUS } from "../../utils/pickup-state"

type ShippingLine = { quantity?: number; unit_price?: number; metadata?: Record<string, unknown> | null; variant?: { metadata?: Record<string, unknown> | null; product?: { metadata?: Record<string, unknown> | null } | null } | null }

const keyOf = (optionData: Record<string, unknown>): string => String(optionData.commercial_shipping_option ?? "")
const text = (value: unknown): string | undefined => typeof value === "string" ? value : undefined
const addressOf = (context: CalculateShippingOptionPriceContext): CommercialShippingAddress => {
  const address = (context.shipping_address ?? {}) as Record<string, unknown>
  return {
    country_code: text(address.country_code),
    province: text(address.province),
    city: text(address.city),
    postal_code: text(address.postal_code),
    address_1: text(address.address_1),
  }
}

export class FriggaShippingProviderService extends AbstractFulfillmentProviderService {
  static identifier = "frigga-shipping"

  async getFulfillmentOptions(): Promise<FulfillmentOption[]> {
    return [{ id: "frigga-shipping" }, { id: "frigga-pickup", is_return: false }]
  }

  async validateFulfillmentData(_optionData: Record<string, unknown>, data: Record<string, unknown>, _context: ValidateFulfillmentDataContext): Promise<Record<string, unknown>> {
    return data
  }

  async validateOption(): Promise<boolean> {
    return true
  }

  async canCalculate(): Promise<boolean> {
    return true
  }

  async calculatePrice(optionData: Record<string, unknown>, _data: Record<string, unknown>, context: CalculateShippingOptionPriceContext): Promise<CalculatedShippingOptionPrice> {
    const key = keyOf(optionData)
    const lines = (context.items ?? []) as unknown as ShippingLine[]
    let amountCentavos = 0
    if (key === "FRIGGAFRIO_PICKUP_STORE_1") {
      amountCentavos = 0
    } else if (key.startsWith("FRIGGAFRIO_EXPRESS_")) {
      const distance = await createShippingDistanceProviderFromEnv().resolveDistance(addressOf(context))
      if (distance.status !== "resolved") throw new Error("Shipping distance could not be resolved")
      const calculated = motoboyAmountCentavos(distance.distanceKm)
      if (calculated === undefined) throw new Error("Shipping distance is outside the supported policy")
      amountCentavos = calculated
    } else if (key.startsWith("FRIGGAFRIO_CAR_")) {
      const region = classifyShippingRegion(addressOf(context))
      const calculated = carAmountCentavos(region, eligibleCommercialSubtotalCentavos(lines))
      if (calculated === undefined) throw new Error("Shipping region is outside the supported policy")
      amountCentavos = calculated
    } else {
      throw new Error("Unknown FriggaFrio shipping option")
    }
    return { calculated_amount: amountCentavos / 100, is_calculated_price_tax_inclusive: false }
  }

  async createFulfillment(
    data: Record<string, unknown>,
    _items: Partial<{ quantity: number; title: string; variant_id: string }>[],
    order: Partial<{ metadata?: Record<string, unknown> | null }> | undefined,
    _fulfillment: Partial<{ id: string }>,
  ): Promise<CreateFulfillmentResult> {
    const pickup = data.commercial_shipping_option === "FRIGGAFRIO_PICKUP_STORE_1"
      || isPickupMetadata(order?.metadata)
    if (pickup) {
      return {
        data: {
          ...initialPickupMetadata(order?.metadata),
          frigga_pickup_status: PICKUP_STATUS.AWAITING_PREPARATION,
          frigga_pickup_created_at: new Date().toISOString(),
        },
        labels: [],
      }
    }
    return { data: { frigga_fulfillment_mode: "delivery" }, labels: [] }
  }

  async cancelFulfillment(): Promise<Record<string, never>> {
    return {}
  }

  async createReturnFulfillment(): Promise<CreateFulfillmentResult> {
    return { data: {}, labels: [] }
  }
}

export default { services: [FriggaShippingProviderService] }
