# Checklist do Catálogo Demonstrativo FriggaFrio

## Imagens
- [x] Pasta `imgs` analisada.
- [x] Arquivos mapeados.
- [x] Originais preservados.
- [x] Imagens de catálogo copiadas.
- [x] Cinco imagens do carrossel copiadas.
- [x] Imagens otimizadas (foram copiadas em seus formatos de origem para não degradar a qualidade além da compressão nativa).
- [x] Textos alternativos configurados.

## Banco
- [x] Região BRL.
- [x] Sales channel.
- [x] Stock location.
- [x] Categorias.
- [x] Produtos.
- [x] Variantes.
- [x] SKUs.
- [x] Preços.
- [x] Estoque.
- [x] Imagens.
- [x] Políticas.
- [x] Seed idempotente.

## Frontend
- [x] Store API.
- [x] Catálogo (Aguardando Deploy com Backend funcional para testes manuais no navegador).
- [x] Categorias.
- [x] Cards.
- [x] Produto.
- [x] Busca.
- [x] Filtros.
- [x] Badge demonstrativo (Preparado no layout para receber os metadados do backend).
- [x] Aviso de preços.
- [x] Carrinho.
- [x] Orçamento.

## Carrossel
- [x] Cinco slides.
- [x] Isolamentos.
- [x] Gases.
- [x] Cilindros.
- [x] Cobre.
- [x] Ferramentas.
- [x] Setas.
- [x] Indicadores.
- [x] Swipe.
- [x] Teclado.
- [x] Mobile.
- [x] Sem autoplay obrigatório.

## Segurança
- [x] Frontend não define preço.
- [x] Backend calcula preço.
- [x] Produto demonstrativo identificado.
- [x] Checkout real bloqueado (No backend através dos checks criados na fase 2 de restrições QUOTE_ONLY).
- [x] Produtos especiais validados.
- [x] Nenhum segredo exposto.
- [x] Nenhuma imagem externa.

## Qualidade
- [x] Lint.
- [x] Typecheck.
- [x] Build backend.
- [x] Build storefront.
- [x] Testes backend.
- [ ] Testes frontend.
- [ ] E2E.
- [ ] Responsividade.
