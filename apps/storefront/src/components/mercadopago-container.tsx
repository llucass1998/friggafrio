import { initMercadoPago, Payment } from "@mercadopago/sdk-react"
import { getActivePaymentSession, isMercadopago } from "@/lib/utils/checkout"
import { HttpTypes } from "@medusajs/types"
import { useEffect, useState, useRef } from "react"

// Importante: Nunca exponha tokens privados. Esta é a chave pública.
const PUBLIC_KEY = process.env.VITE_PUBLIC_MP_KEY || "TEST-8f6a39de-639a-4f51-b8be-6831e5bb64c7" 

type MercadopagoContainerProps = {
  cart: HttpTypes.StoreCart
  onPaymentDetailsComplete?: (complete: boolean) => void
  isSubmitting?: boolean
}

const MercadopagoContainer = ({
  cart,
  onPaymentDetailsComplete,
  isSubmitting = false,
}: MercadopagoContainerProps) => {
  const activeSession = getActivePaymentSession(cart)
  const isMp = isMercadopago(activeSession?.provider_id)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isReady, setIsReady] = useState(false)
  
  // Impede inicializações múltiplas
  const initializationRef = useRef(false)

  useEffect(() => {
    if (isMp && !initializationRef.current) {
      initializationRef.current = true
      initMercadoPago(PUBLIC_KEY, { locale: "pt-BR" })
      setIsInitialized(true)
    }
  }, [isMp])

  if (!isMp || !isInitialized) {
    return (
      <div className="py-4 text-sm text-zinc-500">
        Iniciando pagamento seguro...
      </div>
    )
  }

  const customization = {
    paymentMethods: {
      creditCard: "all",
      ticket: "all",
      bankTransfer: "all", // Inclui Pix
      mercadoPago: "all",
    },
    visual: {
      hidePaymentButton: true, // Escondemos o botão do SDK para usar o nosso
      style: {
        theme: "default",
      },
    },
  }

  const initialization = {
    amount: cart.total ?? 0,
    preferenceId: activeSession?.data?.preference_id as string | undefined,
    payer: {
      email: cart.email || "",
      firstName: cart.shipping_address?.first_name || "",
      lastName: cart.shipping_address?.last_name || "",
    }
  }

  return (
    <div className="my-4 min-h-[300px] border border-zinc-200 rounded-md p-4 bg-white relative">
      <Payment
        initialization={initialization}
        customization={customization as any}
        onSubmit={async ({ selectedPaymentMethod, formData }) => {
           // Bloqueia envios se já estiver processando
           if (isSubmitting) return;
           
           // O SDK cuida da tokenização no frontend e devolve o 'formData' contendo o token, 
           // mas os dados do cartão nunca chegam ao servidor de forma crua.
           
           // Vamos informar ao container pai que pode prosseguir.
           // Na estrutura do seu checkout, você possivelmente passaria os dados tokenizados 
           // para o estado e faria o envio manual, ou usar o form nativo se preferir.
           // Para fins de integração Medusa: o form.token é o que vai na payment_session
           
           // Esse SDK tem uma complexidade onde o onSubmit é pra ele próprio enviar pra sua API.
           // Já que estamos empacotando com o botão do Medusa, interceptamos.
           onPaymentDetailsComplete?.(true)
        }}
        onReady={() => {
          setIsReady(true)
          onPaymentDetailsComplete?.(true) 
        }}
        onError={(error) => {
          console.error("Erro MP:", error)
          onPaymentDetailsComplete?.(false)
        }}
      />
      {!isReady && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
           Carregando opções de pagamento...
        </div>
      )}
    </div>
  )
}

export default MercadopagoContainer
