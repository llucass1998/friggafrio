import { Thumbnail } from "@/components/ui/thumbnail"
import { Price } from "@/components/ui/price"
import { Button } from "@/components/ui/button"
import Address from "@/components/address"
import PaymentMethodInfo from "@/components/payment-method-info"
import { isPaidWithGiftCard } from "@/lib/utils/checkout"
import { formatOrderId } from "@/lib/utils/order"
import { useLoaderData, Link, useParams, getRouteApi } from "@tanstack/react-router"
import { CheckCircleSolid, ShoppingBag } from "@medusajs/icons"
import { Package, Truck, Info, MapPin, CreditCard, FileText } from "lucide-react"
import type { HttpTypes } from "@medusajs/types"
import { clsx } from "clsx"

const routeApi = getRouteApi("/$countryCode/order/$orderId/confirmed")

// Helper para traduzir o status geral
const translateStatus = (status?: string) => {
  switch (status) {
    case "pending": return "Pendente"
    case "completed": return "Concluído"
    case "archived": return "Arquivado"
    case "canceled": return "Cancelado"
    case "requires_action": return "Ação Necessária"
    default: return status || "Pendente"
  }
}

// Helper para traduzir o status de pagamento
const translatePaymentStatus = (status?: string) => {
  switch (status) {
    case "not_paid": return "Não pago"
    case "awaiting": return "Aguardando"
    case "captured": return "Aprovado"
    case "partially_refunded": return "Parcialmente estornado"
    case "refunded": return "Estornado"
    case "canceled": return "Cancelado"
    case "requires_action": return "Ação Necessária"
    default: return status || "Aguardando"
  }
}

// Helper para traduzir o status de envio
const translateFulfillmentStatus = (status?: string) => {
  switch (status) {
    case "not_fulfilled": return "Não enviado"
    case "partially_fulfilled": return "Parcialmente enviado"
    case "fulfilled": return "Pronto para envio"
    case "partially_shipped": return "Parcialmente em trânsito"
    case "shipped": return "Em trânsito"
    case "partially_returned": return "Parcialmente devolvido"
    case "returned": return "Devolvido"
    case "canceled": return "Cancelado"
    case "requires_action": return "Ação Necessária"
    default: return status || "Não enviado"
  }
}

const OrderConfirmation = () => {
  const { countryCode } = useParams({ strict: false })
  const { order } = routeApi.useLoaderData()

  if (!order) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-16 px-6 motion-dropdown animate-in slide-in-from-bottom-4 fade-in-0">
          <div className="w-20 h-20 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-10 h-10 text-slate-400 opacity-60" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">
            Pedido não encontrado
          </h3>
          <p className="text-slate-500 mb-8 max-w-md mx-auto">
            Não foi possível encontrar os detalhes deste pedido. Verifique se o link está correto.
          </p>
          <Link to={"/$countryCode/store" as string} params={{ countryCode }}>
            <Button variant="primary" size="lg" className="motion-interactive">
              Continuar Comprando
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const paidByGiftcard = isPaidWithGiftCard(order)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Success Header - Animated entry */}
        <div className="mb-10 text-center motion-dropdown animate-in slide-in-from-bottom-4 fade-in-0 duration-[var(--motion-duration-slow)]">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6 shadow-sm motion-surface hover:shadow-md hover:scale-105">
            <CheckCircleSolid className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-3 tracking-tight">
            Pedido Confirmado!
          </h1>
          <p className="text-lg text-slate-600 max-w-lg mx-auto">
            Obrigado pelo seu pedido. Enviamos um e-mail com a confirmação e os detalhes da sua compra.
          </p>
        </div>

        {/* Order Details Card - Staggered entry */}
        <div className="bg-white rounded-[var(--radius-card)] border border-slate-200 shadow-sm overflow-hidden motion-card hover:border-slate-300 animate-in slide-in-from-bottom-8 fade-in-0 duration-[var(--motion-duration-slow)] delay-100 fill-mode-both">

          {/* Order Header Info */}
          <div className="p-6 sm:p-8 border-b border-slate-200 bg-slate-50/50">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-slate-500" />
                  Pedido {formatOrderId(String(order.display_id ?? order.id ?? ""))}
                </h2>
                <p className="text-sm text-slate-500 mt-2 flex items-center gap-1.5">
                  <span className="font-medium text-slate-700">Realizado em:</span>
                  {new Date(order.created_at!).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium bg-slate-100 text-slate-700 border border-slate-200">
                  <Info className="w-4 h-4" />
                  {translateStatus(order.status)}
                </span>
                <span className={clsx(
                  "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium border",
                  order.payment_status === "captured"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                )}>
                  <CreditCard className="w-4 h-4" />
                  {translatePaymentStatus(order.payment_status)}
                </span>
                <span className={clsx(
                  "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium border",
                  order.fulfillment_status === "fulfilled" || order.fulfillment_status === "shipped"
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : "bg-slate-100 text-slate-700 border-slate-200"
                )}>
                  <Package className="w-4 h-4" />
                  {translateFulfillmentStatus(order.fulfillment_status)}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
            {/* Items List */}
            <div className="lg:col-span-2 p-6 sm:p-8">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-slate-500" />
                Itens do Pedido
              </h3>
              <div className="space-y-4">
                {order.items?.map((item: HttpTypes.StoreOrderLineItem, index: number) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-4 p-4 rounded-xl hover:bg-slate-50 motion-surface border border-transparent hover:border-slate-100 transition-all"
                    style={{ animationDelay: `${200 + index * 50}ms` }}
                  >
                    <div className="w-20 h-20 rounded-lg overflow-hidden border border-slate-200 bg-white flex-shrink-0">
                      <Thumbnail
                        thumbnail={item.thumbnail}
                        alt={item.product_title || item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0 py-1">
                      <h4 className="font-semibold text-slate-900 line-clamp-2 leading-tight mb-1">
                        {item.product_title}
                      </h4>
                      {item.variant_title && item.variant_title !== "Default Variant" && (
                        <p className="text-sm text-slate-500 mb-1">{item.variant_title}</p>
                      )}
                      <p className="text-sm font-medium text-slate-600">Qtd: {item.quantity}</p>
                    </div>
                    <div className="text-right py-1">
                      <Price
                        price={item.total}
                        currencyCode={order.currency_code}
                        className="font-bold text-slate-900"
                      />
                      {item.quantity > 1 && (
                        <p className="text-xs text-slate-500 mt-1">
                          <Price price={(item.total || 0) / item.quantity} currencyCode={order.currency_code} /> / un
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary Sidebar */}
            <div className="p-6 sm:p-8 bg-slate-50/30">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Resumo</h3>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 font-medium">Subtotal</span>
                  <Price price={order.item_subtotal} currencyCode={order.currency_code} className="text-slate-900 font-medium" />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 font-medium">Frete</span>
                  <Price price={order.shipping_total} currencyCode={order.currency_code} className="text-slate-900 font-medium" />
                </div>
                {order.discount_total !== undefined && order.discount_total > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-emerald-600 font-medium">Desconto</span>
                    <Price
                      price={order.discount_total}
                      currencyCode={order.currency_code}
                      type="discount"
                      className="text-emerald-600 font-medium"
                    />
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 font-medium">Impostos</span>
                  <Price price={order.tax_total} currencyCode={order.currency_code} className="text-slate-900 font-medium" />
                </div>

                <div className="pt-4 border-t border-slate-200 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-base font-bold text-slate-900">Total Pago</span>
                    <Price price={order.total} currencyCode={order.currency_code} className="text-2xl font-black text-blue-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping & Billing Info */}
          <div className="p-6 sm:p-8 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50/50">
            {/* Shipping Information */}
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-slate-500" />
                Entrega
              </h3>
              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Endereço de Entrega</h4>
                  {order.shipping_address ? (
                    <div className="text-sm text-slate-700">
                      <Address address={order.shipping_address} />
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 italic">Endereço não disponível</p>
                  )}
                </div>
                {order.shipping_methods?.[0] && (
                  <div className="pt-3 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Método de Envio</h4>
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-slate-400" />
                      <p className="text-sm font-medium text-slate-900">{order.shipping_methods[0].name}</p>
                    </div>
                    <Price
                      price={order.shipping_methods[0].amount}
                      currencyCode={order.currency_code}
                      className="text-sm text-slate-500 mt-1 block"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Billing Information */}
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-slate-500" />
                Faturamento
              </h3>
              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Endereço de Cobrança</h4>
                  {order.billing_address ? (
                    <div className="text-sm text-slate-700">
                      <Address address={order.billing_address} />
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 italic">Mesmo endereço de entrega</p>
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 pt-3 border-t border-slate-100">Pagamento</h4>
                  <div className="text-sm font-medium text-slate-900">
                    {order.payment_collections?.[0]?.payment_sessions?.[0] && (
                      <PaymentMethodInfo
                        provider_id={order.payment_collections[0].payment_sessions[0].provider_id}
                      />
                    )}
                    {paidByGiftcard && <span className="block mt-1 text-emerald-600 flex items-center gap-1"><CheckCircleSolid className="w-4 h-4"/> Cartão Presente aplicado</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions Footer */}
          <div className="p-6 sm:p-8 border-t border-slate-200 flex flex-col sm:flex-row gap-4 justify-center bg-white">
            <Link to={"/$countryCode/orders" as string} params={{ countryCode }}>
              <Button variant="outline" size="lg" className="w-full sm:w-auto motion-interactive">
                Ver Meus Pedidos
              </Button>
            </Link>
            <Link to={"/$countryCode/store" as string} params={{ countryCode }}>
              <Button variant="primary" size="lg" className="w-full sm:w-auto motion-interactive">
                Continuar Comprando
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrderConfirmation
