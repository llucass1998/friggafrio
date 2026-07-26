import { MedusaRequest, MedusaResponse, MedusaNextFunction } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export async function validateDemoPriceCheckout(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const cartId = req.params.id

  if (!cartId) {
    return next()
  }

  try {
    const { data: carts } = await query.graph({
      entity: "cart",
      fields: ["id", "items.variant.product.metadata"],
      filters: { id: cartId }
    })

    const cart = carts[0]
    if (!cart || !cart.items) {
      return next()
    }

    for (const item of cart.items) {
      const metadata = item?.variant?.product?.metadata as Record<string, any>
      if (metadata) {
        if (metadata.is_demo_price === true || metadata.price_approval_status !== "approved" || metadata.purchase_enabled === false) {
          return res.status(400).json({
            type: "invalid_data",
            message: "Este produto está em fase de configuração comercial. Solicite a confirmação do valor antes de concluir a compra.",
            code: "product_commercial_hold"
          })
        }
      }
    }

    return next()
  } catch (err) {
    return next(err)
  }
}
