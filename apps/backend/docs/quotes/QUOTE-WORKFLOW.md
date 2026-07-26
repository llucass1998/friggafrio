# Quote Workflow (WhatsApp)

## Escopo (Fase 20)
Para produtos que necessitam de negociação B2B, não possuem preço configurado no Admin ou não devem ser adquiridos através do Checkout direto (`QUOTE_ONLY`), a plataforma deve desviar o cliente para o Atendimento (Orçamento via WhatsApp).

## Regras
- Quando um produto cair em estado `price_pending` (Incompleto/Venda Bloqueada) ou ser definido pelo administrador como orçamento-obrigatório, o botão de "Add to Cart" no Frontend deve se converter em um CTA de Solicitação de Orçamento.
- O destino é o link para a API do WhatsApp.
- O texto pré-formatado deve obrigatoriamente incluir: 
   - Nome do Produto
   - SKU
   - Link de referência
   - Preço atual (se existir, para base de negociação).
- Emitir Orçamento NÃO aprova Pedido ou Pagamento, ele encerra a jornada no Front-End delegando-a ao vendedor.
