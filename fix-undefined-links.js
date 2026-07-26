import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const filesToFix = [
  'apps/storefront/src/components/company-setup-banner.tsx',
  'apps/storefront/src/components/footer.tsx',
  'apps/storefront/src/components/header/FullStoreHeader.tsx',
  'apps/storefront/src/components/header/HeaderActions.tsx',
  'apps/storefront/src/components/header/HeaderLogo.tsx',
  'apps/storefront/src/components/header/HeaderMobileDrawer.tsx',
  'apps/storefront/src/components/header/HeaderSearch.tsx',
  'apps/storefront/src/components/header/ProductsMegaMenu.tsx',
  'apps/storefront/src/components/header/StickyCommerceHeader.tsx',
  'apps/storefront/src/components/home/FeaturedCategories.tsx',
  'apps/storefront/src/components/home/FeaturedProducts.tsx',
  'apps/storefront/src/components/navbar.tsx',
  'apps/storefront/src/components/public-footer.tsx',
  'apps/storefront/src/components/public-product-card.tsx',
];

for (const file of filesToFix) {
  const fullPath = path.resolve(file);
  if (!fs.existsSync(fullPath)) continue;
  
  let content = fs.readFileSync(fullPath, 'utf8');
  let changed = false;
  
  // Fix useParams generic approach and fallback
  if (content.includes('const params = useParams({ strict: false })')) {
    content = content.replace(
      /const params = useParams\(\{ strict: false \}\)(\s+as\s+\{\s*countryCode\?:\s*string\s*\})?/g,
      'const params = useParams({ strict: false }) as Record<string, string>'
    );
    changed = true;
  }
  
  if (content.includes('const countryCode = params.countryCode || "br"')) {
    // Already fixed or close, just ensure standard
  } else if (content.includes('const countryCode = params.countryCode || "us"')) {
    content = content.replace(/const countryCode = params\.countryCode \|\| "us"/g, 'const countryCode = params.countryCode || "br"');
    changed = true;
  }
  
  if (changed) {
    fs.writeFileSync(fullPath, content);
    console.log(`[FIXED] ${file}`);
  }
}
