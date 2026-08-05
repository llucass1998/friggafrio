const url = 'http://localhost:9000/store/products?fields=*variants.calculated_price,*variants.inventory_quantity';
const key = 'pk_e630a8a6efe3d9d95a3f9208909c0f345897e1fb2376fd05a214e7aa4ed04c69';

async function run() {
  const resp = await fetch(url, { headers: { 'x-publishable-api-key': key }});
  const data = await resp.json();
  const prod = data.products?.[0];
  
  if (!prod) {
    console.log("No products.", data);
    return;
  }
  const variant = prod.variants?.[0];
  
  if (!variant) {
    console.log("No variant.");
    return;
  }
  
  console.log(`Product: ${prod.id} Variant: ${variant.id}`);
  
  const regionsResp = await fetch('http://localhost:9000/store/regions', { headers: { 'x-publishable-api-key': key }});
  const regionsData = await regionsResp.json();
  const region = regionsData.regions?.[0];
  console.log(`Region: ${region?.id}`);
  
  if (!region) return;

  console.log('Creating cart...');
  const cartResp = await fetch('http://localhost:9000/store/carts', {
    method: 'POST',
    headers: { 'x-publishable-api-key': key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ region_id: region.id })
  });
  const cartData = await cartResp.json();
  console.log("Cart created:", cartData.cart?.id);

  console.log('Adding line item...');
  const lineResp = await fetch(`http://localhost:9000/store/carts/${cartData.cart?.id}/line-items`, {
    method: 'POST',
    headers: { 'x-publishable-api-key': key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ variant_id: variant.id, quantity: 1 })
  });
  const lineData = await lineResp.json();
  console.log("Line item added:", lineData);
}

run();
