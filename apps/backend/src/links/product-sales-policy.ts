import { defineLink } from "@medusajs/framework/utils"
import ProductModule from "@medusajs/medusa/product"
import ProductSalesPolicyModule from "../modules/product-sales-policy"

export default defineLink(
  ProductModule.linkable.product,
  {
    linkable: ProductSalesPolicyModule.linkable.productSalesPolicy,
    isList: false,
  }
)