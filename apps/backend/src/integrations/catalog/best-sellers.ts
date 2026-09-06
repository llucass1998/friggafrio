export type SalesChannel = "medusa" | "omie"

export type SalesEvent = {
  source: SalesChannel
  productId: string
  quantity: number
  returnedQuantity?: number | null
  soldAt: string | Date
  orderId?: string | null
  externalOrderId?: string | null
  confirmed?: boolean
  cancelled?: boolean
  testOrder?: boolean
  transfer?: boolean
  manualAdjustment?: boolean
  supplierReturn?: boolean
}

export type DeterministicOrderLink = {
  medusaOrderId: string
  omieOrderId: string
}

export type BestSellerAggregate = {
  productId: string
  quantity: number
  salesCount: number
  lastSoldAt: string
}

export type BestSellerResult =
  | {
      available: true
      products: BestSellerAggregate[]
      windowStart: string
      windowEnd: string
    }
  | {
      available: false
      reason: "BEST_SELLERS_DEDUPLICATION_BLOCKED" | "PHYSICAL_SOURCE_UNAVAILABLE"
      products: []
      windowStart: string
      windowEnd: string
    }

const TIME_ZONE = "America/Sao_Paulo"

const localParts = (date: Date) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date)
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second),
  }
}

const brazilMidnight = (date: Date): Date => {
  const parts = localParts(date)
  const localAsUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second)
  const offset = localAsUtc - date.getTime()
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day) - offset)
}

export const rollingBrazilWindow = (now = new Date(), days = 30): { start: Date; end: Date } => {
  const end = new Date(now)
  const today = brazilMidnight(end)
  const start = new Date(today.getTime() - days * 24 * 60 * 60 * 1_000)
  return { start, end }
}

const finite = (value: unknown): number | null => {
  const number = typeof value === "number" ? value : Number(value)
  return Number.isFinite(number) ? number : null
}

const netQuantity = (event: SalesEvent): number => {
  const quantity = finite(event.quantity) ?? 0
  const returned = Math.max(0, finite(event.returnedQuantity) ?? 0)
  return Math.max(0, quantity - returned)
}

const eventIsCountable = (event: SalesEvent): boolean =>
  event.confirmed !== false &&
  event.cancelled !== true &&
  event.testOrder !== true &&
  event.transfer !== true &&
  event.manualAdjustment !== true &&
  event.supplierReturn !== true &&
  netQuantity(event) > 0

const eventDate = (event: SalesEvent): Date | null => {
  const date = new Date(event.soldAt)
  return Number.isNaN(date.getTime()) ? null : date
}

const deterministicLinkMap = (links: readonly DeterministicOrderLink[]) =>
  new Map(links.map((link) => [link.omieOrderId, link.medusaOrderId]))

export const aggregateBestSellers = ({
  online,
  physical,
  links,
  eligibleProductIds,
  now = new Date(),
  limit = 10,
  physicalSourceAvailable = true,
}: {
  online: readonly SalesEvent[]
  physical: readonly SalesEvent[]
  links: readonly DeterministicOrderLink[]
  eligibleProductIds: ReadonlySet<string>
  now?: Date
  limit?: number
  physicalSourceAvailable?: boolean
}): BestSellerResult => {
  const window = rollingBrazilWindow(now)
  const base = { windowStart: window.start.toISOString(), windowEnd: window.end.toISOString() }
  if (!physicalSourceAvailable) return { available: false, reason: "PHYSICAL_SOURCE_UNAVAILABLE", products: [], ...base }

  const linksByOmie = deterministicLinkMap(links)
  const isInWindowForEligibleProduct = (event: SalesEvent): boolean => {
    const date = eventDate(event)
    return Boolean(
      eventIsCountable(event) &&
        date &&
        date >= window.start &&
        date <= window.end &&
        eligibleProductIds.has(event.productId),
    )
  }
  const onlineOrderIds = new Set(
    online
      .filter((event) => {
        return Boolean(event.orderId && isInWindowForEligibleProduct(event))
      })
      .map((event) => event.orderId)
      .filter((id): id is string => Boolean(id)),
  )
  const hasOnlineCandidates = online.some(isInWindowForEligibleProduct)
  const hasPhysicalCandidates = physical.some(isInWindowForEligibleProduct)
  if (
    hasOnlineCandidates &&
    hasPhysicalCandidates &&
    physical.some((event) => isInWindowForEligibleProduct(event) && (!event.externalOrderId || !linksByOmie.has(event.externalOrderId)))
  ) {
    return { available: false, reason: "BEST_SELLERS_DEDUPLICATION_BLOCKED", products: [], ...base }
  }

  const totals = new Map<string, { quantity: number; salesCount: number; lastSoldAt: number }>()
  const ingest = (event: SalesEvent, deduplicate = false) => {
    if (!eventIsCountable(event)) return
    const date = eventDate(event)
    if (!date || date < window.start || date > window.end || !eligibleProductIds.has(event.productId)) return
    if (deduplicate && event.externalOrderId && linksByOmie.has(event.externalOrderId) && onlineOrderIds.has(linksByOmie.get(event.externalOrderId)!)) return
    const current = totals.get(event.productId) ?? { quantity: 0, salesCount: 0, lastSoldAt: 0 }
    current.quantity += netQuantity(event)
    current.salesCount += 1
    current.lastSoldAt = Math.max(current.lastSoldAt, date.getTime())
    totals.set(event.productId, current)
  }
  online.forEach((event) => ingest(event))
  physical.forEach((event) => ingest(event, true))

  const products = [...totals.entries()]
    .sort((left, right) => right[1].quantity - left[1].quantity || right[1].salesCount - left[1].salesCount || right[1].lastSoldAt - left[1].lastSoldAt || left[0].localeCompare(right[0]))
    .slice(0, Math.max(0, Math.min(10, Math.trunc(limit))))
    .map(([productId, value]) => ({ productId, quantity: value.quantity, salesCount: value.salesCount, lastSoldAt: new Date(value.lastSoldAt).toISOString() }))

  return { available: true, products, ...base }
}
