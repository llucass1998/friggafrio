import { MedusaService } from "@medusajs/framework/utils"
import { FiscalOutboxEvent } from "./models/fiscal-outbox-event"

class FiscalOutboxModuleService extends MedusaService({ FiscalOutboxEvent }) {}
export default FiscalOutboxModuleService
