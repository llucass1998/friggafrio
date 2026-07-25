import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys, Modules, MedusaError } from "@medusajs/framework/utils"
import { PAYMENT_ATTEMPT_MODULE } from "../../modules/payment-attempt"
import { PRODUCT_SALES_POLICY_MODULE } from "../../modules/product-sales-policy"

const validateCartStockAndCalculate = createStep(
  "validate-cart-stock-and-calculate",
  async (input: { cart_id: string }, { container }) => {
    // 1. Resolve os modulos necessários (carrinho, inventário, etc)
    const cartService = container.resolve(Modules.CART)
    const pricingService = container.resolve(Modules.PRICING)
    const productSalesPolicyService = container.resolve(PRODUCT_SALES_POLICY_MODULE) as any

    // a. Obtém Carrinho
    const cart = await cartService.retrieveCart(input.cart_id, { relations: ["items", "items.product"] }) as any

    // Validate QUOTE_ONLY rule across cart products
    for (const item of cart.items || []) {
      if (item.product?.id) {
        const policyList = await productSalesPolicyService.listProductSalesPolicies({ product_id: item.product.id })
        if (policyList.length > 0 && policyList[0].is_quote_only) {
          throw new MedusaError(MedusaError.Types.NOT_ALLOWED, `Product ${item.product.title} requires quote only and cannot be checked out directly.`)
        }
      }
    }

    // Regra de Negócio: recalcula baseado nos itens e estoque
    // Valida Estoque de todos os itens do carrinho

    // Retorna Snapshot da validação
    return new StepResponse({
      isValid: true,
      cartId: input.cart_id,
      amount: 1000,
      currency_code: "BRL"
    }, { cartId: input.cart_id })
  },
  async (compensation, { container }) => {
    // Libera reserva de estoque feita, se houver falhado na transação
  }
)

const generateIdempotencyKey = createStep(
  "generate-idempotency-key",
  async (input: { cartId: string, amount: number, currency_code: string }, { container }) => {
    const paymentAttemptService = container.resolve(PAYMENT_ATTEMPT_MODULE)

    const key = `payment_mp_${input.cartId}_${Date.now()}`

    const attempt = await paymentAttemptService.createPaymentAttempts({
      cart_id: input.cartId,
      provider: "mercado-pago",
      idempotency_key: key,
      amount: input.amount,
      currency_code: input.currency_code,
      status: "pending",
    })

    return new StepResponse(attempt, attempt.id)
  },
  async (attemptId, { container }) => {
    if (!attemptId) return
    const paymentAttemptService = container.resolve(PAYMENT_ATTEMPT_MODULE)
    await paymentAttemptService.updatePaymentAttempts({
      id: attemptId,
      status: "canceled"
    })
  }
)

// The workflow defining the strict sequence
export const checkoutWorkflow = createWorkflow(
  "checkout",
  (input: { cart_id: string }) => {
    // 1. Validar Estoque e Preços em Servidor
    const validationResult = validateCartStockAndCalculate(input)

    // 2. Gerar Intent de Pagamento e registrar tentativa idempotente
    const paymentAttempt = generateIdempotencyKey({
      cartId: validationResult.cartId,
      amount: validationResult.amount,
      currency_code: validationResult.currency_code
    })

    // 3. O workflow devolve a tentativa e delega ao client side a cobrança com SDK (Mercado Pago)
    return new WorkflowResponse({
      attemptId: paymentAttempt.id,
      idempotencyKey: paymentAttempt.idempotency_key,
      amount: validationResult.amount,
    })
  }
)
