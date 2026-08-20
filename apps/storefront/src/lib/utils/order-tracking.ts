export type TrackingTone = "muted" | "info" | "navy" | "success" | "danger"

export type TrackingOrderInput = {
  status?: string | null
  fulfillment_status?: string | null
  created_at?: string | Date | null
  fulfillments?: unknown[] | null
}

export type TrackingStep = {
  key: "received" | "prepared" | "shipped" | "delivered"
  label: string
  complete: boolean
  current: boolean
  date?: string | Date | null
}

export type FulfillmentTracking = {
  id: string
  status: string
  label: string
  description: string
  tone: TrackingTone
  packedAt?: string | Date | null
  shippedAt?: string | Date | null
  deliveredAt?: string | Date | null
  trackingNumber?: string | null
  trackingUrl?: string | null
  providerName?: string | null
}

export type OrderTracking = {
  status: string
  label: string
  description: string
  tone: TrackingTone
  isInProgress: boolean
  isFinal: boolean
  steps: TrackingStep[]
  fulfillments: FulfillmentTracking[]
}

type FulfillmentLike = {
  id: string
  packed_at?: string | Date | null
  shipped_at?: string | Date | null
  delivered_at?: string | Date | null
  canceled_at?: string | Date | null
  provider_id?: string | null
  labels?: Array<{
    tracking_number?: string | null
    tracking_url?: string | null
  }>
  tracking_number?: string | null
  tracking_url?: string | null
  data?: Record<string, unknown> | null
}

const safeHttpUrl = (value: unknown): string | null => {
  if (typeof value !== "string" || value.trim() === "") return null
  try {
    const url = new URL(value.trim())
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : null
  } catch {
    return null
  }
}

const fulfillmentStatus = (fulfillment: FulfillmentLike): string => {
  if (fulfillment.canceled_at) return "canceled"
  if (fulfillment.delivered_at) return "delivered"
  if (fulfillment.shipped_at) return "shipped"
  if (fulfillment.packed_at) return "fulfilled"
  return "not_fulfilled"
}

export const getCustomerFulfillmentLabel = (status: string) => {
  switch (status) {
    case "fulfilled":
      return { label: "Pedido preparado", description: "Seu pedido foi separado e está pronto para envio.", tone: "info" as const }
    case "shipped":
      return { label: "Em deslocamento", description: "Seu pedido foi enviado.", tone: "navy" as const }
    case "delivered":
      return { label: "Entregue", description: "A entrega foi concluída.", tone: "success" as const }
    case "canceled":
      return { label: "Cancelado", description: "Este envio foi cancelado.", tone: "danger" as const }
    case "returned":
      return { label: "Devolvido", description: "Este pedido foi devolvido.", tone: "danger" as const }
    case "partially_shipped":
      return { label: "Envio parcial", description: "Parte dos itens já foi enviada.", tone: "navy" as const }
    case "partially_delivered":
      return { label: "Entrega parcial", description: "Parte dos itens já foi entregue.", tone: "success" as const }
    case "partially_fulfilled":
      return { label: "Preparação parcial", description: "Parte dos itens está sendo preparada.", tone: "info" as const }
    default:
      return { label: "Aguardando separação", description: "Pedido confirmado e aguardando preparação.", tone: "muted" as const }
  }
}

const labelsFor = (fulfillment: FulfillmentLike) => {
  const label = fulfillment.labels?.find((item) => item.tracking_number || item.tracking_url)
  const data = fulfillment.data ?? {}
  return {
    trackingNumber: label?.tracking_number ?? fulfillment.tracking_number ?? (typeof data.tracking_number === "string" ? data.tracking_number : null),
    trackingUrl: safeHttpUrl(label?.tracking_url ?? fulfillment.tracking_url ?? data.tracking_url),
  }
}

export const getOrderTracking = (order: TrackingOrderInput): OrderTracking => {
  const status = String(order.fulfillment_status || "not_fulfilled")
  const fulfillmentStatusValue = order.status === "canceled" ? "canceled" : status
  const summary = getCustomerFulfillmentLabel(fulfillmentStatusValue)
  const fulfillments = ((order.fulfillments ?? []) as unknown as FulfillmentLike[]).map((fulfillment) => {
    const currentStatus = fulfillmentStatus(fulfillment)
    const currentSummary = getCustomerFulfillmentLabel(currentStatus)
    const tracking = labelsFor(fulfillment)
    return {
      id: fulfillment.id,
      status: currentStatus,
      label: currentSummary.label,
      description: currentSummary.description,
      tone: currentSummary.tone,
      packedAt: fulfillment.packed_at,
      shippedAt: fulfillment.shipped_at,
      deliveredAt: fulfillment.delivered_at,
      trackingNumber: tracking.trackingNumber,
      trackingUrl: tracking.trackingUrl,
      providerName: fulfillment.provider_id ?? null,
    }
  })

  const hasPacked = ["fulfilled", "partially_fulfilled", "shipped", "partially_shipped", "delivered", "partially_delivered"].includes(fulfillmentStatusValue) || fulfillments.some((item) => item.packedAt || ["fulfilled", "shipped", "delivered"].includes(item.status))
  const hasShipped = ["shipped", "partially_shipped", "delivered", "partially_delivered"].includes(fulfillmentStatusValue) || fulfillments.some((item) => item.shippedAt || ["shipped", "delivered"].includes(item.status))
  const hasDelivered = ["delivered", "partially_delivered"].includes(fulfillmentStatusValue) || fulfillments.some((item) => item.deliveredAt || item.status === "delivered")
  const latest = fulfillments.find((item) => item.shippedAt || item.deliveredAt || item.packedAt)
  const steps: TrackingStep[] = [
    { key: "received", label: "Pedido recebido", complete: true, current: !hasPacked && !hasShipped && !hasDelivered, date: order.created_at },
    { key: "prepared", label: "Pedido preparado", complete: hasPacked, current: hasPacked && !hasShipped && !hasDelivered, date: latest?.packedAt },
    { key: "shipped", label: "Enviado / em deslocamento", complete: hasShipped, current: hasShipped && !hasDelivered, date: latest?.shippedAt },
    { key: "delivered", label: "Entregue", complete: hasDelivered, current: hasDelivered, date: latest?.deliveredAt },
  ]

  return {
    status: fulfillmentStatusValue,
    label: summary.label,
    description: summary.description,
    tone: summary.tone,
    isInProgress: !["delivered", "canceled", "returned"].includes(fulfillmentStatusValue),
    isFinal: ["delivered", "canceled", "returned"].includes(fulfillmentStatusValue),
    steps,
    fulfillments,
  }
}
