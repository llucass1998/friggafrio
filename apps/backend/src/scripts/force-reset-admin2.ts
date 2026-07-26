import { Modules } from "@medusajs/framework/utils"
import { ExecArgs } from "@medusajs/framework/types"

export default async function forceResetAdmin({ container }: ExecArgs) {
  const authModuleService = container.resolve(Modules.AUTH)
  
  const newEmail = "admin4@friggafrio.com.br";
  const newPass = "supersecret";
  
  try {
    const authIdentity = await authModuleService.createAuthIdentities({
      provider_identities: [{
        provider: "emailpass",
        entity_id: newEmail,
        provider_metadata: {
          password: newPass
        }
      }]
    });
    
    console.log("Created raw auth identity:", authIdentity[0].id);
  } catch (e) {
    console.log("Failed creating auth raw:", e.message);
  }
}
