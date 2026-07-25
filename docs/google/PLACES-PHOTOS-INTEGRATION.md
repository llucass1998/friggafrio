# Google Places e Photos - Setup de Integração

## APIs Utilizadas
- **Google Maps Embed API**: Utilizada para exibir o Mapa interativo e a funcionalidade interativa de Street View no Frontend.
- **Google Places API (New)**: Utilizada pelo Backend Medusa para procurar pelo Place ID os metadados do lugar (como nome e fotos) de forma segura.

## Segurança das Chaves
A API do Google exige duas chaves distintas para um funcionamento seguro:
1. `VITE_GOOGLE_MAPS_EMBED_API_KEY`: Usada pelo frontend. **DEVE** ser restringida no Console do Google Cloud para que seja ativada apenas pelo `HTTP Referrers` específicos da aplicação.
2. `GOOGLE_PLACES_API_KEY`: Usada no backend (Medusa). **NUNCA** deve possuir o prefixo `VITE_`. Seu valor permanece escondido do frontend e deve ser restringida apenas para IPs autorizados em produção.

## Place IDs e Place Details
O Google identifica cada ponto de interesse (loja) através do `place_id`. 
Quando o backend fizer o fetch usando a API New, usamos **Field Masks** estritas.
Ex: `X-Goog-FieldMask: "photos"`
Isso previne cobranças desnecessárias sobre dados que não vamos usar (ex: reviews).

## Tratamento de Referências e Cache
O campo de referência da imagem retornado pela Google Places expira e nunca deve ser persistido como URL fixa.
Não implementamos o arquivamento das imagens no projeto conforme a diretriz de não usar fotos como "assets próprios".

## Como trocar por Foto Própria ou Desativar Google
Se você deseja trocar por uma foto própria, ou a foto do Google Places estiver indisponível/inadequada, adicione as propriedades `ownImageSrc` e `ownImageAlt` na respectiva loja em `store-locations.ts`.
A existência da propriedade `ownImageSrc` tem prioridade absoluta em cima das requisições via Places API, inibindo o consumo dessa API para o local específico.
