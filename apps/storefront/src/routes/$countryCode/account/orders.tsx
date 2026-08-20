import { createFileRoute, redirect } from "@tanstack/react-router"
import { z } from "zod"
import OrdersPage from "@/pages/orders"
import AccountShell from "@/components/account-shell"
import { sdk } from "@/lib/medusa"
import { normalizeReturnTo } from "@/lib/auth/return-to"

const ordersSearchSchema = z.object({
  orderId: z.string().optional(),
  filter: z.enum(["all", "in_progress", "delivered", "canceled"]).optional(),
})

function AccountOrdersRoute() {
  return (
    <AccountShell>
      <OrdersPage />
    </AccountShell>
  )
}

export const Route = createFileRoute("/$countryCode/account/orders")({
  beforeLoad: async ({ params, search }) => {
    try {
      await sdk.store.customer.retrieve()
    } catch {
      const countryCode = params.countryCode || "br"
      const orderId = typeof search.orderId === "string"
        ? `?orderId=${encodeURIComponent(search.orderId)}`
        : ""
      const filter = typeof search.filter === "string"
        ? `${orderId ? "&" : "?"}filter=${encodeURIComponent(search.filter)}`
        : ""
      const returnTo = normalizeReturnTo(`/${countryCode}/account/orders${orderId}${filter}`, countryCode)
      throw redirect({
        to: "/$countryCode/account/login",
        params: { countryCode },
        search: { returnTo },
      })
    }
  },
  component: AccountOrdersRoute,
  validateSearch: ordersSearchSchema,
  head: () => {
    return {
      meta: [
        {
          title: "Meus pedidos | FriggaFrio",
        },
        {
          name: "description",
          content: "Consulte e acompanhe seu histórico de pedidos.",
        },
      ],
    }
  },
})
