import type { ExecArgs, MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import {
  createCartWorkflow,
  listShippingOptionsForCartWithPricingWorkflow,
} from "@medusajs/medusa/core-flows"

type Query = {
  graph: (input: { entity: string; fields: string[]; filters?: Record<string, unknown> }) => Promise<{ data: unknown[] }>
}

type CartService = {
  deleteCarts: (ids: string[]) => Promise<void>
}

type Address = { country_code: string; province: string; city: string }

const runSmoke = async (
  container: MedusaContainer,
  regionId: string,
  salesChannelId: string,
  address: Address,
) => {
  const { result: cart } = await createCartWorkflow(container).run({
    input: {
      region_id: regionId,
      sales_channel_id: salesChannelId,
      shipping_address: {
        first_name: "Gate 6",
        last_name: "Shipping Smoke",
        address_1: "Controlled test fixture",
        postal_code: "00000-000",
        ...address,
      },
    },
  })

  try {
    const { result } = await listShippingOptionsForCartWithPricingWorkflow(container).run({
      input: { cart_id: cart.id },
    })
    return result as Array<{ name: string; amount?: number; data?: Record<string, unknown> }>
  } finally {
    await (container.resolve(Modules.CART) as CartService).deleteCarts([cart.id])
  }
}

export default async function smokeCommercialShippingV1({ container }: ExecArgs): Promise<void> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY) as Query
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const [{ data: regions }, { data: channels }] = await Promise.all([
    query.graph({ entity: "region", fields: ["id", "name", "currency_code"] }),
    query.graph({ entity: "sales_channel", fields: ["id", "name", "is_disabled"] }),
  ])
  const region = regions.find((value) => (value as { name?: string }).name === "Brasil") as { id?: string } | undefined
  const channel = channels.find((value) => {
    const candidate = value as { name?: string; is_disabled?: boolean }
    return candidate.name === "Canal Brasil" && candidate.is_disabled !== true
  }) as { id?: string } | undefined
  if (!region?.id || !channel?.id) throw new Error("Brazil region and active sales channel are required for shipping smoke.")

  const capital = await runSmoke(container, region.id, channel.id, {
    country_code: "br",
    province: "br-sp",
    city: "São Paulo",
  })
  const outsideSp = await runSmoke(container, region.id, channel.id, {
    country_code: "br",
    province: "br-rj",
    city: "Rio de Janeiro",
  })

  if (capital.length !== 0) {
    throw new Error(`Unresolved-distance shipping smoke failed closed: ${JSON.stringify(capital)}`)
  }
  if (outsideSp.length !== 0) {
    throw new Error(`Outside-SP shipping smoke failed: ${JSON.stringify(outsideSp)}`)
  }

  logger.info("[commercial-shipping-v1-smoke] outside_sp=0 unresolved_distance=0")
}
