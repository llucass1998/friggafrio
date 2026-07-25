import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { checkoutWorkflow } from "../../../workflows/checkout"

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const { cart_id } = req.body as { cart_id: string }

  if (!cart_id) {
    res.status(400).json({ error: "cart_id is required" })
    return
  }

  // Verifica propriedade do carrinho aqui ou no Middleware
  const cartService: any = req.scope.resolve("cartModuleService")
  const cart = await cartService.retrieveCart(cart_id)

  if (cart.customer_id && cart.customer_id !== req.user?.customer_id) {
    res.status(403).json({ error: "Forbidden: Cart does not belong to the user" })
    return
  }

  // Exemplo de execução segura
  const { result, errors } = await checkoutWorkflow(req.scope).run({
    input: {
      cart_id,
    },
    throwOnError: false
  })

  if (errors.length) {
    res.status(400).json({ error: "Checkout failed", details: errors })
    return
  }

  res.status(200).json({
    message: "Checkout session generated securely",
    paymentSession: result
  })
}
