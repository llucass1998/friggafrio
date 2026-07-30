import { useQuery } from "@tanstack/react-query"
import { sdk } from "@/lib/medusa"
import { CartEmpty } from "@/components/cart"
import CheckoutProgress from "@/components/checkout-progress"
import { StripeElementsProvider } from "@/components/stripe-elements-provider"
import { Loading } from "@/components/ui/loading"
import { useCart } from "@/lib/hooks/use-cart"
import { useAuth } from "@/lib/hooks/use-auth"
import { useCompanySetupStatus } from "@/lib/hooks/use-company-setup"
import { type CheckoutStep, CheckoutStepKey } from "@/lib/types/global"
import {
  useLoaderData,
  useLocation,
  useNavigate,
  useParams,
} from "@tanstack/react-router"
import { lazy, Suspense, useCallback, useEffect, useMemo } from "react"

const DeliveryStep = lazy(() => import("@/components/checkout-delivery-step"))
const AddressStep = lazy(() => import("@/components/checkout-address-step"))
const PaymentStep = lazy(() => import("@/components/checkout-payment-step"))
const ReviewStep = lazy(() => import("@/components/checkout-review-step"))
const CheckoutSummary = lazy(() => import("@/components/checkout-summary"))

function CheckoutSetupBlocker({
  setupStatus,
}: {
  setupStatus: { steps: { key: string; label: string; completed: boolean; required_for_checkout: boolean }[] }
}) {
  const params = useParams({ strict: false }) as { countryCode?: string }
  const countryCode = params.countryCode || "us"

  const missing = setupStatus.steps
    .filter((s) => !s.completed && s.required_for_checkout)
    .map((s) => s.label.toLowerCase())

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-lg mx-auto py-16 text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-8 h-8 text-amber-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-3">
          Company Setup Required
        </h2>
        <p className="text-gray-600 mb-6">
          Before your team can place orders, a company admin needs to configure:{" "}
          {missing.join(", ")}.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href={`/${countryCode}/settings?tab=addresses`}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors"
          >
            Go to Settings
          </a>
          <a
            href={`/${countryCode}/store`}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Continue Shopping
          </a>
        </div>
      </div>
    </div>
  )
}

const Checkout = () => {
  const { step } = useLoaderData({
    from: "/$countryCode/checkout",
  })
  const { data: cart, isLoading: cartLoading } = useCart()
  const { data: setupStatus, isLoading: setupLoading } = useCompanySetupStatus()
  const location = useLocation()
  const navigate = useNavigate()
  const params = useParams({ strict: false }) as { countryCode?: string }
  const countryCode = params.countryCode || "br"

  // Fonte de verdade da autenticação real via Store API
  const { data: customerData, isLoading: customerLoading, error: customerError, refetch: refetchCustomer } = useQuery({
    queryKey: ["customer", "me"],
    queryFn: async () => {
      return sdk.store.customer.retrieve({
        fields: "id,email,first_name,last_name,phone,has_account"
      })
    },
    retry: false
  })

  // Interpretação dos estados obrigatórios
  const isAuthError = !!customerError && !(customerError as any).message?.toLowerCase().includes("unauthorized") && (customerError as any).status !== 401
  const isUnauthenticated = (!!customerError && !isAuthError) || (!customerLoading && !customerData?.customer)
  const isAuthenticated = !!customerData?.customer && !isUnauthenticated && !isAuthError
  const authLoading = customerLoading

  const steps: CheckoutStep[] = useMemo(() => {
    return [
      {
        key: CheckoutStepKey.ADDRESSES,
        title: "Endereços",
        description: "Insira seus endereços de entrega e cobrança.",
        completed: !!(cart?.shipping_address && cart?.billing_address),
      },
      {
        key: CheckoutStepKey.DELIVERY,
        title: "Entrega",
        description: "Selecione um método de entrega.",
        completed: !!cart?.shipping_methods?.length,
      },
      {
        key: CheckoutStepKey.PAYMENT,
        title: "Pagamento",
        description:
          "Selecione um método de pagamento. Você não será cobrado até concluir o pedido.",
        completed: !!cart?.payment_collection?.payment_sessions?.length,
      },
      {
        key: CheckoutStepKey.REVIEW,
        title: "Revisão",
        description: "Revise os detalhes do seu pedido antes de concluir.",
        completed: false,
      },
    ]
  }, [cart])

  const currentStepIndex = useMemo(
    () => steps.findIndex((s) => s.key === step),
    [step, steps]
  )

  const goToStep = useCallback((step: CheckoutStepKey) => {
    navigate({
      to: `${location.pathname}?step=${step}`,
      replace: true,
    })
  }, [location.pathname, navigate])

  useEffect(() => {
    if (!cart) {
      return
    }

    if (
      step !== CheckoutStepKey.ADDRESSES &&
      currentStepIndex >= 0 &&
      steps[0] &&
      !steps[0].completed
    ) {
      goToStep(CheckoutStepKey.ADDRESSES)
      return
    }

    if (
      step !== CheckoutStepKey.DELIVERY &&
      currentStepIndex >= 1 &&
      steps[1] &&
      !steps[1].completed
    ) {
      goToStep(CheckoutStepKey.DELIVERY)
      return
    }

    if (
      step !== CheckoutStepKey.PAYMENT &&
      currentStepIndex >= 2 &&
      steps[2] &&
      !steps[2].completed
    ) {
      goToStep(CheckoutStepKey.PAYMENT)
      return
    }
  }, [cart, steps, location, currentStepIndex, step, goToStep])

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1
    if (nextIndex < steps.length) {
      goToStep(steps[nextIndex].key)
    }
  }

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1
    if (prevIndex >= 0) {
      goToStep(steps[prevIndex].key)
    }
  }

  const isPaymentOrReview =
    step === CheckoutStepKey.PAYMENT || step === CheckoutStepKey.REVIEW

  // Block checkout if checkout-required setup steps are incomplete
  if (!setupLoading && setupStatus && !setupStatus.checkout_ready) {
    return <CheckoutSetupBlocker setupStatus={setupStatus} />
  }

  // Authentication Blocker
  if (authLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex justify-center items-center h-64">
        <Loading />
      </div>
    )
  }

  if (isAuthError) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-lg mx-auto py-16 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            Erro de verificação
          </h2>
          <p className="text-gray-600 mb-6">
            Não foi possível verificar sua sessão. Tente novamente.
          </p>
          <div className="flex justify-center">
            <button
              onClick={() => refetchCustomer()}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (isUnauthenticated) {
    const returnTo = `/${countryCode}/checkout`
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-lg mx-auto py-16 text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-8 h-8 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            Entre para finalizar sua compra
          </h2>
          <p className="text-gray-600 mb-6">
            Para continuar com o pedido, entre na sua conta ou faça seu cadastro.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={`/${countryCode}/account/login?returnTo=${encodeURIComponent(returnTo)}`}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Entrar
            </a>
            <a
              href={`/${countryCode}/account/register?returnTo=${encodeURIComponent(returnTo)}`}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
            >
              Criar conta
            </a>
          </div>
          <div className="mt-8">
            <a
              href={`/${countryCode}/cart`}
              className="text-sm text-gray-500 hover:text-gray-900 underline underline-offset-4"
            >
              Voltar ao carrinho
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <CheckoutProgress
        steps={steps}
        currentStepIndex={currentStepIndex}
        handleStepChange={goToStep}
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-24">
        <div className="flex flex-col gap-1 lg:col-span-2">
          <h2 className="text-zinc-900 text-xl">
            {steps[currentStepIndex]?.title}
          </h2>
          <p className="text-base font-medium text-zinc-600">
            {steps[currentStepIndex]?.description}
          </p>
        </div>
        <div className="flex flex-col gap-1">
          <h2 className="text-zinc-900 text-xl">Resumo do Pedido</h2>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-24">
        <div className="space-y-6 lg:col-span-2">
          <Suspense fallback={<Loading />}>
            {cartLoading && <Loading />}
            {cart && (
              <>
                {step === CheckoutStepKey.ADDRESSES && (
                  <AddressStep cart={cart} onNext={handleNext} />
                )}

                {step === CheckoutStepKey.DELIVERY && (
                  <DeliveryStep
                    cart={cart}
                    onNext={handleNext}
                    onBack={handleBack}
                  />
                )}

                {isPaymentOrReview && (
                  <StripeElementsProvider cart={cart}>
                    <div
                      style={{
                        visibility:
                          step !== CheckoutStepKey.PAYMENT
                            ? "hidden"
                            : "visible",
                        overflow:
                          step !== CheckoutStepKey.PAYMENT ? "hidden" : "auto",
                        height:
                          step !== CheckoutStepKey.PAYMENT ? 0 : "auto",
                      }}
                    >
                      <PaymentStep
                        cart={cart}
                        onNext={handleNext}
                        onBack={handleBack}
                      />
                    </div>
                    <div
                      style={{
                        visibility:
                          step !== CheckoutStepKey.REVIEW
                            ? "hidden"
                            : "visible",
                        overflow:
                          step !== CheckoutStepKey.REVIEW ? "hidden" : "auto",
                        height:
                          step !== CheckoutStepKey.REVIEW ? 0 : "auto",
                      }}
                    >
                      <ReviewStep cart={cart} onBack={handleBack} />
                    </div>
                  </StripeElementsProvider>
                )}
              </>
            )}
          </Suspense>
        </div>

        <Suspense fallback={<Loading />}>
          {cartLoading && <Loading />}
          {cart && <CheckoutSummary cart={cart} />}
          {!cart && !cartLoading && <CartEmpty />}
        </Suspense>
      </div>
    </div>
  )
}

export default Checkout
