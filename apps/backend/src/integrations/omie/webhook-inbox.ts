import Redis from "ioredis"

export const OMIE_WEBHOOK_TOPICS = [
  "Produto.Incluido", "Produto.Alterado", "Produto.Excluido",
  "MovimentoEstoque.Incluido", "PedidoVenda.Faturado",
] as const

export interface OmieWebhookMessage {
  topic: string
  event: Record<string, unknown>
  eventId: string
}

let redis: Redis | undefined
export function getOmieRedis(): Redis {
  if (!process.env.REDIS_URL) throw new Error("OMIE_REDIS_NOT_CONFIGURED")
  if (!redis || redis.status === "end") {
    redis = new Redis(process.env.REDIS_URL, {
      connectTimeout: 100, commandTimeout: 100, maxRetriesPerRequest: 0,
      enableOfflineQueue: false, retryStrategy: (attempt) => attempt > 10 ? null : 1000,
    })
    redis.on("error", () => undefined)
  }
  return redis
}

const pendingKey = "omie:webhooks:pending"
const messageKey = (id: string) => `omie:event:${id}`

// A chave de deduplicação e a caixa de entrada são gravadas na mesma operação.
export async function enqueueOmieWebhook(message: OmieWebhookMessage): Promise<boolean> {
  const result = await getOmieRedis().eval(`
    if redis.call('EXISTS', KEYS[1]) == 1 then return 0 end
    redis.call('SET', KEYS[1], ARGV[1])
    redis.call('ZADD', KEYS[2], ARGV[2], ARGV[3])
    return 1
  `, 2, messageKey(message.eventId), pendingKey, JSON.stringify(message), Date.now(), message.eventId)
  return result === 1
}

export async function completeOmieWebhook(id: string): Promise<void> {
  await getOmieRedis().eval(`
    redis.call('SET', KEYS[1], 'done', 'EX', 86400)
    redis.call('ZREM', KEYS[2], ARGV[1])
    return 1
  `, 2, messageKey(id), pendingKey, id)
}

export async function pendingOmieWebhooks(): Promise<OmieWebhookMessage[]> {
  const client = getOmieRedis()
  const ids = await client.zrangebyscore(pendingKey, 0, Date.now(), "LIMIT", 0, 20)
  if (!ids.length) return []
  const values = await client.mget(...ids.map(messageKey))
  return values.filter((value): value is string => Boolean(value) && value !== "done")
    .map((value) => JSON.parse(value) as OmieWebhookMessage)
}

export async function dispatchOmieWebhook(
  message: OmieWebhookMessage,
  eventBus: { emit(input: { name: string; data: OmieWebhookMessage }): Promise<unknown> },
): Promise<void> {
  // A entrada só é removida após processamento. Quedas entre ACK e emit são recuperadas pelo job.
  await getOmieRedis().zadd(pendingKey, Date.now() + 60_000, message.eventId)
  await eventBus.emit({ name: `omie.webhook.${message.topic}`, data: message })
}
