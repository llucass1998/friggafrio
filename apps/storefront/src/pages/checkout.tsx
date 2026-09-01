import { CartEmpty } from "@/components/cart"
import CheckoutPreparationStep from "@/components/checkout-preparation-step"
import CheckoutProgress from "@/components/checkout-progress"
import CheckoutPaymentStep from "@/components/checkout-payment-step"
import CheckoutReviewStep from "@/components/checkout-review-step"
import CheckoutCustomerStep from "@/components/checkout-customer-step"
import { PaymentResultView } from "@/components/payment-result"
import { Loading } from "@/components/ui/loading"
import type { CheckoutPreparedSummary } from "@/lib/data/checkout/prepare"
import {
  checkoutFlowReducer,
  canEnterCheckoutStep,
  initialCheckoutFlowState,
} from "@/lib/payments/checkout-flow"
import type {
  CheckoutCustomerInfo,
  CheckoutPaymentSelection,
  PaymentResult,
} from "@/lib/payments/contracts"
import { recoverPaymentAttemptForCart } from "@/lib/payments/adapter"
import { useCart } from "@/lib/hooks/use-cart"
import { useCompanySetupStatus } from "@/lib/hooks/use-company-setup"
import { useAuth } from "@/lib/hooks/use-auth"
import { type CheckoutStep, CheckoutStepKey } from "@/lib/types/global"
import { isCartCheckoutReady } from "@/lib/utils/cart"
import { DEFAULT_COUNTRY_CODE } from "@/config/commerce"
import { CHECKOUT_DRAFT_VERSION, clearCheckoutDraftStorage, emptyCustomerInfo, isCheckoutDraftSafeForSession, readCheckoutDraftStorage, writeCheckoutDraftStorage } from "@/lib/utils/checkout-draft"
import {
  checkoutRuntimeKey,
  clearCheckoutRuntimeStateKey,
  readCheckoutSelectionState,
  readPreparedCheckoutState,
  writeCheckoutSelectionState,
  writePreparedCheckoutState,
} from "@/lib/utils/checkout-runtime-state"
import { useLoaderData, useParams } from "@tanstack/react-router"
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react"

const DeliveryStep = lazy(() => import("@/components/checkout-delivery-step"))
const CheckoutSummary = lazy(() => import("@/components/checkout-summary"))

function CheckoutSetupBlocker({
  setupStatus,
}: {
  setupStatus: {
    steps: {
      key: string;
      label: string;
      completed: boolean;
      required_for_checkout: boolean;
    }[];
  };
}) {
  const params = useParams({ strict: false }) as { countryCode?: string }
  const countryCode = params.countryCode || DEFAULT_COUNTRY_CODE
  const missing = setupStatus.steps
    .filter((item) => !item.completed && item.required_for_checkout)
    .map((item) => item.label.toLowerCase())
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-lg py-16 text-center">
        <h2 className="text-xl font-bold text-[var(--color-navy)]">
          Configuração necessária
        </h2>
        <p className="mb-6 mt-3 text-[var(--color-text-muted)]">
          Antes de fazer pedidos, configure: {missing.join(", ")}.
        </p>
        <a
          href={`/${countryCode}/account/addresses`}
          className="inline-flex min-h-11 items-center rounded-lg bg-[var(--color-primary)] px-5 text-sm font-semibold text-white"
        >
          Gerenciar endereços
        </a>
      </div>
    </div>
  )
}

const Checkout = () => {
  const { step } = useLoaderData({ from: "/$countryCode/checkout" })
  const { data: cart, isLoading: cartLoading } = useCart()
  const { authState, customer } = useAuth()
  const [draft] = useState(readCheckoutDraftStorage)
  const { data: setupStatus, isLoading: setupLoading } =
    useCompanySetupStatus()
  const [prepared, setPrepared] = useState<CheckoutPreparedSummary | null>(
    null,
  )
  const [shippingResetToken, setShippingResetToken] = useState(0)
  const [selection, setSelection] = useState<CheckoutPaymentSelection | null>(
    null,
  )
  const [recoveredPayment, setRecoveredPayment] = useState<PaymentResult | null>(null)
  const [customerInfo, setCustomerInfo] = useState<CheckoutCustomerInfo>(() => draft?.customerInfo || emptyCustomerInfo())
  const [flow, dispatch] = useReducer(checkoutFlowReducer, draft?.addressConfirmed
    ? { ...initialCheckoutFlowState, addressConfirmed: true }
    : initialCheckoutFlowState)
  const [activeStep, setActiveStep] = useState<CheckoutStepKey>(() => {
    if (typeof window === "undefined") return step
    const queryStep = new URLSearchParams(window.location.search).get("step")
    return Object.values(CheckoutStepKey).includes(queryStep as CheckoutStepKey)
      ? queryStep as CheckoutStepKey
      : step
  })
  const runtimeKey = cart?.id
    ? checkoutRuntimeKey(cart.id, authState, customer?.id)
    : null
  const effectivePrepared = prepared || readPreparedCheckoutState(runtimeKey)
  const effectiveSelection = selection || readCheckoutSelectionState(runtimeKey)
  const previousRuntimeKey = useRef<string | null>(null)
  const currentStepHeadingRef = useRef<HTMLHeadingElement>(null)
  const syncStepUrl = useCallback((nextStep: CheckoutStepKey) => {
    if (typeof window === "undefined") return
    // Allow React to commit the current step before the history adapter observes
    // the URL update. Updating native history in the same event previously
    // remounted the route with stale loader data and discarded the draft.
    window.setTimeout(() => {
      const url = new URL(window.location.href)
      url.searchParams.set("step", nextStep)
      window.history.pushState({}, "", url)
    }, 0)
  }, [])
  useEffect(() => {
    const previousKey = previousRuntimeKey.current
    if (previousKey && previousKey !== runtimeKey) {
      clearCheckoutRuntimeStateKey(previousKey)
    }
    previousRuntimeKey.current = runtimeKey
  }, [runtimeKey])
  useEffect(() => {
    if (!cart?.id) return
    let active = true
    dispatch({ type: "PAYMENT_RECOVERING" })
    void recoverPaymentAttemptForCart(cart.id)
      .then((result) => {
        if (!active) return
        setRecoveredPayment(result)
        if (result) dispatch({ type: "PAYMENT_RESULT", result })
        else dispatch({ type: "PAYMENT_RECOVERY_EMPTY" })
      })
      .catch(() => {
        // An unavailable recovery lookup must not manufacture a payment state.
        if (active) setRecoveredPayment(null)
      })
    return () => { active = false }
  }, [cart?.id])
  const persistDraft = useCallback((addressConfirmed = flow.addressConfirmed) => {
    writeCheckoutDraftStorage({
      version: CHECKOUT_DRAFT_VERSION,
      cartId: cart?.id || "",
      customerInfo,
      addressConfirmed,
      authState: authState === "authenticated" ? "authenticated" : "guest",
      customerId: authState === "authenticated" ? customer?.id || null : null,
    })
  }, [authState, cart?.id, customer, customerInfo, flow.addressConfirmed])
  const addressStepComplete = Boolean(customerInfo.firstName.trim() && customerInfo.lastName.trim() && customerInfo.email.trim() && customerInfo.document.trim())

  const steps: CheckoutStep[] = useMemo(
    () => [
      {
        key: CheckoutStepKey.ADDRESSES,
        title: "Seus dados",
        description: "Informe seus dados para continuar como convidado.",
        completed: addressStepComplete,
      },
      {
        key: CheckoutStepKey.DELIVERY,
        title: "Como deseja receber",
        description: "Escolha Retirada na Loja 1 ou uma modalidade de entrega.",
        completed: !!cart?.shipping_methods?.length,
      },
      {
        key: CheckoutStepKey.PAYMENT,
        title: "Pagamento",
        description: "Escolha Pix ou cartão tokenizado.",
        completed: !!effectiveSelection,
      },
      {
        key: CheckoutStepKey.REVIEW,
        title: "Revisão",
        description: "Confira os valores confirmados pelo servidor.",
        completed: !!flow.result,
      },
    ],
    [addressStepComplete, cart, effectiveSelection, flow.result],
  )
  const flowGate = useMemo(
    () => ({
      // A validated submit marks the step as complete. Keep that explicit
      // transition while cart/auth queries revalidate in the background.
      addressConfirmed: flow.addressConfirmed || addressStepComplete,
      deliveryConfirmed: Boolean(cart?.shipping_methods?.length),
      prepared: Boolean(effectivePrepared?.cartId === cart?.id),
      paymentMethod: effectiveSelection?.method || null,
    }),
    [addressStepComplete, cart, effectivePrepared, effectiveSelection, flow.addressConfirmed],
  )
  const currentStepIndex = Math.max(
    steps.findIndex((item) => item.key === activeStep),
    0,
  )

  const goToStep = useCallback(
    (nextStep: CheckoutStepKey) => {
      if (!canEnterCheckoutStep(flowGate, nextStep)) return
      setActiveStep(nextStep)
      syncStepUrl(nextStep)
      if (
        nextStep === CheckoutStepKey.ADDRESSES ||
        nextStep === CheckoutStepKey.DELIVERY
      ) {
        clearCheckoutRuntimeStateKey(runtimeKey)
        setPrepared(null)
        setSelection(null)
        setShippingResetToken((token) => token + 1)
        dispatch({ type: "RESET_AFTER_DELIVERY_CHANGE" })
      }
    },
    [flowGate, runtimeKey, syncStepUrl],
  )
  const handleNext = useCallback(() => {
    const nextStep = steps[currentStepIndex + 1]?.key
    if (!nextStep) return
    if (activeStep === CheckoutStepKey.ADDRESSES) {
      dispatch({ type: "ADDRESS_CONFIRMED" })
      // Native history navigation remounts this route, so persist the validated
      // draft before changing the URL. It is a checkout draft, never auth state.
      persistDraft(true)
    }
    if (activeStep === CheckoutStepKey.DELIVERY)
      dispatch({ type: "DELIVERY_CONFIRMED" })
    setActiveStep(nextStep)
    syncStepUrl(nextStep)
  }, [activeStep, currentStepIndex, persistDraft, steps, syncStepUrl])
  const handleBack = useCallback(() => {
    if (currentStepIndex > 0) goToStep(steps[currentStepIndex - 1].key)
  }, [currentStepIndex, goToStep, steps])
  const handlePrepareInvalid = useCallback(() => {
    clearCheckoutRuntimeStateKey(runtimeKey)
    setPrepared(null)
    setSelection(null)
    setShippingResetToken((token) => token + 1)
    setActiveStep(CheckoutStepKey.DELIVERY)
    syncStepUrl(CheckoutStepKey.DELIVERY)
  }, [runtimeKey, syncStepUrl])
  useEffect(() => {
    if (!cart && !cartLoading && draft) {
      clearCheckoutDraftStorage()
      return
    }
    if (!cart || !draft) return
    if (isCheckoutDraftSafeForSession(draft, {
      cartId: cart.id,
      authState,
      customerId: customer?.id,
    })) return
    clearCheckoutDraftStorage()
    setCustomerInfo(emptyCustomerInfo())
    dispatch({ type: "RESET_AFTER_ADDRESS_CHANGE" })
  }, [authState, cart, cartLoading, customer?.id, draft])

  // Hide a stale draft in the same render that discovers a cart/account
  // mismatch; waiting for the cleanup effect would briefly expose another
  // customer's personal data after a tab or identity switch.
  const draftSafeForSession = isCheckoutDraftSafeForSession(draft, {
    cartId: cart?.id,
    authState,
    customerId: customer?.id,
  })
  const protectedDraftVisible = Boolean(draft && !draftSafeForSession)
  const safeCustomerInfo = protectedDraftVisible ? emptyCustomerInfo() : customerInfo
  useEffect(() => {
    currentStepHeadingRef.current?.focus()
  }, [activeStep])
  useEffect(() => {
    const restoreStep = () => {
      const next = new URLSearchParams(window.location.search).get("step")
      if (Object.values(CheckoutStepKey).includes(next as CheckoutStepKey)) setActiveStep(next as CheckoutStepKey)
    }
    window.addEventListener("popstate", restoreStep)
    return () => window.removeEventListener("popstate", restoreStep)
  }, [])
  useEffect(() => {
    if (
      cart &&
      !cartLoading &&
      !canEnterCheckoutStep(flowGate, activeStep) &&
      activeStep !== CheckoutStepKey.ADDRESSES
    ) {
      setActiveStep(CheckoutStepKey.ADDRESSES)
      syncStepUrl(CheckoutStepKey.ADDRESSES)
    }
  }, [activeStep, cart, cartLoading, flowGate, syncStepUrl])

  if (!setupLoading && setupStatus && !setupStatus.checkout_ready)
    return <CheckoutSetupBlocker setupStatus={setupStatus} />
  if (!cartLoading && cart && !isCartCheckoutReady(cart.items))
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-[var(--color-navy)]">
          Seu carrinho precisa de revisão
        </h2>
        <p className="mt-2 text-zinc-600">
          Itens sem preço confirmado ou sem estoque não podem seguir para o
          checkout.
        </p>
      </div>
    )
  const showReview =
    activeStep === CheckoutStepKey.REVIEW &&
    effectivePrepared?.cartId === cart?.id &&
    !!effectiveSelection
  return (
    <main className="min-h-[calc(100vh-10rem)] overflow-x-clip bg-[var(--color-background)] py-5 sm:py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="mb-6">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-primary)]">
            Checkout seguro
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-navy)] sm:text-3xl">
            Finalize seu pedido
          </h1>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            {steps[currentStepIndex]?.description}
          </p>
        </header>
        <CheckoutProgress
          steps={steps}
          currentStepIndex={currentStepIndex}
          handleStepChange={goToStep}
          className="mb-7"
        />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-10">
          <section
            className="min-w-0 rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm sm:p-6 lg:col-span-2"
            aria-labelledby="checkout-step-title"
          >
            <div className="mb-6 border-b border-[var(--color-border)] pb-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                Etapa {currentStepIndex + 1} de {steps.length}
              </p>
              <h2
                id="checkout-step-title"
                ref={currentStepHeadingRef}
                tabIndex={-1}
                className="mt-1 text-xl font-bold text-[var(--color-navy)]"
              >
                {steps[currentStepIndex]?.title}
              </h2>
            </div>
            <Suspense fallback={<Loading />}>
              {cartLoading && <Loading />}
              {cart && recoveredPayment ? (
                <PaymentResultView result={recoveredPayment} onBack={() => setRecoveredPayment(null)} />
              ) : cart && (
                <>
                  {activeStep === CheckoutStepKey.ADDRESSES && <CheckoutCustomerStep cart={cart} value={safeCustomerInfo} onChange={setCustomerInfo} onNext={handleNext} />}
                  {activeStep === CheckoutStepKey.DELIVERY && (
                    <DeliveryStep
                      cart={cart}
                      onNext={handleNext}
                      onBack={handleBack}
                      resetSelectionToken={shippingResetToken}
                      customerInfo={customerInfo}
                    />
                  )}
                  {activeStep === CheckoutStepKey.PAYMENT && !effectivePrepared && (
                    <CheckoutPreparationStep
                      cart={cart}
                      prepared={effectivePrepared}
                      onPrepared={(summary) => {
                        setPrepared(summary)
                        writePreparedCheckoutState(runtimeKey, summary)
                        dispatch({ type: "PREPARED" })
                      }}
                      onInvalidPreparation={handlePrepareInvalid}
                      onBack={handleBack}
                      onNext={handleNext}
                      customer={{
                        person_type: customerInfo.personType,
                        document: customerInfo.document,
                        ...(customerInfo.personType === "business" ? { legal_name: customerInfo.legalName } : {}),
                      }}
                    />
                  )}
                  {activeStep === CheckoutStepKey.PAYMENT && effectivePrepared && (
                    <CheckoutPaymentStep
                      cart={cart}
                      prepared={effectivePrepared}
                      selection={effectiveSelection}
                      onSelectionChange={(next) => {
                        setSelection(next)
                        writeCheckoutSelectionState(runtimeKey, next)
                        if (next) dispatch({ type: "PAYMENT_SELECTED", method: next.method })
                      }}
                      onNext={handleNext}
                      onBack={handleBack}
                    />
                  )}
                  {showReview && effectivePrepared && effectiveSelection && (
                    <CheckoutReviewStep
                      cart={cart}
                      prepared={effectivePrepared}
                      selection={effectiveSelection}
                      customer={customerInfo}
                      authenticated={authState === "authenticated"}
                      onEditCustomer={() => goToStep(CheckoutStepKey.ADDRESSES)}
                      onEditDelivery={() => goToStep(CheckoutStepKey.DELIVERY)}
                      onBack={handleBack}
                      onPaymentSubmitting={(method) => dispatch({ type: "PAYMENT_SUBMITTING", method })}
                      onPaymentResult={(result) => {
                        // A Brick token is single-use. Clear it as soon as the
                        // adapter settles, including structured card rejections.
                        if (effectiveSelection.method === "card") {
                          const safeSelection: CheckoutPaymentSelection = {
                            method: "card",
                            card: {
                              secureMountId: "mercado-pago-secure-card-mount",
                              installments: effectiveSelection.card?.installments || 1,
                            },
                          }
                          setSelection(safeSelection)
                          writeCheckoutSelectionState(runtimeKey, safeSelection)
                        }
                        dispatch({ type: "PAYMENT_RESULT", result })
                      }}
                    />
                  )}
                </>
              )}
            </Suspense>
          </section>
          <aside className="min-w-0 lg:pt-0" aria-label="Resumo do pedido">
            <Suspense fallback={<Loading />}>
              {cartLoading && <Loading />}
              {cart && <CheckoutSummary cart={cart} prepared={effectivePrepared} />}
              {!cart && !cartLoading && <CartEmpty />}
            </Suspense>
          </aside>
        </div>
      </div>
    </main>
  )
}

export default Checkout
