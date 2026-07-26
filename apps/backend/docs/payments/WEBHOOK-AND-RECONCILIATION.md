# Webhook and Reconciliation Architecture

## Escopo (Fase 18)
Um dos princípios vitais da Venda Real do MVP da FriggaFrio é a confiança do pagamento (Payment Containment). O **Frontend Nunca Confirma Pagamentos**. Toda order que passar para o status de paga/capturada passará obrigatoriamente por essa via.

## 1. Regras do Endpoint (`/webhooks/mercado-pago`)
- **Validação e Assinatura**: O webhook só será processado caso o header HTTP (`x-signature`) acompanhe o HMAC SHA256 correto correspondente ao `.env.MERCADO_PAGO_WEBHOOK_SECRET`. Webhooks com assinaturas inválidas recebem um 403 ou 400 sem stack traces internos.
- **Idempotência / Event ID**: O Mercado Pago entrega o mesmo webhook várias vezes para garantir recebimento. A nossa aplicação processará os updates através de transações do banco (PostgreSQL isolado) para garantir que updates duplicados não dobrem estoques ou e-mails de confirmação.

## 2. Processo de Conciliação
- **Consulta ao Gateway**: Ao receber o ID de uma transação "Aprovada", em vez de assumir confiança cega e alterar a collection, o backend *deve consultar* a API privada do Mercado Pago (`GET /v1/payments/:id`) para validar que de fato a transação reflete uma aprovação verdadeira, cruzando com a veracidade do webhook.
- **Status da Ordem (State Machine)**: Só então, se e somente se o valor real batendo API corresponder ao subtotal, o status de pagamento passa de `pending` para `captured`.
- **Tentativas/Retries**: Se houver falha de rede ao consultar a API do gateway, o webhook será ignorado com `status 500`. O Mercado Pago emitirá novamente depois de minutos. O sistema prefere uma falha (Fail-Closed) e espera do que capturar sem confirmação de servidor cruzada.
