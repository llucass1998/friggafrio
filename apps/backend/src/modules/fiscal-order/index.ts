import { Module } from "@medusajs/framework/utils"
import FiscalOrderModuleService from "./service"

export const FISCAL_ORDER_MODULE = "fiscalOrder"
export default Module(FISCAL_ORDER_MODULE, { service: FiscalOrderModuleService })
