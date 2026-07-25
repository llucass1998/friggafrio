# Product Card Purchase Action

## Overview
The product cards were previously using a two-button layout with "Detalhes" and "Orçamento" actions. Based on the constraints for the new design, these buttons were removed in favor of a primary, streamlined "Comprar" action that integrates directly with the Medusa v2 cart system.

## Changes Implemented
- **Buttons Removed**: "Detalhes" and "Orçamento".
- **Button Added**: "Comprar", which uses Medusa's `addToCart` handler.
- **Variant Selection**: We introduced the `getPurchasableVariant` selector to correctly parse the product array and find a variant with a valid price and inventory.
- **Medusa Integration**: Leveraging `@tanstack/react-query` to make an asynchronous `useMutation` to add the selected variant.
- **Cart Context Sync**: Uses the `useCartDrawer` context (`openCart()`) to trigger the animated cart side drawer after successfully adding the item to the cart.
- **Visuals and Accessibility**: Buttons are fully responsive (`min-h-[44px]`), block double-clicks using states (`isPending`, `isSuccess`), and change to "Indisponível" when products are out of stock.

## Security
- Validates the commercial viability before triggering any Cart mutations. Checks for `is_demo_price`, `price_approval_status`, and `purchase_enabled` from the product metadata. 
