import {
  ProviderWebhookPayload,
  WebhookActionResult,
  CapturePaymentInput,
  CapturePaymentOutput,
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  CancelPaymentInput,
  CancelPaymentOutput,
  InitiatePaymentInput,
  InitiatePaymentOutput,
  DeletePaymentInput,
  DeletePaymentOutput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  RefundPaymentInput,
  RefundPaymentOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
  PaymentSessionStatus
} from "@medusajs/framework/types"
import { AbstractPaymentProvider } from "@medusajs/framework/utils"
import { MercadoPagoOptions } from "./types"

class MercadoPagoProvider extends AbstractPaymentProvider<MercadoPagoOptions> {
  static identifier = "mercado-pago"
  protected options_: MercadoPagoOptions

  constructor(container: any, options: MercadoPagoOptions) {
    super(container)
    this.options_ = options
  }

  async capturePayment(
    input: CapturePaymentInput
  ): Promise<CapturePaymentOutput> {
    // Implement API call to MP capture
    return {
      data: {
        ...input.data,
      },
    }
  }

  async authorizePayment(
    input: AuthorizePaymentInput
  ): Promise<AuthorizePaymentOutput> {
    // MP Authorization step
    return {
      status: "authorized" as PaymentSessionStatus,
      data: {
        ...input.data,
      },
    }
  }

  async cancelPayment(
    input: CancelPaymentInput
  ): Promise<CancelPaymentOutput> {
    // MP Cancellation step
    return {
      data: {
        ...input.data,
      },
    }
  }

  async initiatePayment(
    input: InitiatePaymentInput
  ): Promise<InitiatePaymentOutput> {
    const { amount, currency_code } = input

    return {
      id: "mp_session_" + Math.random().toString(36).substring(7),
      data: {
        amount,
        currency_code,
      },
    }
  }

  async deletePayment(
    input: DeletePaymentInput
  ): Promise<DeletePaymentOutput> {
    return {
      data: input.data
    }
  }

  async getPaymentStatus(
    input: GetPaymentStatusInput
  ): Promise<GetPaymentStatusOutput> {
    const status = (input.data?.status as PaymentSessionStatus) || "pending"
    return {
      status
    }
  }

  async refundPayment(
    input: RefundPaymentInput
  ): Promise<RefundPaymentOutput> {
    // MP Refund
    return {
      data: {
        ...(input.data || {}),
      },
    }
  }

  async retrievePayment(
    input: RetrievePaymentInput
  ): Promise<RetrievePaymentOutput> {
    // MP Get Payment Details
    return input.data || {}
  }

  async updatePayment(
    input: UpdatePaymentInput
  ): Promise<UpdatePaymentOutput> {
    return {
      data: {
        ...input.data,
      },
    }
  }

  async getWebhookActionAndData(
    payload: ProviderWebhookPayload["payload"]
  ): Promise<WebhookActionResult> {
    // Temporary stub
    return {
      action: "not_supported",
    }
  }
}

export default MercadoPagoProvider
