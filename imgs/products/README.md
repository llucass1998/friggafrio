# Estrutura de Fotografias dos Produtos - FriggaFrio

As fotografias reais do catálogo da FriggaFrio devem ser colocadas nesta estrutura de pastas antes da execução da rotina de importação em lote, ou podem ser subidas manualmente via Painel Administrativo.

Nesta fase inicial de implantação, todos os produtos foram cadastrados com o status `has_real_images: false` e `image_status: "pending_owner_photos"`.

## Pastas das Categorias

- `gases-refrigerantes/`
- `compressores/`
- `unidades-condensadoras/`
- `filtros-secadores/`
- `valvulas-controles/`
- `controladores/`
- `ferramentas/`
- `bombas-de-vacuo/`
- `cilindros/`
- `isolamentos/`
- `tubos-de-cobre/`
- `oleos-quimicos/`
- `quadros-de-comando/`

## Padrão de Nomenclatura Recomendado

O importador em lote buscará pelo código oficial do produto (SKU) extraído do nome do arquivo. Siga a convenção:

`[SKU]-[POSICAO].[EXTENSAO]`

Onde:
- **SKU**: O SKU interno cadastrado no sistema (ex: `FRG-COMP-EMBRACO-1-3`).
- **POSICAO**: Vista da foto. A primeira (thumbnail principal) deve ser `frontal`. As secundárias podem ser `lateral`, `detalhe`, `embalagem`, `traseira`.
- **EXTENSAO**: `webp` (Recomendado) ou `avif`.

### Exemplos Válidos:
- `FRG-GAS-R410A-11KG-frontal.webp`
- `FRG-GAS-R410A-11KG-lateral.webp`
- `FRG-COMP-EMBRACO-1-3-frontal.webp`
- `FRG-COMP-EMBRACO-1-3-detalhe.webp`

## Requisitos das Fotografias

- **Dimensão recomendada:** 1600x1600 pixels (Proporção 1:1, quadrado perfeito).
- **Formatos suportados:** WebP, AVIF, JPG, PNG (preferência absoluta por WebP).
- **Fundo:** Branco absoluto ou transparente. Fundo limpo, produto centralizado.
- **Conteúdo:** Apenas o produto físico. Sem textos comerciais adicionados, sem logotipos artificiais, sem marca d'água de fornecedor sobre a peça.

## Como Importar Futuramente

Consulte a documentação em `docs/catalog/ADDING-PRODUCT-IMAGES.md` para as opções de injeção em lote (via script Medusa CLI) ou atualização manual via Medusa Admin Dashboard.