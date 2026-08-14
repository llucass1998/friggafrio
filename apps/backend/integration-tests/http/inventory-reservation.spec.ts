import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { Modules } from "@medusajs/framework/utils"
import {
  createInventoryItemsWorkflow,
  createInventoryLevelsWorkflow,
  createReservationsWorkflow,
  createStockLocationsWorkflow,
  deleteReservationsWorkflow,
  updateInventoryLevelsWorkflow,
} from "@medusajs/medusa/core-flows"

jest.setTimeout(240 * 1000)

const databaseUrl = process.env.TEST_DATABASE_URL
const redisUrl = process.env.REDIS_URL

if (!databaseUrl || !redisUrl) {
  throw new Error("TEST_DATABASE_URL and REDIS_URL are required for inventory integration tests")
}

type InventoryService = {
  createReservationItems: (input: {
    inventory_item_id: string
    location_id: string
    line_item_id: string
    quantity: number
    allow_backorder: boolean
  }) => Promise<{ id: string }>
  retrieveAvailableQuantity: (
    inventoryItemId: string,
    locationIds: string[],
  ) => Promise<{ toString: () => string }>
  retrieveReservedQuantity: (
    inventoryItemId: string,
    locationIds: string[],
  ) => Promise<{ toString: () => string }>
  listReservationItems: (
    filters: Record<string, unknown>,
  ) => Promise<Array<{ id: string }>>
}

type LockingService = {
  execute: <T>(keys: string[], job: () => Promise<T>) => Promise<T>
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
    describe("Medusa inventory reservations", () => {
      it("serializes stock=1 reservations and rejects stale, missing, zero, and excessive stock", async () => {
        const container = getContainer()
        const { result: locations } = await createStockLocationsWorkflow(container).run({
          input: { locations: [{ name: "Gate 6 isolated inventory fixture" }] },
        })
        const location = locations[0]

        const { result: inventoryItems } = await createInventoryItemsWorkflow(container).run({
          input: { items: [{ sku: "gate6-controlled-stock-1" }] },
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

        const reservationInput = (lineItemId: string, quantity = 1) => ({
          inventory_item_id: inventoryItem.id,
          location_id: location.id,
          line_item_id: lineItemId,
          quantity,
          allow_backorder: false,
        })
        const inventory = container.resolve(Modules.INVENTORY) as InventoryService
        const locking = container.resolve(Modules.LOCKING) as LockingService
        const reserve = (lineItemId: string, quantity = 1) =>
          locking.execute([inventoryItem.id], () =>
            inventory.createReservationItems(reservationInput(lineItemId, quantity)),
          )

        // This is the same locking plus inventory-service operation used by
        // Medusa's official reserveInventoryStep, against real PostgreSQL.
        // The direct call makes the concurrency assertion independently visible.
        const concurrent = await Promise.allSettled([
          reserve("gate6-line-a"),
          reserve("gate6-line-b"),
        ])
        const successes = concurrent.filter((result) => result.status === "fulfilled")
        const failures = concurrent.filter((result) => result.status === "rejected")
        expect(successes).toHaveLength(1)
        expect(failures).toHaveLength(1)

        await expect(
          inventory.retrieveReservedQuantity(inventoryItem.id, [location.id]),
        ).resolves.toMatchObject({ toString: expect.any(Function) })
        await expect(
          inventory.retrieveAvailableQuantity(inventoryItem.id, [location.id]),
        ).resolves.toMatchObject({ toString: expect.any(Function) })
        expect(Number((await inventory.retrieveReservedQuantity(inventoryItem.id, [location.id])).toString())).toBe(1)
        expect(Number((await inventory.retrieveAvailableQuantity(inventoryItem.id, [location.id])).toString())).toBe(0)
        expect(
          await inventory.listReservationItems({ inventory_item_id: inventoryItem.id }),
        ).toHaveLength(1)

        // Omie synchronization changes physical stock only. Updating it must
        // retain the reservation owned by Medusa's transactional workflow.
        await updateInventoryLevelsWorkflow(container).run({
          input: {
            updates: [{
              inventory_item_id: inventoryItem.id,
              location_id: location.id,
              stocked_quantity: 2,
            }],
          },
        })
        expect(Number((await inventory.retrieveReservedQuantity(inventoryItem.id, [location.id])).toString())).toBe(1)
        expect(Number((await inventory.retrieveAvailableQuantity(inventoryItem.id, [location.id])).toString())).toBe(1)

        // The source increased stock to two while preserving one reservation:
        // a stale request for two must still be rejected against availability=1.
        await expect(
          reserve("gate6-stale-cart", 2),
        ).rejects.toThrow()
        await expect(
          reserve("gate6-over-request", 3),
        ).rejects.toThrow()

        const accepted = successes[0]
        if (accepted.status !== "fulfilled") throw new Error("Expected a successful reservation")
        await deleteReservationsWorkflow(container).run({
          input: { ids: [accepted.value.id] },
        })
        expect(Number((await inventory.retrieveAvailableQuantity(inventoryItem.id, [location.id])).toString())).toBe(2)

        await reserve("gate6-zero-stock", 2)
        await expect(
          reserve("gate6-zero-stock-retry"),
        ).rejects.toThrow()

        const { result: missingInventoryItems } = await createInventoryItemsWorkflow(container).run({
          input: { items: [{ sku: "gate6-missing-level" }] },
        })
        await expect(
          locking.execute([missingInventoryItems[0].id], () =>
            inventory.createReservationItems({
              inventory_item_id: missingInventoryItems[0].id,
              location_id: location.id,
              line_item_id: "gate6-missing-inventory",
              quantity: 1,
              allow_backorder: false,
            }),
          ),
        ).rejects.toThrow()
      })
    })
  },
})
