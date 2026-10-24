import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { exportMedusaOrderToOmieWorkflow } from "../workflows/omie"

export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")
  const orderId = data.id

  logger.info(`[OrderPlaced] Recebido evento order.placed para ordem: ${orderId}`)

  // Exportar pedido de venda para o Omie ERP de forma desacoplada
  try {
    await exportMedusaOrderToOmieWorkflow(container).run({
      input: { orderId },
    })
  } catch (err) {
    logger.error(`[OmieOrderExport] Falha na exportação do pedido ${orderId}; reconciliação necessária`)
    throw err
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
