#!/bin/bash
sed -i 's/const itemCount = sortedItems?.reduce((total, item) => total + item.quantity, 0) || 0/const itemCount = getCartItemCount(sortedItems)/g' apps/storefront/src/components/cart.tsx
sed -i 's/import { sortCartItems } from "@\/lib\/utils\/cart"/import { sortCartItems, getCartItemCount } from "@\/lib\/utils\/cart"/g' apps/storefront/src/components/cart.tsx
