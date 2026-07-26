# Order State Machine

## Escopo (Fase 19)
A arquitetura do FriggaFrio secciona as responsabilidades de um Pedido (Order) para impedir transições arbitrárias entre Pagamento e Logística que gerariam fraudes internas ou incoerências contábeis.

## Segregação de Estados (Medusa v2 Core)

### 1. Estado Comercial (Order Status)
- `pending`: Pedido gerado.
- `completed`: Pedido entregue, pago e finalizado sem devoluções.
- `canceled`: Pedido abortado pelo cliente ou admin antes do dispatch ou pagamento ser capturado irreversivelmente.
- `requires_action`: Mudanças aplicadas ao pedido necessitam que o cliente adicione fundos ou concorde.

### 2. Estado de Pagamento (Payment Status)
- `not_paid`: Criado via quote ou sem transação iniciada.
- `awaiting`: Pagamento emitido (ex: PIX Copy/Paste) aguardando o webhook do Gateway.
- `captured`: Dinheiro recebido integralmente na conta da FriggaFrio.
- `refunded` / `partially_refunded`: Devoluções aplicadas e conciliadas no Gateway.
- `canceled`: Intenção de compra descartada sem movimentação monetária.

### 3. Estado Logístico (Fulfillment Status)
- `not_fulfilled`: Produtos no galpão com inventário reservado (via fase 13 de Inventory).
- `partially_fulfilled`: Pedido particionado.
- `fulfilled`: Despachado para frota de entrega / pronto para retirada.
- `shipped`: Em trânsito.
- `delivered`: Fim da linha (dispara `completed` no estado comercial caso pagamento bata com o esperado).
- `canceled`: Etiqueta cancelada.

## Restrições de Sistema
- Um administrador ou integração NÃO PODE transicionar manualmente o status de pagamento de `awaiting` para `captured` via admin form/interface. Ele obrigatoriamente depende da API de Conciliação em conjunto com a tesouraria (Prevenção a desvios).
- O Cancelamento de Pedidos só devolve saldo para o Inventory se a transição não gerar exceção nos middlewares de rollback do Medusa.
- Frontend Storefront exibe esses status via Badge/Labels traduzidas do inglês (`Aguardando Pagamento`, `Pagamento Aprovado`, `Preparando Entrega`).
