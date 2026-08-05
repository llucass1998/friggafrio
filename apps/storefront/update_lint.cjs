const fs = require('fs')

// 1. checkout.tsx
let path = 'src/pages/checkout.tsx'
let content = fs.readFileSync(path, 'utf8')
content = content.replace('import { useAuth } from "@/lib/hooks/use-auth"', '')
content = content.replace('const isAuthenticated = !!customerData?.customer && !isUnauthenticated && !isAuthError', '')
content = content.replace('!(customerError as any).message?.toLowerCase().includes("unauthorized") && (customerError as any).status !== 401', '!(customerError as { message?: string, status?: number }).message?.toLowerCase().includes("unauthorized") && (customerError as { status?: number }).status !== 401')
fs.writeFileSync(path, content)

// 2. login.tsx
path = 'src/pages/login.tsx'
content = fs.readFileSync(path, 'utf8')
content = content.replace('const navigate = useNavigate()', '')
fs.writeFileSync(path, content)

// 3. register.tsx
path = 'src/pages/register.tsx'
content = fs.readFileSync(path, 'utf8')
content = content.replace('const navigate = useNavigate()', '')
fs.writeFileSync(path, content)

// 4. checkout-auth.spec.ts
path = 'tests/checkout-auth.spec.ts'
content = fs.readFileSync(path, 'utf8')
content = content.replace('let TEST_VARIANT: any = null;', 'import { HttpTypes } from "@medusajs/types"\nlet TEST_VARIANT: HttpTypes.StoreProductVariant | null = null;')
content = content.replace('(r: any) =>', '(r: HttpTypes.StoreRegion) =>')
content = content.replace(/\\/store\\/carts\\/cart_\[\^\\/\]\+\$/g, '/store/carts/cart_[^/]+$')
fs.writeFileSync(path, content)
