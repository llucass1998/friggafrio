import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import crypto from "crypto"
import { processMercadoPagoWebhookWorkflow } from "../../../workflows/payments/process-mercado-pago-webhook"

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const signature = req.headers["x-signature"] as string
  const reqId = req.headers["x-request-id"] as string

  if (!signature || !reqId) {
    res.status(401).json({ error: "Missing signature or request ID" })
    return
  }

  const webhookSecret = process.env.MERCADO_PAGO_WEBHOOK_SECRET
  if (!webhookSecret) {
    res.status(500).json({ error: "Configuration error" })
    return
  }

  const parts = signature.split(",")
  let ts = "", v1 = ""
  for (const part of parts) {
    const [key, value] = part.split("=")
    if (key === "ts") ts = value
    if (key === "v1") v1 = value
  }

  const manifest = `id:${reqId};request-id:${reqId};ts:${ts};`
  const computedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(manifest)
    .digest("hex")

  if (computedSignature !== v1) {
    res.status(401).json({ error: "Invalid signature" })
    return
  }

  try {
    const webhookData = req.body as Record<string, unknown>
    const eventId = (webhookData?.id || reqId) as string

    // Dispara a execução assíncrona/durável do workflow de conciliação
    await processMercadoPagoWebhookWorkflow(req.scope).run({
      input: {
        event_id: eventId,
        data: webhookData,
      },
    })
  } catch (err: any) {
    req.scope.resolve("logger").error(`[MP Webhook Workflow] Error: ${err.message}`)
  }

  res.status(200).json({ received: true })
}
