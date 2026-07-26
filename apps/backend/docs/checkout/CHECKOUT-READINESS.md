# Checkout Readiness

## Escopo (Fase 15)
O Checkout está implementado respeitando a contenção de pagamento. Devido ao portfólio não estar liberado financeiramente, o fluxo atende ao seguinte pipeline:
1. **Identificação**: Login ou Sessão Guest.
2. **Endereço**: Cadastro/seleção de envio e faturamento.
3. **Recebimento/Entrega**: Opções de Fulfillment (Pickup / Delivery).
4. **Revisão**: Sumário do carrinho.
5. **Pagamento**: **BLOQUEADO**.

## Regras de Contenção
- NENHUM gateway fantasma, "Manual" ou de "Testes Falsos" deve aprovar um Order confirmando-o no backend. 
- O botão do Componente React (`PaymentButton`) exibe o estado "Pagamento indisponível".
- Nenhuma resposta da API exibe sucesso sem ter uma Payment Collection realmente finalizada e validada pelo Medusa Backend via Webhook/Service correspondente (isso já está garantido na camada `apps/backend/src/api/middlewares/payment-containment.ts`).

## Frontend Readiness
O código fonte do frontend avalia se a variável `PAYMENTS_ENABLED` está em `true`. Sem isso, ou se o gateway for nulo, a etapa 5 travará e a ordem não transiciona para estado capturado.
