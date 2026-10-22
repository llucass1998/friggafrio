import { Table, Text } from "@medusajs/ui"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useNavigate } from "react-router-dom"
import { useQuotes } from "../../../hooks/api/quotes"
import { formatAmount } from "../../../utils"
import QuoteStatusBadge from "./quote-status-badge"
import { QueryQuote } from "../../../../types"
import { DEFAULT_CURRENCY_CODE } from "../../../../lib/commerce-defaults"

export const QuotesTable = () => {
  const navigate = useNavigate()
  const { quotes = [], isPending } = useQuotes({
    order: "-created_at",
  })

  if (isPending) {
    return (
      <div className="flex items-center justify-center p-8">
        <Text className="text-ui-fg-subtle">Carregando cotações...</Text>
      </div>
    )
  }

  if (!quotes.length) {
    return (
      <div className="flex flex-col items-center justify-center p-12 gap-y-2">
        <Text className="text-ui-fg-subtle font-medium">Nenhuma cotação encontrada</Text>
        <Text className="text-ui-fg-muted text-sm">
          Não há cotações registradas na base de dados no momento.
        </Text>
      </div>
    )
  }

  return (
    <div className="p-0">
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>ID</Table.HeaderCell>
            <Table.HeaderCell>Status</Table.HeaderCell>
            <Table.HeaderCell>E-mail</Table.HeaderCell>
            <Table.HeaderCell>Empresa</Table.HeaderCell>
            <Table.HeaderCell>Total</Table.HeaderCell>
            <Table.HeaderCell>Criado em</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {(quotes as unknown as QueryQuote[]).map((quote) => {
            const customer = quote.customer as { email?: string } | undefined
            const draftOrder = quote.draft_order as
              | {
                  display_id?: number | string
                  total?: number | null
                  currency_code?: string
                  customer?: { employee?: { company?: { name?: string } } }
                }
              | undefined

            const companyName = draftOrder?.customer?.employee?.company?.name || "-"
            const displayId = draftOrder?.display_id ? `#${draftOrder.display_id}` : quote.id.slice(0, 8)
            const createdDate = quote.created_at
              ? format(new Date(quote.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
              : "-"

            return (
              <Table.Row
                key={quote.id}
                className="cursor-pointer hover:bg-ui-bg-base-hover"
                onClick={() => navigate(`/quotes/${quote.id}`)}
              >
                <Table.Cell>
                  <Text className="txt-compact-small font-mono">{displayId}</Text>
                </Table.Cell>
                <Table.Cell>
                  <QuoteStatusBadge status={quote.status} />
                </Table.Cell>
                <Table.Cell>
                  <Text className="txt-compact-small">{customer?.email || "-"}</Text>
                </Table.Cell>
                <Table.Cell>
                  <Text className="txt-compact-small">{companyName}</Text>
                </Table.Cell>
                <Table.Cell>
                  <Text className="txt-compact-small font-medium">
                    {draftOrder?.total != null
                      ? formatAmount(
                          draftOrder.total,
                          draftOrder.currency_code || DEFAULT_CURRENCY_CODE,
                        )
                      : "-"}
                  </Text>
                </Table.Cell>
                <Table.Cell>
                  <Text className="txt-compact-small text-ui-fg-muted">{createdDate}</Text>
                </Table.Cell>
              </Table.Row>
            )
          })}
        </Table.Body>
      </Table>
    </div>
  )
}
