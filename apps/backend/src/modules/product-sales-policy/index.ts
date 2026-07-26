import { Module } from "@medusajs/framework/utils"
import { ProductSalesPolicyService } from "./service"

export const PRODUCT_SALES_POLICY_MODULE = "product_sales_policy"

export default Module(PRODUCT_SALES_POLICY_MODULE, {
  service: ProductSalesPolicyService,
})