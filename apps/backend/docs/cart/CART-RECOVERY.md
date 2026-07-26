# Cart Recovery

## Objetivo (Fase 14)
Identificar e resolver instabilidades na adição de itens ao carrinho (`POST /store/carts/:cartId/line-items`), que falhavam com status 500 no histórico do projeto. 

## Possíveis Causas Antigas e Correções
1. **Tipagens Mutantes**: Variáveis ou metadados customizados (`custom_fields`) enviados de forma inadequada no payload do Request faziam o validator do backend dar break ou exception interna, gerando um `500` não tratado. A correção exige remover `fields` customizados inúteis do DTO enviado pelo frontend.
2. **Estoque Fantasma**: Tentativa de reservar items de SKUs e Variations deletadas/inativas resultava em crash assíncrono durante a validação da linha (Workflow step do Medusa).
3. **Cart Mismatch**: O ID salvo em localStorage que pertencia a uma sessão antiga de visitante que desidratou após um login, ou uma região errada.

## Boas Práticas do Client
O client de `Add to Cart` deve:
- Executar e aguardar o Promise.
- Disparar a invalidação da query de Carrinho (para a UI atualizar o Drawer ou Badge sem delay).
- Em caso de falha (Erro HTTP 400 ou 500), disparar UI toast notification explícito pro usuário, e não mascarar sob um loading infinito.
- Respeitar a sessão.
