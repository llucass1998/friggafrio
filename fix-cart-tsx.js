import fs from 'fs';
import path from 'path';

const cartFile = path.resolve('apps/storefront/src/components/cart.tsx');
let content = fs.readFileSync(cartFile, 'utf8');

// The issue might be that we don't have countryCode in scope for links 
// or the add to cart logic is failing.

if (content.includes('const countryCode = getCountryCodeFromPath(location.pathname) || "br"')) {
  console.log("Cart file already has fallback for countryCode");
}

const checkoutFile = path.resolve('apps/storefront/src/routes/$countryCode/checkout.tsx');
if (fs.existsSync(checkoutFile)) {
    let check = fs.readFileSync(checkoutFile, 'utf8');
    if (!check.includes('const { countryCode } = params')) {
        console.log("Checkout file may have issue with countryCode");
    }
}
