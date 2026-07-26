import fs from 'fs';
import path from 'path';

const cartFile = path.resolve('apps/storefront/src/components/cart.tsx');
let content = fs.readFileSync(cartFile, 'utf8');

// The issue might be that we don't have countryCode in scope for links 
// or the add to cart logic is failing.

if (content.includes('const countryCode = getCountryCodeFromPath(location.pathname) || "br"')) {
  console.log("Cart file already has fallback for countryCode");
} else if (content.includes('const countryCode = getCountryCodeFromPath(location.pathname)')) {
  content = content.replace(
    /const countryCode = getCountryCodeFromPath\(location\.pathname\)/g, 
    'const countryCode = getCountryCodeFromPath(location.pathname) || "br"'
  );
  fs.writeFileSync(cartFile, content);
  console.log("Updated Cart countryCode fallback");
}

