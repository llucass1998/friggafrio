const fs = require('fs');

function removeUnused(path, find, replace = '') {
  try {
    let content = fs.readFileSync(path, 'utf8');
    content = content.replace(find, replace);
    fs.writeFileSync(path, content);
  } catch(e) {}
}

removeUnused('src/components/cart.tsx', /DrawerTrigger/g);
removeUnused('src/components/header/FullStoreHeader.tsx', /const countryCode = "br"\n/g);
removeUnused('src/pages/product.tsx', /import \{ ProductPrice \} from "@\/components\/product-price"\n/g);
removeUnused('src/pages/product.tsx', /import \{ Check \} from "lucide-react"\n/g);
removeUnused('src/pages/register.tsx', /const \{ setCustomer \} = useAuth\(\)/g, 'const auth = useAuth()');
removeUnused('src/pages/settings.tsx', /, useQueryClient/g);
removeUnused('src/routes/$countryCode/account/index.tsx', /catch \(error\)/g, 'catch (_error)');
removeUnused('src/routes/$countryCode/products/$handle.tsx', /catch \(e\)/g, 'catch (_e)');
removeUnused('src/routes/__root.tsx', /import \{ DevBuildBadge \} from '@\/components\/DevBuildBadge';\n/g);

console.log("Unused variables removed round 2");
