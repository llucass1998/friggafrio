import { Module } from "@medusajs/framework/utils"
import PasswordResetTokenService from "./service"

export const PASSWORD_RESET_TOKEN_MODULE = "passwordResetToken"

export default Module(PASSWORD_RESET_TOKEN_MODULE, {
  service: PasswordResetTokenService,
})
