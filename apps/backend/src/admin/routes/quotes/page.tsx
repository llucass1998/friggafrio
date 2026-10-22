import { defineRouteConfig } from "@medusajs/admin-sdk"
import { DocumentText } from "@medusajs/icons"
import { Container, Toaster } from "@medusajs/ui"
import { QuotesTable } from "./components/quotes-table"
import { BrandHeader } from "../../components/brand-header"

const Quotes = () => {
  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-7xl mx-auto w-full min-w-0">
      <BrandHeader
        title="Cotações Comerciais"
        subtitle="Gerenciamento de solicitações de orçamento e propostas sob consulta."
        badgeText="Atendimento"
      />
      <Container className="flex flex-col p-0 overflow-hidden w-full min-w-0 max-w-full">
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
