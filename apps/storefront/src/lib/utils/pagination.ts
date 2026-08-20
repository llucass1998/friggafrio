export const PRODUCTS_PER_PAGE = 24

/** Converts untrusted URL values into a safe, positive page number. */
export function normalizePage(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(parsed) || parsed < 1) return 1
  return Math.max(1, Math.floor(parsed))
}

export function totalPagesFor(count: number, pageSize = PRODUCTS_PER_PAGE): number {
  const safeCount = Number.isFinite(count) && count > 0 ? count : 0
  const safePageSize = Math.max(1, Math.floor(pageSize))
  return Math.max(1, Math.ceil(safeCount / safePageSize))
}

export function offsetForPage(page: unknown, pageSize = PRODUCTS_PER_PAGE): number {
  const safePageSize = Math.max(1, Math.floor(pageSize))
  return (normalizePage(page) - 1) * safePageSize
}

export function clampPage(page: unknown, count: number, pageSize = PRODUCTS_PER_PAGE): number {
  return Math.min(normalizePage(page), totalPagesFor(count, pageSize))
}

export type PaginationItem = number | "ellipsis"

/** Returns a compact, stable page list for desktop pagination controls. */
export function paginationItems(page: number, totalPages: number): PaginationItem[] {
  const current = Math.min(Math.max(1, Math.floor(page)), Math.max(1, totalPages))
  const total = Math.max(1, Math.floor(totalPages))
  if (total <= 5) return Array.from({ length: total }, (_, index) => index + 1)

  const items: PaginationItem[] = [1]
  const start = current <= 2 ? 2 : current >= total - 1 ? total - 2 : current - 1
  const end = current <= 2 ? 3 : current >= total - 1 ? total - 1 : current + 1
  if (start > 2) items.push("ellipsis")
  for (let value = start; value <= end; value += 1) items.push(value)
  if (end < total - 1) items.push("ellipsis")
  items.push(total)
  return items
}
