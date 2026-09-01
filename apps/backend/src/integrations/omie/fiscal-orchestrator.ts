import { buildFiscalWorkflowDecision } from "./fiscal-workflow"
import type { FiscalOrderInput, FiscalState } from "./fiscal-types"

export type FiscalProjectionStore = {
  listFiscalOrders(filters: Record<string, unknown>): Promise<Array<{ id: string; state: FiscalState; integration_code: string }>>
  createFiscalOrders(input: Record<string, unknown>): Promise<{ id: string }>
  updateFiscalOrders(input: Record<string, unknown>): Promise<unknown>
}

export type FiscalOutboxStore = {
  listFiscalOutboxEvents(filters: Record<string, unknown>): Promise<Array<{ id: string; status: string }>>
  createFiscalOutboxEvents(input: Record<string, unknown>): Promise<{ id: string }>
}

export const persistFiscalProjection = async (
  order: FiscalOrderInput,
  stores: { fiscalOrders: FiscalProjectionStore; outbox: FiscalOutboxStore },
): Promise<{ fiscalOrderId: string; state: FiscalState; outboxEventId: string | null; duplicate: boolean }> => {
  const existing = await stores.fiscalOrders.listFiscalOrders({ medusa_order_id: order.medusa_order_id })
  const current = existing[0]
  const decision = buildFiscalWorkflowDecision(order, current?.state ?? "NOT_ELIGIBLE")
  let fiscal: { id: string } | undefined = current
  if (!fiscal) {
    try {
      fiscal = await stores.fiscalOrders.createFiscalOrders({
        medusa_order_id: order.medusa_order_id,
        integration_code: decision.integrationCode,
        state: decision.state,
        environment: "homologation",
        attempts: 0,
        last_error: decision.state === "BLOCKED_MISSING_CONFIGURATION" ? decision.reason : null,
      })
    } catch (error) {
      if (!(error instanceof Error) || !/unique|duplicate|already exists/i.test(error.message)) throw error
      fiscal = (await stores.fiscalOrders.listFiscalOrders({ medusa_order_id: order.medusa_order_id }))[0]
      if (!fiscal) throw error
    }
  }
  if (current && current.state !== decision.state) await stores.fiscalOrders.updateFiscalOrders({ id: current.id, state: decision.state })
  if (!decision.outboxEventKey) return { fiscalOrderId: fiscal.id, state: decision.state, outboxEventId: null, duplicate: false }
  const previous = await stores.outbox.listFiscalOutboxEvents({ event_key: decision.outboxEventKey })
  if (previous[0]) return { fiscalOrderId: fiscal.id, state: decision.state, outboxEventId: previous[0].id, duplicate: true }
  let event: { id: string }
  try {
    event = await stores.outbox.createFiscalOutboxEvents({
      fiscal_order_id: fiscal.id,
      event_key: decision.outboxEventKey,
      event_type: decision.eventType,
      status: "pending",
      attempts: 0,
      last_error: null,
    })
  } catch (error) {
    if (!(error instanceof Error) || !/unique|duplicate|already exists/i.test(error.message)) throw error
    const duplicate = (await stores.outbox.listFiscalOutboxEvents({ event_key: decision.outboxEventKey }))[0]
    if (!duplicate) throw error
    return { fiscalOrderId: fiscal.id, state: decision.state, outboxEventId: duplicate.id, duplicate: true }
  }
  return { fiscalOrderId: fiscal.id, state: decision.state, outboxEventId: event.id, duplicate: false }
}
