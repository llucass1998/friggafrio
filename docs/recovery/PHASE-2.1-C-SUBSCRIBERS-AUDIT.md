# Inventário de Subscribers

| Arquivo | Evento | Payload | Services | Any | Casts | Supressões | Testes | Risco |
|---------|--------|---------|----------|-----|-------|------------|--------|-------|
| `customer-created.ts` | `customer.created` | `{ id: string }` | `LOGGER` | 0 | 0 | 0 | Presente | Baixo |
| `order-placed.ts` | `order.placed` | `{ id: string }` | `LOGGER` | 0 | 0 | 0 | Presente | Baixo |
| `payment-webhook.ts` | `mercado-pago.webhook.received` | `{ payload: unknown }` | `LOGGER` | 0 | 0 | 0 | Presente | Baixo |

## Observações e Correções Realizadas:
- Todos os arquivos são ativos customizados (criados para logging/notificação local/integrações futuras).
- Atualmente não executam mutações reais (apenas `logger.info`).
- **Validação:** Foram implementados **Type Guards** estritos (`isEntityEventData` e `isWebhookEventData`) em todos os subscribers para validar `event.data` em tempo de execução, garantindo que payloads ausentes ou inválidos sejam interceptados com um aviso seguro e abortem a operação silenciosamente, em vez de gerar erros de acesso de propriedade nula.
- **Testes Unitários:** Foram criados testes unitários exaustivos (12 no total) cobrindo sucessos e todos os casos de payload mal formado (nulos, faltantes, tipos incorretos).
