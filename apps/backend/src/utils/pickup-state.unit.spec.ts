import {
  PICKUP_STATUS,
  initialPickupMetadata,
  transitionPickupMetadata,
} from "./pickup-state"

describe("pickup operational state", () => {
  it("starts every pickup in awaiting preparation at the single approved store", () => {
    expect(initialPickupMetadata({ customer_note: "keep" })).toMatchObject({
      customer_note: "keep",
      frigga_fulfillment_mode: "pickup",
      frigga_pickup_store_id: "frigga_store_1",
      frigga_pickup_status: PICKUP_STATUS.AWAITING_PREPARATION,
    })
  })

  it("allows only monotonic operator transitions", () => {
    const ready = transitionPickupMetadata({
      metadata: initialPickupMetadata(null),
      nextStatus: PICKUP_STATUS.READY_FOR_PICKUP,
      operatorId: "admin_1",
      now: new Date("2026-08-25T12:00:00.000Z"),
    })
    expect(ready).toMatchObject({
      frigga_pickup_status: PICKUP_STATUS.READY_FOR_PICKUP,
      frigga_pickup_ready_by: "admin_1",
      frigga_pickup_ready_at: "2026-08-25T12:00:00.000Z",
    })

    const collected = transitionPickupMetadata({
      metadata: ready,
      nextStatus: PICKUP_STATUS.COLLECTED,
      operatorId: "admin_2",
      now: new Date("2026-08-25T13:00:00.000Z"),
    })
    expect(collected).toMatchObject({
      frigga_pickup_status: PICKUP_STATUS.COLLECTED,
      frigga_pickup_collected_by: "admin_2",
      frigga_pickup_collected_at: "2026-08-25T13:00:00.000Z",
    })
    expect(() => transitionPickupMetadata({
      metadata: collected,
      nextStatus: PICKUP_STATUS.READY_FOR_PICKUP,
      operatorId: "admin_1",
    })).toThrow("Invalid pickup status transition")
  })

  it("rejects duplicate or unauthenticated status changes", () => {
    const metadata = initialPickupMetadata(null)
    expect(() => transitionPickupMetadata({ metadata, nextStatus: PICKUP_STATUS.READY_FOR_PICKUP, operatorId: "" })).toThrow("operator")
    const ready = transitionPickupMetadata({ metadata, nextStatus: PICKUP_STATUS.READY_FOR_PICKUP, operatorId: "admin_1" })
    expect(() => transitionPickupMetadata({ metadata: ready, nextStatus: PICKUP_STATUS.READY_FOR_PICKUP, operatorId: "admin_1" })).toThrow("Invalid pickup status transition")
  })
})
