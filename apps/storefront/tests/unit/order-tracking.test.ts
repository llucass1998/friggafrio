import assert from "node:assert/strict"
import test from "node:test"
import { getCustomerFulfillmentLabel, getOrderTracking } from "@/lib/utils/order-tracking"

test("maps shipped orders to an in-progress timeline", () => {
    const result = getOrderTracking({
      status: "completed",
      fulfillment_status: "shipped",
      created_at: "2026-01-01T10:00:00.000Z",
      fulfillments: [{ id: "ful_1", packed_at: "2026-01-02T10:00:00.000Z", shipped_at: "2026-01-03T10:00:00.000Z" }],
    })

    assert.equal(result.label, "Em deslocamento")
    assert.equal(result.isInProgress, true)
    assert.equal(result.steps.find((step) => step.key === "shipped")?.current, true)
  })

test("preserves partial shipment semantics", () => {
    assert.equal(getCustomerFulfillmentLabel("partially_shipped").label, "Envio parcial")
    assert.equal(getOrderTracking({ fulfillment_status: "partially_shipped", fulfillments: [] }).isInProgress, true)
  })

test("rejects unsafe tracking URLs while keeping valid URLs", () => {
    const result = getOrderTracking({
      fulfillment_status: "shipped",
      fulfillments: [{ id: "ful_1", tracking_url: "javascript:alert(1)" }, { id: "ful_2", tracking_url: "https://carrier.example/track/1" }],
    })

    assert.equal(result.fulfillments[0].trackingUrl, null)
    assert.equal(result.fulfillments[1].trackingUrl, "https://carrier.example/track/1")
  })

test("maps a canceled order to a final canceled state", () => {
    const result = getOrderTracking({ status: "canceled", fulfillment_status: "not_fulfilled", fulfillments: [] })
    assert.equal(result.status, "canceled")
    assert.equal(result.label, "Cancelado")
    assert.equal(result.isInProgress, false)
  })
