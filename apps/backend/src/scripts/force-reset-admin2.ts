import { Modules } from "@medusajs/framework/utils"
import { ExecArgs } from "@medusajs/framework/types"

export default async function forceResetAdmin({ container }: ExecArgs) {
  const adminEmail = process.env.ADMIN_EMAIL?.trim()
  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminEmail || !adminPassword) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required for this one-off script.")
  }

  const authModuleService = container.resolve(Modules.AUTH)

  try {
    await authModuleService.createAuthIdentities({
      provider_identities: [{
        provider: "emailpass",
        entity_id: adminEmail,
        provider_metadata: { password: adminPassword },
      }],
    })
    console.log("Admin identity created.")
  } catch {
    console.error("Failed to create admin identity.")
  }
}
