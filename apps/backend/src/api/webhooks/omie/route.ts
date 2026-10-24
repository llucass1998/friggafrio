import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { createHash, createHmac, timingSafeEqual } from "node:crypto"
import { dispatchOmieWebhook, enqueueOmieWebhook, OMIE_WEBHOOK_TOPICS } from "../../../integrations/omie/webhook-inbox"

const equalSecret = (incoming: string, expected: string): boolean => {
  const left = Buffer.from(incoming)
  const right = Buffer.from(expected)
  return left.length === right.length && timingSafeEqual(left, right)
}

export const POST = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const secret = process.env.OMIE_WEBHOOK_SECRET?.trim()
  const token = req.headers["x-omie-token"]
  const signature = req.headers["x-omie-signature"]
  const rawBody = (req as MedusaRequest & { rawBody?: Buffer | string }).rawBody
  const tokenValid = Boolean(secret && typeof token === "string" && equalSecret(token, secret))
  const signatureValid = Boolean(
    process.env.OMIE_APP_SECRET && rawBody && typeof signature === "string"
    && /^[a-f0-9]{64}$/i.test(signature.replace(/^sha256=/, ""))
    && equalSecret(signature.replace(/^sha256=/, "").toLowerCase(),
      createHmac("sha256", process.env.OMIE_APP_SECRET).update(rawBody).digest("hex")),
  )
  if (!tokenValid && !signatureValid) {
    res.status(401).json({ error: "unauthorized" })
    return
  }

  const body = req.body as Record<string, unknown> | null
  const topic = body?.topic
  const event = body?.event ?? body?.eventData
  if (!body || typeof topic !== "string" || !event || typeof event !== "object" || Array.isArray(event)) {
    res.status(400).json({ error: "invalid_webhook" })
    return
  }
  if (!OMIE_WEBHOOK_TOPICS.includes(topic as typeof OMIE_WEBHOOK_TOPICS[number])) {
    res.status(200).json({ status: "ignored", timestamp: Date.now() })
    return
  }
  const incomingId = body.messageId ?? body.id
  // Sem ID real, o hash inclui o evento inteiro; o ID do produto/pedido NÃO identifica uma ocorrência.
  const eventId = createHash("sha256").update(`${topic}:${
    typeof incomingId === "string" || typeof incomingId === "number"
      ? String(incomingId) : JSON.stringify(body)
  }`).digest("hex")
  const message = { topic, event: event as Record<string, unknown>, eventId }
  let created: boolean
  try {
    created = await enqueueOmieWebhook(message)
  } catch {
    // Sem persistência não confirmamos recebimento: o Omie deve poder reenviar.
    res.status(503).json({ error: "webhook_queue_unavailable" })
    return
  }
  res.status(200).json({ status: "received", timestamp: Date.now() })
  if (!created) return
  try {
    const eventBus = req.scope.resolve(Modules.EVENT_BUS)
    await dispatchOmieWebhook(message, eventBus)
  } catch {
    req.scope.resolve(ContainerRegistrationKeys.LOGGER)?.error?.("[omie-webhook] Despacho pendente; entrada preservada para recuperação")
  }
}
