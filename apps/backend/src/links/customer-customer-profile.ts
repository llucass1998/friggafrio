import { defineLink } from "@medusajs/framework/utils"
import CustomerModule from "@medusajs/medusa/customer"
import CustomerProfileModule from "../modules/customer-profile"

export default defineLink(
  CustomerModule.linkable.customer,
  CustomerProfileModule.linkable.customerProfile
)
