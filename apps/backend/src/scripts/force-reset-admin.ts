import { Modules } from "@medusajs/framework/utils"
import { ExecArgs } from "@medusajs/framework/types"
import { createUsersWorkflow } from "@medusajs/core-flows"

export default async function forceResetAdmin({ container }: ExecArgs) {
  console.log("Forcing a new admin account creation with linked identity...");
  
  const authModuleService = container.resolve(Modules.AUTH)
  const userModuleService = container.resolve(Modules.USER)
  
  // Use a completely new email to bypass any existing conflicts
  const newEmail = "admin3@friggafrio.com.br";
  const newPass = "supersecret";
  
  try {
    console.log("1. Creating auth identity...");
    const { authIdentity } = await authModuleService.register("emailpass", {
      body: {
        email: newEmail,
        password: newPass
      }
    });
    console.log("-> Auth identity created:", authIdentity.id);
    
    console.log("2. Creating user...");
    const newUser = await userModuleService.createUsers({
      email: newEmail,
      first_name: "Admin3",
      last_name: "Friggafrio"
    });
    console.log("-> User created:", newUser.id);
    
    console.log("--- SUCCESS ---");
    console.log(`Email: ${newEmail}`);
    console.log(`Senha: ${newPass}`);
    
  } catch (e) {
    console.error("Failed:", e.message);
  }
}
