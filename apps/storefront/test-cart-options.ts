import { sdk } from "./src/lib/medusa";

async function testCart() {
  const { regions } = await sdk.store.region.list({ currency_code: "brl" })
  const { cart } = await sdk.store.cart.create({ region_id: regions[0].id })
  console.log("Cart created:", cart.id)
  
  const { shipping_options } = await sdk.store.fulfillment.listCartOptions({ cart_id: cart.id })
  console.log("Shipping options:", shipping_options)
}

testCart().catch(console.error)
