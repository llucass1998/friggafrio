#!/bin/bash
sed -i 's/const itemCount = sortedItems?.reduce((total, item) => total + item.quantity, 0) || 0/const itemCount = getCartItemCount(sortedItems)/g' apps/storefront/src/components/cart.tsx
sed -i 's/import { sortCartItems } from "@/lib\/utils\/cart"/import { sortCartItems, getCartItemCount } from "@/lib\/utils\/cart"/g' apps/storefront/src/components/cart.tsx

sed -i 's/const itemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0)/const itemCount = getCartItemCount(cartItems)/g' apps/storefront/src/pages/cart.tsx
sed -i 's/import { sortCartItems, getStoredCart } from "@/lib\/utils\/cart"/import { sortCartItems, getStoredCart, getCartItemCount } from "@/lib\/utils\/cart"/g' apps/storefront/src/pages/cart.tsx

sed -i 's/const itemCount = cart?.items?.reduce((total, item) => total + Number(item.quantity ?? 0), 0) ?? 0;/const itemCount = getCartItemCount(cart?.items);/g' apps/storefront/src/components/FloatingActions.tsx
sed -i 's/import { useCart } from "@/lib\/hooks\/use-cart";/import { useCart } from "@/lib\/hooks\/use-cart";\nimport { getCartItemCount } from "@/lib\/utils\/cart";/g' apps/storefront/src/components/FloatingActions.tsx

sed -i 's/const itemCount = cart?.items?.length ?? 0/const itemCount = getCartItemCount(cart?.items)/g' apps/storefront/src/components/navbar.tsx
sed -i 's/import { useCart } from "@/lib\/hooks\/use-cart"/import { useCart } from "@/lib\/hooks\/use-cart"\nimport { getCartItemCount } from "@/lib\/utils\/cart"/g' apps/storefront/src/components/navbar.tsx
