import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError, Modules, PaymentSessionStatus } from "@medusajs/framework/utils"
import { MERCADO_PAGO_PROVIDER_ID } from "../../../../../lib/payment-provider-bootstrap"
import { MercadoPagoClient } from "../../../../../lib/mercado-pago/client"
import { toMedusaPaymentStatus } from "../../../../../lib/mercado-pago/status"
import { PAYMENT_ATTEMPT_MODULE } from "../../../../../modules/payment-attempt"

type PaymentModuleService = {
  authorizePaymentSession(id: string, context: Record<string, unknown>): Promise<unknown | null>
  updatePaymentSession(input: {
    id: string
    data: Record<string, unknown>
    amount: number
    currency_code: string
    status: "pending_authorization" | "error" | "canceled"
  }): Promise<unknown>
}

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const cartId = req.params.id

  const { data } = await query.graph({
    entity: "cart",
    fields: [
      "id",
      "completed_at",
      "total",
      "currency_code",
      "payment_collection.id",
      "payment_collection.status",
      "payment_collection.payment_sessions.*",
    ],
    filters: { id: cartId },
  })

  const cart = data[0] as Record<string, unknown> | undefined
  if (!cart) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Cart not found")
  }

  const paymentCollection = cart.payment_collection as
    | {
        id?: string
        status?: string
        payment_sessions?: Array<{
          id: string
          provider_id: string
          status: string
          amount?: number
          currency_code?: string
          data?: Record<string, unknown>
        }>
      }
    | undefined
  const session = paymentCollection?.payment_sessions?.find(
    (s) => s.provider_id === MERCADO_PAGO_PROVIDER_ID,
  )

  if (!session) {
    return res.json({ status: "none" })
  }

  let currentStatus = session.status

  // If pending authorization, check directly with Mercado Pago Orders API
  const orderId = typeof session.data?.id === "string" ? session.data.id : null
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN

  if (currentStatus === "pending_authorization" && orderId && accessToken) {
    try {
      const client = new MercadoPagoClient({ accessToken })
      const order = await client.getOrder(orderId)
      const medusaStatus = toMedusaPaymentStatus(order.status)

      if (
        medusaStatus === PaymentSessionStatus.CAPTURED ||
        medusaStatus === PaymentSessionStatus.AUTHORIZED
      ) {
        const payment = req.scope.resolve(Modules.PAYMENT) as PaymentModuleService
        await payment.authorizePaymentSession(session.id, {
          provider_payment_id: orderId,
        })
        currentStatus = "authorized"

        try {
          const attempts = req.scope.resolve(PAYMENT_ATTEMPT_MODULE) as {
            listPaymentAttempts: (
              f: Record<string, unknown>,
            ) => Promise<Array<{ id: string }>>
            updatePaymentAttempts: (d: Record<string, unknown>) => Promise<unknown>
          }
          const existing = await attempts.listPaymentAttempts({
            provider_payment_id: orderId,
          })
          if (existing[0]) {
            await attempts.updatePaymentAttempts({
              id: existing[0].id,
              status: "captured",
            })
          }
        } catch {
          // Attempt store update is best effort
        }
      } else if (medusaStatus === PaymentSessionStatus.ERROR) {
        const payment = req.scope.resolve(Modules.PAYMENT) as PaymentModuleService
        await payment.updatePaymentSession({
          id: session.id,
          data: { ...(session.data || {}), status: "failed" },
          amount: Number(session.amount ?? 0),
          currency_code: session.currency_code ?? "brl",
          status: "error",
        })
        currentStatus = "error"
      } else if (medusaStatus === PaymentSessionStatus.CANCELED) {
        const payment = req.scope.resolve(Modules.PAYMENT) as PaymentModuleService
        await payment.updatePaymentSession({
          id: session.id,
          data: { ...(session.data || {}), status: "canceled" },
          amount: Number(session.amount ?? 0),
          currency_code: session.currency_code ?? "brl",
          status: "canceled",
        })
        currentStatus = "canceled"
      }
    } catch {
      // Keep transient pending status if gateway is unreachable
    }
  }

  return res.json({
    status: currentStatus,
    session_id: session.id,
    payment_method: session.data?.payment_method ?? "unknown",
  })
}
