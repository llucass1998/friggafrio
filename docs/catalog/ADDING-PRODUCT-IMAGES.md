# Adicionando Fotografias aos Produtos FriggaFrio

Os produtos do catálogo atual da FriggaFrio estão cadastrados sem imagens no banco de dados e possuem a propriedade `has_real_images: false`. O frontend renderiza um placeholder inteligente para estes itens.

Assim que as fotografias forem recebidas do proprietário/fabricantes, você terá duas formas de atualizar o catálogo:

## Opção 1: Upload Manual (Painel Administrativo)

Ideal para ajustes finos, lançamento de poucos produtos ou revisão visual.

1. Acesse o Painel Administrativo (Dashboard) do Medusa.
2. Navegue até a seção **Produtos (Products)** no menu lateral esquerdo.
3. Utilize o campo de busca e procure pelo nome ou SKU do produto.
4. Clique na linha do produto para abrir a página de Detalhes.
5. Role até a seção **Media** ou **Images**.
6. Faça o upload da imagem frontal (principal) e marque-a como Thumbnail.
7. Faça o upload das imagens secundárias (lateral, detalhe, etc.) e ajuste a ordem de apresentação.
8. Salve o produto.
9. **Importante:** Se você estiver desenvolvendo ou manipulando via API, lembre-se de alterar os metadados do produto:
   - `image_status: "approved"`
   - `has_real_images: true`
   - `image_source_type: "owned"`
10. Acesse o site (storefront) e limpe o cache, se necessário, para validar.

## Opção 2: Importação em Lote via Script

Ideal para a carga inicial de centenas de fotos recebidas nas pastas de `imgs/products`.

1. As imagens devem ser renomeadas rigorosamente para conter o SKU (ex: `FRG-COMP-EMBRACO-1-3-frontal.webp`).
2. Mova as imagens para suas respectivas pastas em `imgs/products/`.
3. Será disponibilizado o script de importação: `apps/backend/src/scripts/import-product-images-from-imgs.ts`.
4. Teste em modo simulação (Dry Run):
   ```bash
   pnpm --filter backend import-images --dry-run
   ```
   (Isto apenas mapeará os arquivos ao banco e mostrará erros de SKU sem salvar nada).
5. Efetue a carga real:
   ```bash
   pnpm --filter backend import-images
   ```
6. O script subirá as fotos usando o `File Module` do Medusa v2, associará as URLs à tabela `product_image`, e atualizará automaticamente o JSONB de metadados para indicar que aquele produto possui fotografias reais (`has_real_images: true`).

## Aprovação de Preços e Liberação de Compra

Além das fotografias, os produtos recém criados constam com o preço como "Demonstrativo". Isso bloqueia o checkout.

Para tornar o produto comprável no e-commerce direto, você ou um administrador precisa ir no Dashboard do Medusa e alterar o status comercial:

1. No mesmo painel do Produto, edite os metadados:
   - Remova ou troque `"is_demo_price": true` para `false`.
   - Modifique `"price_approval_status"` para `"approved"`.
   - Modifique `"purchase_enabled"` para `true`.
2. Após salvar, o produto deixará de emitir o alerta “Valor sujeito à confirmação” e o botão "Comprar/Checkout" será ativado.