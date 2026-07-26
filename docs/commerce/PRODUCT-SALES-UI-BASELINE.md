# Product Sales UI Baseline

## Objetivo
Analisar como a UI do Storefront determina a disponibilidade de venda e exibição de preços dos produtos vindos do Medusa.

## Componentes Analisados

### `PublicProductCard` (`apps/storefront/src/components/public-product-card.tsx`)
Este é o componente principal responsável por renderizar os produtos em listas e exibir se podem ser comprados ou não.

## Lógica de Disponibilidade e Preço

A lógica principal de verificação de disponibilidade para compra está na função `getPurchasableVariant`:

```typescript
function getPurchasableVariant(product: HttpTypes.StoreProduct) {
  if (!product || !product.variants || product.variants.length === 0) {
    return null;
  }

  const isDemoPrice = (product.metadata?.is_demo_price as boolean) === true;
  const priceApprovalStatus = product.metadata?.price_approval_status as string;
  const purchaseEnabled = product.metadata?.purchase_enabled !== false;

  if (isDemoPrice || priceApprovalStatus === "pending" || !purchaseEnabled) {
    return null;
  }

  return product.variants.find((variant: any) => {
    const hasPrice = variant.calculated_price && variant.calculated_price.calculated_amount > 0;
    const hasInventory = !variant.manage_inventory || variant.allow_backorder || (variant.inventory_quantity && variant.inventory_quantity > 0);

    return hasPrice && hasInventory;
  }) || null;
}
```

### Por que um produto aparece como "Indisponível"?
O botão de compra é desabilitado e mostra "Indisponível" quando a função `getPurchasableVariant` retorna `null`. Isso ocorre se **qualquer** uma das seguintes condições for verdadeira:

1.  **Falta de Variantes:** O produto não possui variantes cadastradas (`!product.variants` ou `length === 0`).
2.  **Metadado de Demonstração:** `product.metadata.is_demo_price` é `true`.
3.  **Status de Aprovação de Preço:** `product.metadata.price_approval_status` é `"pending"`.
4.  **Desabilitado Manualmente:** `product.metadata.purchase_enabled` é explicitamente `false`.
5.  **Variante Inválida (Nenhuma variante satisfaz as regras abaixo):**
    *   **Preço:** Não possui `calculated_price` válido (`calculated_amount > 0`).
    *   **Estoque:** Se gerencia estoque (`manage_inventory === true`), não permite backorder (`allow_backorder === false`) e não tem quantidade em estoque (`inventory_quantity <= 0`).

### Por que um produto mostra "Consulte o valor"?
O texto "Consulte o valor" é exibido no lugar do preço quando a seguinte condição ocorre na renderização:

```typescript
  // Preço
  const brlPrice = product.variants?.[0]?.calculated_price?.calculated_amount
    ? product.variants[0].calculated_price.calculated_amount
    : null
```
Se a primeira variante do produto **não** tiver um `calculated_price` com `calculated_amount` definido, a UI cai no caso de fallback:

```tsx
   ) : brlPrice ? (
       <span className="text-lg font-bold text-[var(--color-text)]">
         R$ {(brlPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
       </span>
   ) : (
      <span className="text-xs text-[var(--color-text-muted)] italic">Consulte o valor</span>
   )}
```
Ou seja, quando **não há preço configurado (ou ele é zero/nulo)** para a primeira variante do produto no Medusa, a UI decide mostrar "Consulte o valor".

## Atributos do Medusa Checados
A UI atual depende estritamente dos seguintes campos e metadados retornados pela API do Medusa (`HttpTypes.StoreProduct`):

*   **Variantes (`variants`)**: A UI busca a primeira variante (`variants[0]`) para mostrar o preço e verifica todas as variantes para achar uma comprável.
*   **Preços (`variants[i].calculated_price.calculated_amount`)**: Necessário ser `> 0` para permitir compra e para mostrar o valor.
*   **Estoque (`variants[i].manage_inventory`, `variants[i].allow_backorder`, `variants[i].inventory_quantity`)**: Controle de disponibilidade em estoque.
*   **Metadados do Produto (`metadata`)**:
    *   `is_demo_price`: Se true, impede a compra (mostra "Indisponível") e exibe o label "Valor em configuração" se houver preço.
    *   `price_approval_status`: Se "pending", impede a compra (mostra "Indisponível").
    *   `purchase_enabled`: Se false, impede a compra (mostra "Indisponível").
    *   `brand`: Usado para exibir a marca.
    *   `has_real_images`: Controle visual do card.
