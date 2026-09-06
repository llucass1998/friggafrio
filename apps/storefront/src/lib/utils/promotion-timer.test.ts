import assert from "node:assert/strict"
import test from "node:test"
import { formatPromotionCountdown, promotionClockOffset, promotionRemainingMs } from "@/lib/utils/promotion-timer"

test("promotion countdown is never negative and uses the server clock offset", () => {
  const serverNow = "2026-09-01T12:00:00.000Z"
  const endsAt = "2026-09-01T12:00:05.000Z"
  const receivedAt = Date.parse(serverNow) - 1000
  const offset = promotionClockOffset(serverNow, receivedAt)
  assert.equal(promotionRemainingMs(endsAt, offset, receivedAt + 2000), 3000)
  assert.equal(promotionRemainingMs(endsAt, offset, receivedAt + 10000), 0)
  assert.equal(formatPromotionCountdown(3_723_000), "00 : 01 : 02 : 03")
})
