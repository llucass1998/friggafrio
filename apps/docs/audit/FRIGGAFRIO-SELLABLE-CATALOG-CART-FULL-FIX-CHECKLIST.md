# Checklist de Reparo e Validação de Catálogo/Carrinho

## Catálogo autorizado
- [ ] Produtos autorizados confirmados.
- [ ] R22 Freon cadastrado.
- [ ] R134 Freon cadastrado.
- [ ] R404 Freon cadastrado.
- [ ] R410 Freon cadastrado.
- [ ] R22 EOS cadastrado.
- [ ] Variante Botija configurada para cada produto.
- [ ] Variante Lata configurada para cada produto.
- [ ] SKUs válidos.
- [ ] Preços reais em BRL.
- [ ] Preços aprovados.
- [ ] Estoque real configurado.
- [ ] Outros produtos ocultados.
- [ ] Produtos antigos não foram apagados.
- [ ] Busca retorna somente produtos autorizados.
- [ ] Produtos destacados utilizam somente produtos autorizados.

## Carrinho
- [ ] HTTP 500 reproduzido.
- [ ] Stack do backend capturado.
- [ ] `use-cart.ts` auditado.
- [ ] `public-product-card.tsx` auditado.
- [ ] Cart ID validado.
- [ ] Variant ID validado.
- [ ] Payload validado.
- [ ] Parâmetro `fields` validado.
- [ ] Adição sem `fields` testada.
- [ ] Região brasileira validada.
- [ ] Sales Channel validado.
- [ ] Estoque validado.
- [ ] Uma chamada por clique.
- [ ] Produto adicionado como visitante.
- [ ] Produto adicionado autenticado.
- [ ] Carrinho preservado após login.
- [ ] Carrinho preservado após refresh.
- [ ] Badge atualizado.
- [ ] Botão flutuante atualizado.
- [ ] Drawer atualizado.

## Hydration e SSR
- [ ] Hydration mismatch reproduzido.
- [ ] HTML do servidor analisado.
- [ ] Primeiro render do cliente analisado.
- [ ] Query de FeaturedProducts centralizada.
- [ ] Query key idêntica no servidor e cliente.
- [ ] Dados desidratados corretamente.
- [ ] Skeleton determinístico.
- [ ] SSR preservado.
- [ ] Refresh não gera mismatch.
- [ ] Nenhum `suppressHydrationWarning`.

## APIs
- [ ] API base URL centralizada.
- [ ] Store API usa localhost:9000.
- [ ] Publishable key válida.
- [ ] CORS válido.
- [ ] AUTH_CORS válido.
- [ ] Cookies válidos.
- [ ] Credentials configuradas.
- [ ] Requisições 401 tratadas.
- [ ] Erros de rede tratados.
- [ ] Nenhuma requisição para domínio inexistente.
- [ ] Nenhuma requisição duplicada desnecessária.

## Orçamento
- [ ] Botão presente na página do produto.
- [ ] WhatsApp centralizado no storeConfig.
- [ ] Mensagem inclui produto.
- [ ] Mensagem inclui embalagem selecionada.
- [ ] Mensagem inclui SKU quando existir.
- [ ] Mensagem inclui URL do produto.
- [ ] Link usa encodeURIComponent.
- [ ] Link abre com segurança.
- [ ] Orçamento não substitui a compra quando o produto estiver disponível.

## Animações
- [ ] Drawer abre suavemente.
- [ ] Drawer fecha suavemente.
- [ ] Overlay possui transição.
- [ ] Cards possuem hover profissional.
- [ ] Botões possuem feedback.
- [ ] Loading está animado de forma discreta.
- [ ] Sucesso aparece somente após API.
- [ ] Redução de movimento é respeitada.
- [ ] Nenhuma animação infinita.
- [ ] Nenhum `transition-all` global.

## Qualidade
- [ ] Sem `/undefined`.
- [ ] Sem links `/dk`.
- [ ] Sem DKK.
- [ ] Sem hydration mismatch.
- [ ] Sem HTTP 500.
- [ ] Sem erro crítico no console.
- [ ] Sem falso positivo.
- [ ] Lint aprovado.
- [ ] Typecheck aprovado.
- [ ] Build do backend aprovado.
- [ ] Build do storefront aprovado.
- [ ] Testes aprovados.
- [ ] E2E aprovado.
- [ ] Desktop validado.
- [ ] Mobile validado.
