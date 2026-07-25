# Baseline - Store Locations (Nossa Loja)

## Unidades Encontradas
Através do arquivo `apps/storefront/src/config/store-locations.ts`, foram encontradas 2 unidades ativas na configuração atual:

1. **FriggaFrio — Loja 1**
   - Endereço: Alameda Glete, 663, Campos Elíseos - São Paulo/SP, 01215-001
   - Telefone: (11) 4580-1227

2. **FriggaFrio — Loja 2**
   - Endereço: Alameda Glete, 926, Campos Elíseos - São Paulo/SP, 01215-001
   - Telefone: (11) 4580-1227

## Terceira Unidade
A solicitação menciona uma terceira unidade. Os dados desta unidade **não foram localizados** em nenhuma configuração existente no repositório. Como os dados não podem ser inventados, essa unidade não será adicionada neste momento, permanecendo pendente de configuração futura pelo proprietário.

## Place IDs e Integração
Nenhum Place ID estava configurado. As configurações de `placeId` estavam com o comentário `// placeId: "ChI...", //TODO: Obter do Google`.

A integração com o Google Places para fotos estava sendo feita por uma rota no backend (`GET /store/google/places?placeId=...`), mas não estava retornando imagens válidas devido à ausência de Place IDs e chave API (`GOOGLE_PLACES_API_KEY`).

## Imagens Atuais
Devido à falha na integração, o fallback exibido era uma tela indicando "Foto da unidade em breve". Posteriormente as fotos da fachada (`loja-1-fachada.webp`) e do interior (`loja-1-interior.webp`) enviadas localmente pelo usuário foram configuradas como imagens estáticas de fallback.

## Resultado da Baseline (Linter e Build)
A base atual do frontend tem falhas na validação do TypeScript com erros relacionados ao Medusa Client, componentes `StoreGallery`, `address-form` (tipagem de `string | null` em formulários) e outras rotas. Estes erros pré-datam a presente implementação.
