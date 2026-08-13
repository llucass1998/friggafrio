import { Modules } from "@medusajs/framework/utils"
import { ExecArgs } from "@medusajs/framework/types"

export default async function resetAdmin({ container }: ExecArgs) {
  const adminEmail = process.env.ADMIN_EMAIL?.trim()
  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminEmail || !adminPassword) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required for this one-off script.")
  }

  const authModuleService = container.resolve(Modules.AUTH)
  const userModuleService = container.resolve(Modules.USER)
  const users = await userModuleService.listUsers({ email: adminEmail })

  if (users.length > 0) {
    console.log("Admin user already exists.")
    return
  }

  try {
    await authModuleService.register("emailpass", {
      body: { email: adminEmail, password: adminPassword },
    })
    await userModuleService.createUsers({
      email: adminEmail,
      first_name: "Admin",
      last_name: "User",
    })
    console.log("Admin identity created.")
  } catch {
    console.error("Failed to create admin identity.")
  }
}
