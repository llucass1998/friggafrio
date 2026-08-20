import { useState, useEffect } from "react"
import { Link, useParams, useNavigate, useSearch } from "@tanstack/react-router"
import { useAuth } from "@/lib/hooks/use-auth"
import { useCustomerOrders, useReorder } from "@/lib/hooks/use-orders"
import { ActionMenu, type ActionMenuItem } from "@/components/ui/action-menu"
import { Thumbnail } from "@/components/ui/thumbnail"
import { Price } from "@/components/ui/price"
import Address from "@/components/address"
import { formatOrderId } from "@/lib/utils/order"
import { CheckoutStepKey } from "@/lib/types/global"
import {
  ShoppingBag,
  Clock,
  CheckCircleSolid,
  XCircleSolid,
  Eye,
  XMark,
  CurrencyDollar,
  ArrowPath,
} from "@medusajs/icons"
import type { HttpTypes } from "@medusajs/types"
import { paymentAvailability } from "@/lib/config/payment-availability"
import { DEFAULT_COUNTRY_CODE } from "@/config/commerce"
import { getOrderTracking } from "@/lib/utils/order-tracking"
import { OrderTrackingTimeline, OrderTrackingBadge } from "@/components/order-tracking"

function formatDate(dateValue: string | Date | undefined | null): string {
  if (!dateValue) return "-"
  const date = typeof dateValue === "string" ? new Date(dateValue) : dateValue
  return date.toLocaleDateString("pt-BR", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function getOrderStatusConfig(status: string) {
  switch (status) {
    case "pending":
      return {
        label: "Pendente",
        icon: Clock,
        bgClass: "bg-amber-100 text-amber-700",
      }
    case "completed":
      return {
        label: "Concluído",
        icon: CheckCircleSolid,
        bgClass: "bg-green-100 text-green-700",
      }
    case "canceled":
      return {
        label: "Cancelado",
        icon: XCircleSolid,
        bgClass: "bg-red-100 text-red-700",
      }
    case "requires_action":
      return {
        label: "Requer ação",
        icon: Clock,
        bgClass: "bg-blue-100 text-blue-700",
      }
    default:
      return {
        label: status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        icon: ShoppingBag,
        bgClass: "bg-gray-100 text-gray-700",
      }
  }
}

function getPaymentStatusConfig(status: string | undefined) {
  switch (status) {
    case "not_paid":
      return {
        label: "Aguardando pagamento",
        bgClass: "bg-amber-100 text-amber-700",
        showPayButton: paymentAvailability.processingEnabled,
      }
    case "awaiting":
      return {
        label: "Processando",
        bgClass: "bg-blue-100 text-blue-700",
        showPayButton: false,
      }
    case "captured":
      return {
        label: "Pago",
        bgClass: "bg-green-100 text-green-700",
        showPayButton: false,
      }
    case "refunded":
      return {
        label: "Reembolsado",
        bgClass: "bg-gray-100 text-gray-700",
        showPayButton: false,
      }
    case "partially_refunded":
      return {
        label: "Reembolsado parcialmente",
        bgClass: "bg-gray-100 text-gray-700",
        showPayButton: false,
      }
    case "canceled":
      return {
        label: "Cancelado",
        bgClass: "bg-red-100 text-red-700",
        showPayButton: false,
      }
    default:
      return {
        label: status || "Desconhecido",
        bgClass: "bg-gray-100 text-gray-700",
        showPayButton: false,
      }
  }
}

interface OrderDetailModalProps {
  order: HttpTypes.StoreOrder
  countryCode: string
  onClose: () => void
  onReorder: (orderId: string) => void
  isReordering: boolean
}

function OrderDetailModal({
  order,
  countryCode,
  onClose,
  onReorder,
  isReordering,
}: OrderDetailModalProps) {
  const statusConfig = getOrderStatusConfig(order.status || "pending")
  const StatusIcon = statusConfig.icon
  const paymentStatus = order.payment_collections?.[0]?.status
  const paymentStatusConfig = getPaymentStatusConfig(paymentStatus)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Pedido {formatOrderId(String(order.display_id ?? order.id ?? ""))}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Realizado em {formatDate(order.created_at!)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMark className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status Badges */}
          <div className="flex flex-wrap gap-3">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${statusConfig.bgClass}`}
            >
              <StatusIcon className="w-4 h-4" />
              {statusConfig.label}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${paymentStatusConfig.bgClass}`}
            >
              <CurrencyDollar className="w-4 h-4" />
              {paymentStatusConfig.label}
            </span>
          </div>

          <OrderTrackingTimeline order={order} />

          {/* Payment Required Banner */}
          {paymentStatusConfig.showPayButton && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                    <CurrencyDollar className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-amber-800">
                      Pagamento necessário
                    </h4>
                    <p className="text-sm text-amber-600">
                      Pagamento temporariamente indisponível
                    </p>
                  </div>
                </div>
                <Link
                  to={"/$countryCode/order/$orderId/payment" as string} params={{ countryCode, orderId: order.id }}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium text-sm"
                >
                  Pagar agora
                </Link>
              </div>
            </div>
          )}

          {/* Order Items */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Itens</h3>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                      Produto
                    </th>
                    <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">
                      Qtd.
                    </th>
                    <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {order.items?.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Thumbnail
                            thumbnail={item.thumbnail}
                            alt={item.product_title || item.title}
                            className="w-12 h-12"
                          />
                          <div>
                            <p className="font-medium text-gray-900">
                              {item.product_title}
                            </p>
                            {item.variant_title &&
                              item.variant_title !== "Default Variant" && (
                                <p className="text-sm text-gray-500">
                                  {item.variant_title}
                                </p>
                              )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Price
                          price={item.total}
                          currencyCode={order.currency_code}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <Price
                price={order.item_subtotal}
                currencyCode={order.currency_code}
              />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Frete</span>
              <Price
                price={order.shipping_total}
                currencyCode={order.currency_code}
              />
            </div>
            {order.discount_total !== undefined && order.discount_total > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Desconto</span>
                <Price
                  price={order.discount_total}
                  currencyCode={order.currency_code}
                  type="discount"
                />
              </div>
            )}
            <div className="flex justify-between text-sm">
                <span className="text-gray-600">Impostos</span>
              <Price
                price={order.tax_total}
                currencyCode={order.currency_code}
              />
            </div>
            <hr className="border-gray-200 my-2" />
            <div className="flex justify-between font-semibold text-lg">
              <span>Total</span>
              <Price price={order.total} currencyCode={order.currency_code} />
            </div>
          </div>

          {/* Shipping Information */}
          {order.shipping_address && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">
                Informações de entrega
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-600 mb-2">
                    Endereço de entrega
                  </h4>
                  <Address address={order.shipping_address} />
                </div>
                {order.shipping_methods?.[0] && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-600 mb-2">
                      Método de entrega
                    </h4>
                    <p className="text-gray-900">
                      {order.shipping_methods[0].name}
                    </p>
                    <Price
                      price={order.shipping_methods[0].amount}
                      currencyCode={order.currency_code}
                      className="text-gray-600 text-sm"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Billing Information */}
          {order.billing_address && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">
                Informações de cobrança
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <Address address={order.billing_address} />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
          >
            Fechar
          </button>
          <button
            onClick={() => onReorder(order.id)}
            disabled={isReordering}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isReordering ? (
              <ArrowPath className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowPath className="w-4 h-4" />
            )}
            Comprar novamente
          </button>
          {paymentStatusConfig.showPayButton && (
            <Link
              to={"/$countryCode/order/$orderId/payment" as string} params={{ countryCode, orderId: order.id }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Pagar agora
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

interface OrderWithPlacedBy extends HttpTypes.StoreOrder {
  placed_by?: {
    id: string
    email: string
    first_name?: string
    last_name?: string
    is_admin?: boolean
  }
}

export default function OrdersPage() {
  const { countryCode } = useParams({ strict: false })
  const search = useSearch({ strict: false }) as { orderId?: string; filter?: "all" | "in_progress" | "delivered" | "canceled" }
  const navigate = useNavigate()
  const { isAuthenticated, isLoading: authLoading, employee } = useAuth()
  const isAdmin = employee?.is_admin === true
  const [selectedOrder, setSelectedOrder] = useState<OrderWithPlacedBy | null>(
    null
  )
  const [reorderingId, setReorderingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<"all" | "in_progress" | "delivered" | "canceled">(search.filter || "all")

  const { data: orders, isLoading: ordersLoading } = useCustomerOrders({
      fields:
      "+item_subtotal,+shipping_total,+fulfillment_status,*items,*items.variant,*items.product,*shipping_address,*billing_address,*shipping_methods,*payment_collections,*fulfillments,*fulfillments.labels",
  }) as { data: OrderWithPlacedBy[] | undefined; isLoading: boolean }

  const reorderMutation = useReorder()

  // Auto-open order detail modal when navigating from quotes with orderId
  useEffect(() => {
    if (search.orderId && orders && orders.length > 0 && !selectedOrder) {
      const order = orders.find((o) => o.id === search.orderId)
      if (order) {
        setSelectedOrder(order)
        // Clear the search param after opening
        navigate({
          to: "/$countryCode/account/orders",
          params: { countryCode: countryCode || DEFAULT_COUNTRY_CODE },
          search: {},
          replace: true,
        })
      }
    }
  }, [search.orderId, orders, selectedOrder, navigate, countryCode])

  const handleReorder = async (orderId: string) => {
    setReorderingId(orderId)
    try {
      await reorderMutation.mutateAsync({ orderId })
      // Navigate to the review step of checkout
      navigate({
        to: "/$countryCode/checkout",
        params: { countryCode: countryCode || DEFAULT_COUNTRY_CODE },
        search: { step: CheckoutStepKey.REVIEW },
      })
    } catch (error) {
      console.error("Failed to reorder:", error)
      setReorderingId(null)
    }
  }

  const isLoading = authLoading || ordersLoading
  const visibleOrders = (orders ?? []).filter((order) => {
    const tracking = getOrderTracking(order)
    if (filter === "in_progress") return tracking.isInProgress
    if (filter === "delivered") return tracking.status === "delivered"
    if (filter === "canceled") return tracking.status === "canceled"
    return true
  })

  if (!isAuthenticated && !authLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Histórico de pedidos</h1>
          <p className="text-gray-500 mt-1">Consulte e acompanhe seus pedidos.</p>
        </div>
        <div className="text-center py-12">
          <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Entre para consultar seus pedidos
          </h3>
          <p className="text-gray-500 mb-6">
            Você precisa estar conectado para acessar seu histórico de pedidos.
          </p>
          <Link
            to={"/$countryCode/account/login" as string} params={{ countryCode }}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Entrar
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Histórico de pedidos</h1>
        <p className="text-gray-500 mt-1">
          {isAdmin ? "Consulte e gerencie os pedidos da empresa." : "Consulte e acompanhe seus pedidos."}
        </p>
      </div>
      <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Filtrar pedidos">
        {([
          ["all", "Todos"],
          ["in_progress", "Em andamento"],
          ["delivered", "Entregues"],
          ["canceled", "Cancelados"],
        ] as const).map(([value, label]) => (
          <button key={value} type="button" onClick={() => setFilter(value)} className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${filter === value ? "border-blue-800 bg-blue-800 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-blue-300"}`}>
            {label}
          </button>
        ))}
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <ArrowPath className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : !orders || orders.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum pedido ainda
          </h3>
          <p className="text-gray-500 mb-6">
            Quando você fizer um pedido, ele aparecerá aqui.
          </p>
          <Link
            to={"/$countryCode/store" as string} params={{ countryCode }}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Explorar produtos
          </Link>
        </div>
      ) : visibleOrders.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white py-12 text-center">
          <h3 className="text-lg font-semibold text-slate-900">Nenhum pedido encontrado</h3>
          <p className="mt-2 text-sm text-slate-500">Tente outro filtro para consultar seu histórico.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">
                    Pedido
                  </th>
                  {isAdmin && (
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">
                      Solicitado por
                    </th>
                  )}
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">
                    Date
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">
                    Status
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">
                    Pagamento
                  </th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-gray-900">
                    Total
                  </th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visibleOrders.map((order) => {
                  const statusConfig = getOrderStatusConfig(
                    order.status || "pending"
                  )
                  const StatusIcon = statusConfig.icon
                  const paymentStatus = order.payment_collections?.[0]?.status
                  const paymentStatusConfig = getPaymentStatusConfig(paymentStatus)

                  const tracking = getOrderTracking(order)
                  const actionItems: ActionMenuItem[] = [
                    {
                      label: tracking.isInProgress ? "Acompanhar entrega" : "Ver detalhes",
                      icon: Eye,
                      onClick: () => setSelectedOrder(order),
                    },
                    {
                      label: "Comprar novamente",
                      icon: ArrowPath,
                      onClick: () => handleReorder(order.id),
                      disabled: reorderingId === order.id,
                      loading: reorderingId === order.id,
                    },
                  ]

                  if (paymentStatusConfig.showPayButton) {
                    actionItems.push({
                      label: "Pagar agora",
                      icon: CurrencyDollar,
                      onClick: () => {
                        const orderId = order.id
                        if (!countryCode || !orderId) return

                        navigate({
                          to: "/$countryCode/order/$orderId/payment",
                          params: { countryCode, orderId },
                        })
                      },
                      variant: "primary",
                    })
                  }

                  return (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <ShoppingBag className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {formatOrderId(
                                String(order.display_id ?? order.id ?? "")
                              )}
                            </p>
                            <p className="text-sm text-gray-500">
                              {order.items?.length || 0} item
                              {(order.items?.length || 0) !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4">
                          {order.placed_by ? (
                            <div>
                              <p className="font-medium text-gray-900">
                                {order.placed_by.first_name} {order.placed_by.last_name}
                              </p>
                              <p className="text-sm text-gray-500">
                                {order.placed_by.email}
                              </p>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      )}
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(order.created_at!)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${statusConfig.bgClass}`}>
                            <StatusIcon className="w-3.5 h-3.5" />
                            {statusConfig.label}
                          </span>
                          <OrderTrackingBadge order={order} />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${paymentStatusConfig.bgClass}`}
                        >
                          {paymentStatusConfig.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Price
                          price={order.total}
                          currencyCode={order.currency_code}
                          className="font-medium"
                        />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end">
                          <ActionMenu items={actionItems} />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          countryCode={countryCode || DEFAULT_COUNTRY_CODE}
          onClose={() => setSelectedOrder(null)}
          onReorder={handleReorder}
          isReordering={reorderingId === selectedOrder.id}
        />
      )}
    </div>
  )
}
