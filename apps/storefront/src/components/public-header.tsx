import { FullStoreHeader, StickyCommerceHeader } from "./header"

export function PublicHeader() {
  // O Header novo lida com seu próprio estado sticky e desktop/mobile
  // O FullStoreHeader fica no topo
  // O StickyCommerceHeader aparece no scroll
  return (
    <>
      <div className="mt-0">
        <FullStoreHeader />
      </div>
      <StickyCommerceHeader />
    </>
  )
}
