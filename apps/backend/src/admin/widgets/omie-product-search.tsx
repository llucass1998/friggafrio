import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container } from "@medusajs/ui"

import { OmieProductSearchPanel } from "../components/omie-product-search-panel"

const OmieProductSearch = () => (
  <Container className="my-4 max-w-none">
    <OmieProductSearchPanel />
  </Container>
)

export const config = defineWidgetConfig({
  zone: "product.list.before",
  id: "friggafrio.omie-product-search",
})

export default OmieProductSearch
