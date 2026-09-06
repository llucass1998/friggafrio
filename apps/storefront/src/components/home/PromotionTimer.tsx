import { useEffect, useMemo, useRef, useState } from "react"
import { Clock3 } from "lucide-react"
import { promotionClockOffset, promotionRemainingMs } from "@/lib/utils/promotion-timer"
import type { PromotionCampaign } from "@/lib/data/promotions"

export function PromotionTimer({ campaign, serverNow, onExpired }: { campaign: PromotionCampaign; serverNow: string; onExpired?: () => void }) {
  const offset = useMemo(() => promotionClockOffset(serverNow), [serverNow])
  const target = campaign.status === "upcoming" ? campaign.startsAt : campaign.endsAt
  const [remaining, setRemaining] = useState(() => promotionRemainingMs(target, offset))
  const expiryReported = useRef(false)

  useEffect(() => {
    const update = () => setRemaining(promotionRemainingMs(target, offset))
    update()
    const interval = window.setInterval(update, 1000)
    const handleVisibility = () => { if (!document.hidden) update() }
    document.addEventListener("visibilitychange", handleVisibility)
    return () => { window.clearInterval(interval); document.removeEventListener("visibilitychange", handleVisibility) }
  }, [offset, target])

  useEffect(() => {
    if (remaining > 0 || expiryReported.current) return
    expiryReported.current = true
    onExpired?.()
  }, [onExpired, remaining])

  useEffect(() => { expiryReported.current = false }, [campaign.id, target])

  if (campaign.status === "ended" || remaining <= 0) return null
  const totalSeconds = Math.max(0, Math.floor(remaining / 1000))
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const parts = [
    ...(days > 0 ? [{ value: days, label: "dias" }] : []),
    { value: hours, label: "horas" },
    { value: minutes, label: "min" },
    { value: seconds, label: "seg" },
  ]
  const label = campaign.status === "upcoming" ? "Começa em" : "Termina em"
  return (
    <div className="ff-promotion-timer" aria-label={`${label}. ${parts.map((part) => `${part.value} ${part.label}`).join(", ")}`}>
      <span className="ff-promotion-timer__label"><Clock3 className="h-4 w-4" aria-hidden="true" />{label}</span>
      <span className="ff-promotion-timer__blocks" aria-hidden="true">
        {parts.map((part) => <span className="ff-promotion-timer__block" key={part.label}><strong>{String(part.value).padStart(2, "0")}</strong><small>{part.label}</small></span>)}
      </span>
    </div>
  )
}
