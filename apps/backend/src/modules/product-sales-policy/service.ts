import { MedusaService } from "@medusajs/framework/utils"
import { ProductSalesPolicy } from "./models/product-sales-policy"

export class ProductSalesPolicyService extends MedusaService({
  ProductSalesPolicy,
}) {}