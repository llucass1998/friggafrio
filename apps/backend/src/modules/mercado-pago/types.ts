export interface MercadoPagoOptions {
  accessToken: string
  webhookSecret?: string
}

export type PaymentMethod = "pix" | "credit_card" | "bolbradesco"

export interface CreatePaymentPayload {
  transaction_amount: number
  description: string
  payment_method_id: string
  payer: {
    email: string
    first_name?: string
    last_name?: string
    identification?: {
      type: string
      number: string
    }
  }
  external_reference?: string
  token?: string
  installments?: number
  issuer_id?: string
}
