import { CartEmpty } from "@/components/cart"
import CheckoutPreparationStep from "@/components/checkout-preparation-step"
import CheckoutProgress from "@/components/checkout-progress"
import { Loading } from "@/components/ui/loading"
import type { CheckoutPreparedSummary } from "@/lib/data/checkout/prepare"
import { useCart } from "@/lib/hooks/use-cart"
import { useCompanySetupStatus } from "@/lib/hooks/use-company-setup"
import { type CheckoutStep, CheckoutStepKey } from "@/lib/types/global"
import { isCartCheckoutReady } from "@/lib/utils/cart"
import { DEFAULT_COUNTRY_CODE } from "@/config/commerce"
import { useLoaderData, useLocation, useNavigate, useParams } from "@tanstack/react-router"
import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react"

const DeliveryStep = lazy(() => import("@/components/checkout-delivery-step"))
const AddressStep = lazy(() => import("@/components/checkout-address-step"))
const CheckoutSummary = lazy(() => import("@/components/checkout-summary"))

function CheckoutSetupBlocker({
  setupStatus,
}: {
  setupStatus: { steps: { key: string; label: string; completed: boolean; required_for_checkout: boolean }[] }
}) {
  const params = useParams({ strict: false }) as { countryCode?: string }
  const countryCode = params.countryCode || DEFAULT_COUNTRY_CODE
  const missing = setupStatus.steps
    .filter((step) => !step.completed && step.required_for_checkout)
    .map((step) => step.label.toLowerCase())

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-lg mx-auto py-16 text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-3">Configuracao da empresa necessaria</h2>
        <p className="text-gray-600 mb-6">Antes de fazer pedidos, um administrador da empresa precisa configurar: {missing.join(", ")}.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a href={`/${countryCode}/account/addresses`} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors">Gerenciar enderecos</a>
          <a href={`/${countryCode}/store`} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Continuar comprando</a>
        </div>
      </div>
    </div>
  )
}

const Checkout = () => {
  const { step } = useLoaderData({ from: "/$countryCode/checkout" })
  const { data: cart, isLoading: cartLoading } = useCart()
  const { data: setupStatus, isLoading: setupLoading } = useCompanySetupStatus()
  const location = useLocation()
  const navigate = useNavigate()
  const [prepared, setPrepared] = useState<CheckoutPreparedSummary | null>(null)
  const [shippingResetToken, setShippingResetToken] = useState(0)

  const steps: CheckoutStep[] = useMemo(() => [
    {
      key: CheckoutStepKey.ADDRESSES,
      title: "Endereços",
      description: "Insira seus dados de contato e endereços de entrega e cobrança.",
      completed: !!(cart?.shipping_address && cart?.billing_address && cart.email),
    },
    {
      key: CheckoutStepKey.DELIVERY,
      title: "Entrega",
      description: "Selecione um método de entrega.",
      completed: !!cart?.shipping_methods?.length,
    },
    {
      key: CheckoutStepKey.REVIEW,
      title: "Resumo",
      description: "Confira os valores confirmados pelo servidor.",
      completed: prepared?.cartId === cart?.id,
    },
  ], [cart, prepared])

  const currentStepIndex = useMemo(() => steps.findIndex((item) => item.key === step), [step, steps])

  const goToStep = useCallback((nextStep: CheckoutStepKey) => {
    if (nextStep !== CheckoutStepKey.REVIEW) setPrepared(null)
    navigate({ to: `${location.pathname}?step=${nextStep}`, replace: true })
  }, [location.pathname, navigate])

  useEffect(() => {
    if (!cart || currentStepIndex < 0) return
    if (step !== CheckoutStepKey.ADDRESSES && currentStepIndex >= 0 && !steps[0].completed) {
      goToStep(CheckoutStepKey.ADDRESSES)
      return
    }
    if (step !== CheckoutStepKey.DELIVERY && currentStepIndex >= 1 && !steps[1].completed) {
      goToStep(CheckoutStepKey.DELIVERY)
    }
  }, [cart, currentStepIndex, goToStep, step, steps])

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1
    if (nextIndex < steps.length) goToStep(steps[nextIndex].key)
  }

  const handleBack = () => {
    const previousIndex = currentStepIndex - 1
    if (previousIndex >= 0) goToStep(steps[previousIndex].key)
  }

  if (!setupLoading && setupStatus && !setupStatus.checkout_ready) {
    return <CheckoutSetupBlocker setupStatus={setupStatus} />
  }

  if (!cartLoading && cart && !isCartCheckoutReady(cart.items)) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="text-xl font-bold text-zinc-900">Seu carrinho precisa de revisão</h2>
        <p className="mt-2 text-zinc-600">Itens sob cotação, sem preço confirmado ou sem estoque não podem seguir para o checkout.</p>
      </div>
    )
  }

  return (
    <main className="min-h-[calc(100vh-10rem)] bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.10),_transparent_32rem)] py-5 sm:py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="mb-6 grid gap-5 lg:grid-cols-3 lg:items-end lg:gap-10">
          <div className="lg:col-span-2">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-teal-700">Checkout seguro</p>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">Finalize seu pedido</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600 sm:text-base">{steps[currentStepIndex]?.description}</p>
          </div>
          <div className="rounded-xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm text-teal-950">
            <p className="font-semibold">Entrega em Sao Paulo</p>
            <p className="mt-0.5 text-teal-800">Valores e disponibilidade sao confirmados pelo servidor.</p>
          </div>
        </header>
        <CheckoutProgress steps={steps} currentStepIndex={currentStepIndex} handleStepChange={goToStep} className="mb-7" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-10">
          <section className="min-w-0 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6 lg:col-span-2" aria-labelledby="checkout-step-title">
            <div className="mb-6 border-b border-zinc-100 pb-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">Etapa {Math.max(currentStepIndex + 1, 1)} de {steps.length}</p>
              <h2 id="checkout-step-title" className="mt-1 text-xl font-bold text-zinc-900">{steps[currentStepIndex]?.title}</h2>
            </div>
            <div className="space-y-6">
          <Suspense fallback={<Loading />}>
            {cartLoading && <Loading />}
            {cart && (
              <>
                {step === CheckoutStepKey.ADDRESSES && <AddressStep cart={cart} onNext={handleNext} />}
                {step === CheckoutStepKey.DELIVERY && <DeliveryStep cart={cart} onNext={handleNext} onBack={handleBack} resetSelectionToken={shippingResetToken} />}
                {step === CheckoutStepKey.REVIEW && (
                  <CheckoutPreparationStep
                    cart={cart}
                    prepared={prepared}
                    onPrepared={setPrepared}
                    onInvalidPreparation={() => {
                      setPrepared(null)
                      setShippingResetToken((token) => token + 1)
                      goToStep(CheckoutStepKey.DELIVERY)
                    }}
                    onBack={handleBack}
                  />
                )}
              </>
            )}
          </Suspense>
            </div>
          </section>
          <aside className="min-w-0 lg:pt-0" aria-label="Resumo do pedido">
            <Suspense fallback={<Loading />}>
              {cartLoading && <Loading />}
              {cart && <CheckoutSummary cart={cart} prepared={prepared} />}
              {!cart && !cartLoading && <CartEmpty />}
            </Suspense>
          </aside>
        </div>
      </div>
    </main>
  )
}

export default Checkout
