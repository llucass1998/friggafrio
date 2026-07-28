import { ProductsMegaMenu } from "@/components/header/ProductsMegaMenu"

export function HeaderDesktopNav() {
  return (
    <nav className="hidden lg:flex items-center gap-6 h-full">
      <ProductsMegaMenu />
    </nav>
  )
}
