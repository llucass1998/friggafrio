import { Module } from "@medusajs/framework/utils"
import CustomerProfileService from "./service"

export const CUSTOMER_PROFILE_MODULE = "customerProfile"

export default Module(CUSTOMER_PROFILE_MODULE, {
  service: CustomerProfileService,
})
