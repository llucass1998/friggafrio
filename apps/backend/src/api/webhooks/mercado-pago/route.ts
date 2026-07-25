import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import crypto from "crypto"

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

  // TODO: Em uma implementação de produção, a partir daqui emitiríamos um evento
  // para processamento em background (RabbitMQ, Redis Queue) ao invés de
  // travar o retorno.
  //
  // const eventBus = req.scope.resolve("eventBusService")
  // await eventBus.emit("mercado-pago.webhook.received", { payload: req.body })

  res.status(200).json({ received: true })
}
