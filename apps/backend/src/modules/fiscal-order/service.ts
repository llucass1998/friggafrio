import { MedusaService } from "@medusajs/framework/utils"
import { FiscalOrder } from "./models/fiscal-order"

class FiscalOrderModuleService extends MedusaService({ FiscalOrder }) {}
export default FiscalOrderModuleService
