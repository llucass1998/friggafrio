# Contenção de pagamentos

Data: 2026-07-26
Responsável: IDE Agent
Estado da implementação: aplicada
Estado do gate da Fase 2: **REPROVADA**
Liberação comercial: **SISTEMA NÃO LIBERADO PARA VENDA REAL**

## Objetivo

Impedir que frontend, cliente, administrador ou integração não homologada confirme,
autorize ou capture pagamentos enquanto os fluxos de gateway e webhook não estiverem
aprovados.

## Controles aplicados

- `PAYMENTS_ENABLED=false` e `PAYMENT_PROVIDER_ENABLED=false` são fail-closed.
- As duas flags precisam ser explicitamente `true` para liberar processamento.
- Nenhum provider é registrado por padrão.
- O provider Mercado Pago simulado foi removido da configuração ativa e permanece em
  quarentena no código-fonte até implementação/homologação.
- A rota legada `POST /store/customers/me/orders/:id/pay` responde `503` e não contém
  workflow capaz de marcar coleção como paga.
- Criação de sessão e conclusão de carrinho respondem `503` enquanto as flags estiverem
  desabilitadas.
- O middleware central protege rotas padrão Medusa e rotas customizadas.
- O storefront deve ocultar ações de pagamento e exibir estado controlado de
  indisponibilidade.
- Histórico de pedidos/pagamentos não foi apagado nem alterado.

## Rotas contidas

| Método | Rota | Comportamento seguro |
|---|---|---|
| POST | `/store/customers/me/orders/:id/pay` | sempre `503`; nunca confirma pagamento |
| POST | `/store/customers/me/orders/:id/payment-session` | `503` com flags desabilitadas |
| POST | `/store/company/initiate-checkout-session` | `503` com flags desabilitadas |
| POST | `/store/company/payment-methods` | `503` com flags desabilitadas |
| POST | `/store/payment-collections/:id/payment-sessions` | `503` com flags desabilitadas |
| POST | `/store/carts/:id/payment-collections` | `503` com flags desabilitadas |
| POST | `/store/carts/:id/complete` | `503` com flags desabilitadas |

Resposta:

```json
{
  "type": "temporarily_unavailable",
  "code": "payments_temporarily_unavailable",
  "message": "Pagamentos estão temporariamente indisponíveis. Nenhuma cobrança foi realizada."
}
```

## Reativação futura

As flags não autorizam sozinhas venda real. Elas só poderão ser alteradas depois de:

1. provider oficial implementado em sandbox;
2. webhook validado e idempotente;
3. conciliação e estorno testados;
4. autorização e CI aprovados;
5. staging homologado;
6. check-in explícito das Fases 17 e 18.
