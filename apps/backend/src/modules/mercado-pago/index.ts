import { ModuleProvider } from "@medusajs/framework/utils"
import MercadoPagoProvider from "./service"

export default ModuleProvider("mercado-pago", {
  services: [MercadoPagoProvider],
})
