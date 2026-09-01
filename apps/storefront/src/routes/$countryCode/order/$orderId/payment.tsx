import { createFileRoute } from "@tanstack/react-router"
import OrderPaymentPage from "@/pages/order-payment"
import { pageMeta } from "@/lib/seo"

export const Route = createFileRoute("/$countryCode/order/$orderId/payment")({
  component: OrderPaymentPage,
  head: ({ params }) => pageMeta({
    title: "Pagamento do pedido | FriggaFrio",
    description: "Área privada de pagamento do pedido FriggaFrio.",
    path: `/${params.countryCode}/order/${params.orderId}/payment`,
    indexable: false,
  }),
})
