const fs = require('fs');

const file = 'use-cart.ts';
let code = fs.readFileSync(file, 'utf8');

const target = `      const response = await sdk.store.cart.createLineItem(
        cartId,
        { variant_id, quantity },
        { fields: requestFields || fields || DEFAULT_CART_FIELDS }
      )
      return response.cart`;

const replacement = `      try {
        const response = await sdk.store.cart.createLineItem(
          cartId,
          { variant_id, quantity },
          { fields: requestFields || fields || DEFAULT_CART_FIELDS }
        )
        return response.cart
      } catch (err) {
        if (err?.message?.includes("not found") || err?.status === 404 || err?.status === 400 || err?.type === "not_found") {
          // Removes corrupted/old cart ID
          removeStoredCart()
          
          // Recreate the cart transparently
          const { regions } = await sdk.store.region.list({})
          const region = regions.find(r => r.countries?.some(c => c.iso_2 === country_code.toLowerCase()))
          if (region) {
            const { cart } = await sdk.store.cart.create({ region_id: region.id }, {
              fields: requestFields || fields || DEFAULT_CART_FIELDS,
            })
            setStoredCart(cart.id)
            const response = await sdk.store.cart.createLineItem(
              cart.id,
              { variant_id, quantity },
              { fields: requestFields || fields || DEFAULT_CART_FIELDS }
            )
            return response.cart
          }
        }
        throw err;
      }`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  
  // Assegurar import do removeStoredCart
  if (!code.includes('removeStoredCart')) {
    code = code.replace('setStoredCart,', 'setStoredCart,\n  removeStoredCart,');
  }

  fs.writeFileSync(file, code);
  console.log("Patch aplicado em use-cart.ts");
} else {
  console.log("Target nao encontrado");
}
