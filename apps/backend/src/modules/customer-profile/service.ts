import { MedusaService } from "@medusajs/framework/utils"
import { CustomerProfile } from "./models/customer-profile"

class CustomerProfileService extends MedusaService({
  CustomerProfile,
}) {
  // We can add custom methods here like encryption logic or validation overrides
}

export default CustomerProfileService
