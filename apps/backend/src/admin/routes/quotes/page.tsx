import { defineRouteConfig } from "@medusajs/admin-sdk"
import { DocumentText } from "@medusajs/icons"
import { Container, Toaster } from "@medusajs/ui"
import { QuotesTable } from "./components/quotes-table"
import { BrandHeader } from "../../components/brand-header"

const Quotes = () => {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <BrandHeader
        title="Cotações Comerciais"
        subtitle="Gerenciamento de solicitações de orçamento e propostas sob consulta."
        badgeText="Atendimento"
      />
      <Container className="flex flex-col p-0 overflow-hidden">
        <QuotesTable />
      </Container>
      <Toaster />
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Cotações",
  icon: DocumentText,
  rank: 3,
})

export default Quotes
