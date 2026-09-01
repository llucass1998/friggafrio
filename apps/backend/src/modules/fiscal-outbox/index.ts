import { Module } from "@medusajs/framework/utils"
import FiscalOutboxModuleService from "./service"

export const FISCAL_OUTBOX_MODULE = "fiscalOutbox"
export default Module(FISCAL_OUTBOX_MODULE, { service: FiscalOutboxModuleService })
