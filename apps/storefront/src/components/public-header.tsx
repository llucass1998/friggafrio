import { FullStoreHeader, StickyCommerceHeader } from "./header"

interface PublicHeaderProps {
  bannerVisible?: boolean
}

export function PublicHeader({ bannerVisible = false }: PublicHeaderProps) {
  // O Header novo lida com seu próprio estado sticky e desktop/mobile
  // O FullStoreHeader fica no topo
  // O StickyCommerceHeader aparece no scroll
  return (
    <>
      <div className={bannerVisible ? "mt-12" : "mt-0"}>
        <FullStoreHeader />
      </div>
      <StickyCommerceHeader />
    </>
  )
}
