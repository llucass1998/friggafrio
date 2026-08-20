import { MedusaService } from "@medusajs/framework/utils"
import { PasswordResetToken } from "./models/password-reset-token"

export default class PasswordResetTokenService extends MedusaService({
  PasswordResetToken,
}) {}
