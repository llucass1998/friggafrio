const fs = require('fs');

function removeUnused(path, find, replace = '') {
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(find, replace);
  fs.writeFileSync(path, content);
}

try { removeUnused('src/components/cart.tsx', /DrawerTrigger, /g); } catch(e) {}
try { removeUnused('src/components/header/FullStoreHeader.tsx', /Link, /g); } catch(e) {}
try { removeUnused('src/pages/checkout.tsx', /const checkoutQueryClient = useQueryClient\(\)\n/g); } catch(e) {}
try { removeUnused('src/pages/order-payment.tsx', /const orderQueryClient = useQueryClient\(\)\n/g); } catch(e) {}
try { removeUnused('src/pages/product.tsx', /import \{ ProductPrice \} from "@\/components\/product-price"\n/g); } catch(e) {}
try { removeUnused('src/pages/product.tsx', /import \{ BulkVariantTable \} from "@\/components\/bulk-variant-table"\n/g); } catch(e) {}
try { removeUnused('src/pages/product.tsx', /Check, /g); } catch(e) {}
try { removeUnused('src/pages/register.tsx', /const \{ setCustomer \} = useAuth\(\)/g); } catch(e) {}
try { removeUnused('src/pages/settings.tsx', /const queryClient = useQueryClient\(\)\n/g); } catch(e) {}
try { removeUnused('src/pages/settings.tsx', /, isAuthenticated/g); } catch(e) {}
try { removeUnused('src/routes/$countryCode/account/index.tsx', /error: any/g, 'error'); } catch(e) {}
try { removeUnused('src/routes/$countryCode/products/$handle.tsx', /catch \(e\)/g, 'catch (_e)'); } catch(e) {}
try { removeUnused('src/routes/__root.tsx', /import { DevBuildBadge } from '@\/components\/DevBuildBadge';\n/g); } catch(e) {}

console.log("Unused variables removed");
