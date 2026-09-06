import { defineRouteConfig } from "@medusajs/admin-sdk"
import { MagnifyingGlass } from "@medusajs/icons"
import { Container } from "@medusajs/ui"

import { OmieProductSearchPanel } from "../../components/omie-product-search-panel"

const OmieProductsPage = () => (
  <Container className="max-w-3xl">
    <OmieProductSearchPanel />
  </Container>
)

export default OmieProductsPage

export const config = defineRouteConfig({ label: "Buscar codigo FriggaFrio / Omie", icon: MagnifyingGlass })
