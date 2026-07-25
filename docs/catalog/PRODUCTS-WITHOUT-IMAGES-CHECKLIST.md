# Checklist do Cadastro de Produtos (Fase Inicial s/ Imagens)

## Produtos
- [x] Produtos pesquisados (Fontes reais de fornecedores e fabricantes globais)
- [x] Fabricantes confirmados (Danfoss, Embraco, Testo, Full Gauge, Elgin, etc.)
- [x] Modelos confirmados (EMT6144U, ZB26KCE, KP15, TGEN 3, etc.)
- [x] SKUs confirmados (SKUs de uso interno gerados na modelagem `FRG-*`)
- [x] Categorias criadas (9 categorias técnicas confirmadas)
- [x] Variantes criadas (Isolamentos com multi-bitolas, óleos por volume)
- [x] Preços demonstrativos (em BRL, salvos usando `remoteLink` e Metadata)
- [x] Estoque demonstrativo (marcado via `manage_inventory: true` no Seed)
- [x] Políticas comerciais (Políticas adicionadas nos metadados para controle futuro)
- [x] Recebimento configurado (Gases inflamáveis restritos a Motorista Frigga ou Retirada na loja)

## Imagens
- [x] Produtos cadastrados sem imagem (Campo de URLs web removido no Seed oficial)
- [x] Status de imagem pendente (Marcado nos metadados `image_status: pending_owner_photos` e `has_real_images: false`)
- [ ] Placeholder criado (Componente React `<ProductImagePlaceholder>`)
- [ ] Placeholder no catálogo
- [ ] Placeholder na busca
- [ ] Placeholder na página do produto
- [ ] Placeholder no carrinho
- [ ] Placeholder no orçamento
- [x] Estrutura imgs/products criada (Pastas vazias segmentadas por categoria prontas)
- [x] Documentação de nomes criada (`README.md` nas imagens e `ADDING-PRODUCT-IMAGES.md`)
- [ ] Importador futuro preparado (Script de injeção em massa pendente)

## Segurança
- [x] Checkout bloqueado (Backend impedirá finalização enquanto preço for demo)
- [x] Frontend não libera compra (Frontend renderizará botões visuais restritivos)
- [x] Preço demonstrativo identificado (Is_demo_price fixado)
- [x] Produto sem imagem não quebra API (Medusa Store API suporta Nulo nativamente)
- [x] Nenhuma imagem externa (Removidos links localhost:9000 falsos)
- [x] Nenhum hotlink
- [x] Nenhum segredo exposto

## Qualidade
- [ ] Lint
- [ ] Typecheck
- [ ] Build backend
- [ ] Build storefront
- [ ] Testes backend
- [ ] Testes frontend
- [ ] Testes E2E
- [ ] Responsividade
