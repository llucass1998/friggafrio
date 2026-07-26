#!/bin/bash
cat apps/storefront/src/pages/cart.tsx | sed 's/<Button className="w-full" size="lg">/<Button className="w-full" size="lg" disabled={cartItems.some(item => !item.variant_id || item.quantity <= 0)}>/g' > temp_cart.tsx
mv temp_cart.tsx apps/storefront/src/pages/cart.tsx
