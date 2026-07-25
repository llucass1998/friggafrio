# Implementação da Seção de Marcas

## Marcas Confirmadas
1. Bitzer
2. Siccom
3. Coel

## Marcas Pendentes
Diversos outros parceiros do diretório `imagens/parcerias/` (`parceiro-4.jpg`, `parceiro-5.jpg`, `parceiro-23.jpg`, etc) do site antigo foram baixados, mas aguardam identificação visual da logomarca.

## Origem dos Arquivos
O site antigo oficial (https://www.frigga.com.br/index.html).

## Caminhos Locais
- Originais mantidos em: `imgs/brands/` (bitzer.webp, siccom.webp, coel.webp)
- Públicos exportados em: `apps/storefront/public/images/brands/`

## Como adicionar uma nova marca
1. Localize a marca nos arquivos pendentes (`imgs/parceiro-X.jpg`).
2. Renomeie para `imgs/brands/nome-da-marca.webp` e copie para `apps/storefront/public/images/brands/`.
3. Adicione um novo objeto na lista `storeBrands` no arquivo `apps/storefront/src/config/brands.ts`.

## Como desativar uma marca
No arquivo `apps/storefront/src/config/brands.ts`, modifique a propriedade `active` para `false`.

## Como ordenar as marcas
Altere a propriedade `order` de cada marca em `apps/storefront/src/config/brands.ts`. A renderização obedece esta propriedade crescentemente.

## Como substituir um logo
Troque a imagem em `apps/storefront/public/images/brands/` mantendo o mesmo nome (ou atualize a propriedade `logoSrc` no config `brands.ts`). Recomenda-se manter proporções horizontais, utilizando `object-fit: contain`.

## Cuidados com uso de marca
Não utilize expressões como "Distribuidor Autorizado" ou "Revendedor Oficial" sem comprovação comercial por escrito. Os textos da plataforma seguem um modelo neutro: "Marcas que você encontra na FriggaFrio".
