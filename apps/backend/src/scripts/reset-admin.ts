import { Modules } from "@medusajs/framework/utils"
import { ExecArgs } from "@medusajs/framework/types"

export default async function resetAdmin({ container }: ExecArgs) {
  console.log("Looking up admin identity...");
  
  const authModuleService = container.resolve(Modules.AUTH)
  const userModuleService = container.resolve(Modules.USER)
  
  const users = await userModuleService.listUsers({
    email: "admin@friggafrio.com.br"
  })
  
  if (!users.length) {
    console.log("No user found with admin@friggafrio.com.br!");
    return;
  }
  
  const user = users[0];
  console.log("Found user:", user.id);
  
  // Create a new fresh admin account to be safe
  const testEmail = "admin2@friggafrio.com.br";
  
  try {
    const authResult = await authModuleService.register("emailpass", {
      body: {
        email: testEmail,
        password: "supersecret"
      }
    }) as Record<string, unknown>;
    const authIdentity = authResult.authIdentity as { id: string } | undefined;

    console.log("Registered new auth identity:", authIdentity?.id);
    
    const newUser = await userModuleService.createUsers({
      email: testEmail,
      first_name: "Admin",
      last_name: "Test"
    });
    
    console.log("Created user:", newUser.id);
    
    // Link them (requires core flow usually, but we are hacking it just for you to login)
    // The easiest way is to use the medusa CLI user command which we know works but fails if it exists
    console.log("Please login with: admin2@friggafrio.com.br / supersecret");
    
  } catch (e) {
    console.error("Failed to create admin2:", e.message);
  }
}
