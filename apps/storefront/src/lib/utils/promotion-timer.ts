export type PromotionTimerState = "upcoming" | "active" | "ended"

export const promotionClockOffset = (serverNow: string, receivedAt = Date.now()): number => {
  const server = Date.parse(serverNow)
  return Number.isFinite(server) ? server - receivedAt : 0
}

export const promotionRemainingMs = (endsAt: string, clockOffset: number, clientNow = Date.now()): number => {
  const end = Date.parse(endsAt)
  if (!Number.isFinite(end) || !Number.isFinite(clockOffset)) return 0
  return Math.max(0, end - (clientNow + clockOffset))
}

export const formatPromotionCountdown = (milliseconds: number): string => {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000))
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return [days, hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(" : ")
}
