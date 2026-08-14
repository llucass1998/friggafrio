import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { Modules } from "@medusajs/framework/utils"
import {
  createLinksWorkflow,
  createInventoryItemsWorkflow,
  createInventoryLevelsWorkflow,
  createStockLocationsWorkflow,
} from "@medusajs/medusa/core-flows"
import { POST as checkoutReady } from "../../src/api/store/carts/[id]/checkout-ready/route"

jest.setTimeout(240 * 1000)

const databaseUrl = process.env.TEST_DATABASE_URL
const redisUrl = process.env.REDIS_URL

if (!databaseUrl || !redisUrl) {
  throw new Error("TEST_DATABASE_URL and REDIS_URL are required for checkout-ready integration tests")
}

type ProductService = {
  createProducts: (input: Record<string, unknown>) => Promise<{
    id: string
    variants: Array<{ id: string }>
  }>
}

type CartService = {
  createCarts: (input: Record<string, unknown>) => Promise<{ id: string }>
}

type InventoryService = {
  retrieveAvailableQuantity: (
    inventoryItemId: string,
    locationIds: string[],
  ) => Promise<{ toString: () => string }>
  retrieveReservedQuantity: (
    inventoryItemId: string,
    locationIds: string[],
  ) => Promise<{ toString: () => string }>
  listReservationItems: (filters: Record<string, unknown>) => Promise<Array<{ id: string }>>
}

type ResponseCapture = {
  statusCode?: number
  body?: Record<string, unknown>
  status: (code: number) => ResponseCapture
  json: (body: Record<string, unknown>) => ResponseCapture
}

const responseCapture = (): ResponseCapture => {
  const response: ResponseCapture = {
    status: (code) => {
      response.statusCode = code
      return response
    },
    json: (body) => {
      response.body = body
      return response
    },
  }
  return response
}

medusaIntegrationTestRunner({
  inApp: true,
  env: {
    DATABASE_URL: databaseUrl,
    DB_URL: databaseUrl,
    POSTGRES_URL: databaseUrl,
    REDIS_URL: redisUrl,
  },
  testSuite: ({ getContainer }) => {
    describe("checkout-ready inventory reservation boundary", () => {
      it("accepts exactly one concurrent checkout-ready transition for real stock=1", async () => {
        const container = getContainer()
        const { result: locations } = await createStockLocationsWorkflow(container).run({
          input: { locations: [{ name: "Gate 6 checkout-ready controlled fixture" }] },
        })
        const location = locations[0]

        const { result: inventoryItems } = await createInventoryItemsWorkflow(container).run({
          input: { items: [{ sku: "gate6-checkout-ready-stock-1" }] },
        })
        const inventoryItem = inventoryItems[0]
        await createInventoryLevelsWorkflow(container).run({
          input: {
            inventory_levels: [{
              inventory_item_id: inventoryItem.id,
              location_id: location.id,
              stocked_quantity: 1,
            }],
          },
        })

        // The persisted variant-to-inventory relation is the only inventory
        // input used by the route; neither cart can submit stock identifiers.
        const product = await (container.resolve(Modules.PRODUCT) as unknown as ProductService).createProducts({
          title: "Gate 6 checkout-ready controlled product",
          status: "published",
          variants: [{
            title: "Controlled variant",
            sku: "gate6-checkout-ready-variant",
            manage_inventory: true,
            allow_backorder: false,
            inventory_items: [{ inventory_item_id: inventoryItem.id, required_quantity: 1 }],
          }],
        })
        const variantId = product.variants[0]?.id
        if (!variantId) throw new Error("Controlled product variant was not created")
        await createLinksWorkflow(container).run({
          input: [{
            [Modules.PRODUCT]: { variant_id: variantId },
            [Modules.INVENTORY]: { inventory_item_id: inventoryItem.id },
            data: { required_quantity: 1 },
          }],
        })

        const cartService = container.resolve(Modules.CART) as unknown as CartService
        const createControlledCart = () => cartService.createCarts({
          currency_code: "brl",
          items: [{
            title: "Controlled line item",
            product_id: product.id,
            variant_id: variantId,
            quantity: 1,
            unit_price: 3000,
          }],
        })
        const [cartA, cartB] = await Promise.all([createControlledCart(), createControlledCart()])

        const invoke = async (cartId: string) => {
          const res = responseCapture()
          await checkoutReady(
            { params: { id: cartId }, scope: container } as never,
            res as never,
          )
          return res
        }

        // The HTTP adapter is lightweight, but the route, query graph,
        // PostgreSQL locking provider, inventory module, and reservation
        // workflow are the real application services used in production.
        const attempts = await Promise.allSettled([invoke(cartA.id), invoke(cartB.id)])
        const successful = attempts.filter((attempt) => attempt.status === "fulfilled")
        const rejected = attempts.filter((attempt) => attempt.status === "rejected")

        if (successful.length !== 1 || rejected.length !== 1) {
          throw new Error(`Unexpected checkout-ready outcomes: ${attempts.map((attempt) =>
            attempt.status === "rejected" ? String(attempt.reason) : JSON.stringify(attempt.value.body),
          ).join(" | ")}`)
        }

        expect(successful).toHaveLength(1)
        expect(rejected).toHaveLength(1)
        const accepted = successful[0]
        if (accepted.status !== "fulfilled") throw new Error("Expected one accepted checkout-ready transition")
        expect(accepted.value.statusCode).toBe(200)
        expect(accepted.value.body).toMatchObject({ checkout_ready: true, reservation_count: 1 })

        const inventory = container.resolve(Modules.INVENTORY) as InventoryService
        expect(Number((await inventory.retrieveReservedQuantity(inventoryItem.id, [location.id])).toString())).toBe(1)
        expect(Number((await inventory.retrieveAvailableQuantity(inventoryItem.id, [location.id])).toString())).toBe(0)
        expect(await inventory.listReservationItems({ inventory_item_id: inventoryItem.id })).toHaveLength(1)

        // These direct route calls prove stale and over-available checkout
        // requests are rejected from the current inventory state, not a cart's
        // previously rendered snapshot.
        await expect(invoke(cartA.id)).rejects.toThrow()
        await expect(invoke(cartB.id)).rejects.toThrow()
      })
    })
  },
})
