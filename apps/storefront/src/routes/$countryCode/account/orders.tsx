import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"
import OrdersPage from "@/pages/orders"
import AccountShell from "@/components/account-shell"
import { pageMeta } from "@/lib/seo"

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
  beforeLoad: async () => undefined,
  component: AccountOrdersRoute,
  validateSearch: ordersSearchSchema,
  head: ({ params }) => pageMeta({
    title: "Meus pedidos | FriggaFrio",
    description: "Consulte e acompanhe seu histórico de pedidos.",
    path: `/${params.countryCode}/account/orders`,
    indexable: false,
  }),
})
