import { defineRouteConfig } from "@medusajs/admin-sdk"
import { MagnifyingGlass } from "@medusajs/icons"
import { Container } from "@medusajs/ui"
import { OmieProductSearchPanel } from "../../components/omie-product-search-panel"
import { BrandHeader } from "../../components/brand-header"

const OmieProductsPage = () => (
  <div className="p-6 max-w-5xl mx-auto">
    <BrandHeader
      title="Buscar Código FriggaFrio / Omie"
      subtitle="Localização rápida de itens no catálogo local e pesquisa sob demanda na Omie."
      badgeText="Integração ERP"
    />
    <Container className="p-6">
      <OmieProductSearchPanel />
    </Container>
  </div>
)

export default OmieProductsPage

export const config = defineRouteConfig({
  label: "Buscar Código FriggaFrio / Omie",
  icon: MagnifyingGlass,
  rank: 2,
})
