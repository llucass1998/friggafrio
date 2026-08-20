import { useState } from "react"
import { CheckCircleSolid } from "@medusajs/icons"
import { Copy, ExternalLink } from "lucide-react"
import { getOrderTracking, type TrackingOrderInput } from "@/lib/utils/order-tracking"

const toneClasses = {
  muted: "bg-slate-100 text-slate-700",
  info: "bg-sky-100 text-sky-800",
  navy: "bg-blue-100 text-blue-900",
  success: "bg-emerald-100 text-emerald-800",
  danger: "bg-red-100 text-red-800",
} as const

const formatDate = (value?: string | Date | null) =>
  value
    ? new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
    : null

export function OrderTrackingBadge({ order }: { order: TrackingOrderInput }) {
  const tracking = getOrderTracking(order)
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${toneClasses[tracking.tone]}`}>
      {tracking.label}
    </span>
  )
}

export function OrderTrackingTimeline({ order, compact = false }: { order: TrackingOrderInput; compact?: boolean }) {
  const tracking = getOrderTracking(order)
  const [copied, setCopied] = useState<string | null>(null)

  const copyTracking = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(value)
      window.setTimeout(() => setCopied(null), 1600)
    } catch {
      setCopied(null)
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50 p-4" aria-label="Acompanhe seu pedido">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-950">Acompanhe seu pedido</h3>
          <p className="mt-1 text-sm text-slate-600">{tracking.description}</p>
        </div>
        <OrderTrackingBadge order={order} />
      </div>

      <ol className={`mt-5 ${compact ? "space-y-3" : "grid gap-3 sm:grid-cols-4"}`}>
        {tracking.steps.map((step) => (
          <li key={step.key} className={`relative flex gap-3 ${compact ? "items-start" : "flex-col sm:items-center sm:text-center"}`}>
            <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${step.complete ? "border-blue-700 bg-blue-700 text-white" : "border-slate-300 bg-white text-slate-400"}`}>
              {step.complete ? <CheckCircleSolid className="h-4 w-4" aria-hidden="true" /> : <span className="h-2 w-2 rounded-full bg-current" />}
            </span>
            <span>
              <span className={`block text-sm ${step.current ? "font-bold text-blue-950" : "font-medium text-slate-700"}`}>{step.label}</span>
              {step.date && <span className="mt-0.5 block text-xs text-slate-500">{formatDate(step.date)}</span>}
            </span>
          </li>
        ))}
      </ol>

      {tracking.fulfillments.length > 0 && (
        <div className="mt-5 space-y-3 border-t border-slate-200 pt-4">
          {tracking.fulfillments.map((fulfillment, index) => (
            <div key={fulfillment.id} className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-900">
                  {tracking.fulfillments.length > 1 ? `Entrega ${index + 1}` : "Entrega"}
                </p>
                <span className="text-xs text-slate-500">{fulfillment.providerName || "FriggaFrio"}</span>
              </div>
              {fulfillment.trackingNumber && (
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-slate-600">Código de rastreio:</span>
                  <code className="rounded bg-slate-100 px-2 py-1 font-semibold text-slate-900">{fulfillment.trackingNumber}</code>
                  <button type="button" onClick={() => copyTracking(fulfillment.trackingNumber!)} className="inline-flex items-center gap-1 text-xs font-semibold text-blue-800 hover:underline">
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    {copied === fulfillment.trackingNumber ? "Copiado" : "Copiar"}
                  </button>
                </div>
              )}
              {fulfillment.trackingUrl && (
                <a href={fulfillment.trackingUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-blue-800 hover:underline">
                  Rastrear entrega <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
