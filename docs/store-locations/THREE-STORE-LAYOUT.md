# Documentação - Layout da Página Nossas Lojas (Nossa Loja)

## Layout de Dois Cards por Linha
O layout foi completamente reescrito para acomodar grandes cards informativos sobre cada unidade da FriggaFrio.
A responsividade foi implementada da seguinte maneira:
- **Desktop (lg):** 2 colunas (`lg:grid-cols-2`). 
- **Tablet (md):** 2 colunas.
- **Mobile:** 1 coluna, cards ocupando a largura total (menos padding).

## Centralização do Terceiro Card
O layout foi preparado para centralizar dinamicamente o último card caso a quantidade de unidades ativas seja ímpar (como no caso de 3 lojas). A lógica utilizada foi a condicional CSS nas classes do Tailwind:
```tsx
const isLastOddItem = activeLocations.length % 2 !== 0 && index === activeLocations.length - 1
// Se for o último ímpar: "md:col-span-2 md:w-[calc(50%-0.75rem)] lg:w-[calc(50%-1rem)] md:justify-self-center w-full"
```
Isso garante que o terceiro card ocupe o espaço visual de 2 colunas, mas limite sua largura à mesma dos cards da primeira linha, posicionando-se perfeitamente no centro.

## Dados das Lojas
Os dados provêm de `apps/storefront/src/config/store-locations.ts`.
- **Loja 1:** Alameda Glete, 663, SP. `active: true`
- **Loja 2:** Alameda Glete, 926, SP. `active: true`
- **Terceira unidade:** Os dados não foram localizados no repositório. Por instruções de segurança, nenhuma loja fictícia foi criada. A loja deve ser inserida futuramente na configuração.

## Componentes
- `GooglePlacePhoto`: Responsável por exibir a imagem de fachada (Google Places API). 
- `StoreLocationCard`: O card principal de cada unidade.
- `GoogleStoreMap`: Exibição do mapa (Maps Embed API).
- `StoreStreetView`: Exibição do Street View (Maps Embed API).

## Mapa, Street View e Aba Fotos
Para evitar sobrecarga de requisições, um único painel grande sob o layout dos cards exibe interativamente o mapa ou street view da loja *selecionada*.
O painel contém uma navegação via abas ("Mapa", "Vista da rua").

## WhatsApp
Os botões de WhatsApp de cada card contêm URLs pré-preenchidas com a mensagem referenciando a rua daquela unidade, abrindo nativamente a API do WhatsApp `wa.me`.

## Horários
Conforme especificação, como os horários exatos para os dias da semana não estão definidos no banco de dados, está sendo exibida a string:
"Consulte o horário de atendimento"
