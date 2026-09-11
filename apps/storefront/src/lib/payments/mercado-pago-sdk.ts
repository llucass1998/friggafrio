type MercadoPagoBrick = {
  unmount?: () => void
  getFormData?: () => Promise<Record<string, unknown> | null>
}
type MercadoPagoBricks = { create: (name: string, containerId: string, options: Record<string, unknown>) => Promise<MercadoPagoBrick> }
type MercadoPagoInstance = { bricks: () => MercadoPagoBricks }
type MercadoPagoConstructor = new (publicKey: string, options?: { locale?: string }) => MercadoPagoInstance

export type MercadoPagoBrickErrorCode =
  | "SDK_CONSTRUCTOR_ERROR"
  | "SDK_BRICKS_UNAVAILABLE"
  | "BRICK_CREATE_REJECTED"
  | "SDK_CALLBACK_ERROR"

/** Classify SDK failures without exposing provider payloads or card data. */
export const classifyMercadoPagoBrickError = (error: unknown): MercadoPagoBrickErrorCode => {
  if (error && typeof error === "object") {
    const code = (error as { code?: unknown }).code
    if (code === "SDK_CALLBACK_ERROR") return "SDK_CALLBACK_ERROR"
  }
  return "BRICK_CREATE_REJECTED"
}

declare global {
  interface Window {
    MercadoPago?: MercadoPagoConstructor
  }
}

let scriptPromise: Promise<MercadoPagoConstructor> | null = null

const loadScript = (): Promise<MercadoPagoConstructor> => {
  if (typeof window === "undefined") throw new Error("Mercado Pago SDK só pode ser carregado no navegador")
  if (window.MercadoPago) return Promise.resolve(window.MercadoPago)
  if (scriptPromise) return scriptPromise
  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-mercado-pago-sdk="true"]')
    if (existing) {
      existing.addEventListener("load", () => window.MercadoPago ? resolve(window.MercadoPago) : reject(new Error("Mercado Pago SDK sem construtor")), { once: true })
      existing.addEventListener("error", () => reject(new Error("Não foi possível carregar o SDK do Mercado Pago")), { once: true })
      return
    }
    const script = document.createElement("script")
    script.src = "https://sdk.mercadopago.com/js/v2"
    script.async = true
    script.dataset.mercadoPagoSdk = "true"
    script.addEventListener("load", () => window.MercadoPago ? resolve(window.MercadoPago) : reject(new Error("Mercado Pago SDK sem construtor")), { once: true })
    script.addEventListener("error", () => reject(new Error("Não foi possível carregar o SDK do Mercado Pago")), { once: true })
    document.head.appendChild(script)
  })
  return scriptPromise
}

export const mountMercadoPagoCardBrick = async ({ publicKey, containerId, amount, payerEmail, onReady, onSubmit, onError }: {
  publicKey: string
  containerId: string
  amount: number
  payerEmail: string
  onReady?: () => void
  onSubmit: (formData: Record<string, unknown>) => Promise<void>
  onError: (error: unknown) => void
}): Promise<MercadoPagoBrick> => {
  if (!publicKey) throw new Error("Public Key do Mercado Pago não configurada")
  const Constructor = await loadScript()
  let instance: MercadoPagoInstance
  try {
    instance = new Constructor(publicKey, { locale: "pt-BR" })
  } catch {
    const error = { code: "SDK_CONSTRUCTOR_ERROR" as const }
    onError(error)
    throw new Error(error.code)
  }
  let bricks: MercadoPagoBricks
  try {
    bricks = instance.bricks()
  } catch {
    const error = { code: "SDK_BRICKS_UNAVAILABLE" as const }
    onError(error)
    throw new Error(error.code)
  }
  try {
    return await bricks.create("cardPayment", containerId, {
      initialization: { amount, payer: { email: payerEmail } },
      customization: {
        visual: {
          style: { theme: "default" },
          texts: { formSubmit: "Confirmar dados do cartão" },
        },
        paymentMethods: { creditCard: "all" },
      },
      callbacks: {
        onReady: () => {
          onReady?.()
        },
        onSubmit,
        onError,
      },
    })
  } catch {
    const error = { code: classifyMercadoPagoBrickError(undefined) }
    onError(error)
    throw new Error(error.code)
  }
}

export const resetMercadoPagoSdkForTests = (): void => {
  scriptPromise = null
}
