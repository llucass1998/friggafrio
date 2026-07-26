import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { z } from "zod"
import { Modules } from "@medusajs/framework/utils"

// Validar payload da Google (Federated Identity)
const GoogleAuthSchema = z.object({
  credential: z.string().min(1, "O token credential (JWT) do Google é obrigatório"),
  client_id: z.string().optional()
})

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER)

  // 1. Validar estrutura do corpo da requisição
  const parsed = GoogleAuthSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({
      message: "Dados de autenticação inválidos",
      errors: parsed.error.format()
    })
  }

  const { credential } = parsed.data

  const googleClientId = process.env.GOOGLE_CLIENT_ID
  if (!googleClientId) {
    logger.error("GOOGLE_CLIENT_ID não está configurado.")
    return res.status(500).json({ message: "Configuração do servidor de autenticação incompleta." })
  }

  try {
    // 2. Validar o Token JWT no endpoint da Google
    // O Google verifica o token JWT assinado usando as chaves públicas deles.
    const verifyResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`)

    if (!verifyResponse.ok) {
      const errorData = await verifyResponse.json()
      logger.error("Erro ao validar token Google:", errorData)
      return res.status(401).json({ message: "Token Google inválido ou expirado" })
    }

    const payload = await verifyResponse.json()

    // 3. Checar a AUD (audience) = nosso Client ID
    if (payload.aud !== googleClientId) {
      logger.error(`O token foi gerado para outro Client ID: ${payload.aud}`)
      return res.status(401).json({ message: "Token emitido para uma aplicação diferente" })
    }

    // 4. Checar campos requeridos
    const sub = payload.sub // Identificador único da Conta Google
    const email = payload.email // Email, pode mudar, mas usamos o sub primariamente
    const email_verified = payload.email_verified === "true" || payload.email_verified === true
    const given_name = payload.given_name || ""
    const family_name = payload.family_name || ""

    if (!sub || !email) {
      return res.status(400).json({ message: "O token não contém as informações mínimas (sub e email)" })
    }

    if (!email_verified) {
      return res.status(403).json({ message: "O e-mail da Conta Google não foi verificado." })
    }

    const authModule = req.scope.resolve(Modules.AUTH)
    const customerModule = req.scope.resolve(Modules.CUSTOMER)
    const authProviderId = "google"

    // 5. Autenticar ou Registrar usando o Auth Module do Medusa v2
    // Primeiro tentamos ver se a identidade auth existe.
    let authIdentity;
    try {
      // Procurar provider identity existente com `provider_metadata.sub` OU `entity_id` = sub
      const result = await authModule.listAuthIdentities({
        provider_identities: {
          provider: authProviderId,
          entity_id: sub
        }
      })
      if (result.length > 0) {
        authIdentity = result[0]
      }
    } catch (e) {
      logger.debug("Identidade Google não encontrada, prosseguindo para criação/vínculo.")
    }

    // Identidade do Auth
    let finalAuthIdentityId = authIdentity?.id

    if (!finalAuthIdentityId) {
      // Criar a AuthIdentity pois ela não existe
      const newAuthIdentity = await authModule.createAuthIdentities([{
        provider_identities: [{
          entity_id: sub,
          provider: authProviderId,
          provider_metadata: {
            sub,
            email,
            given_name,
            family_name,
            picture: payload.picture,
          }
        }],
        app_metadata: {
          customer_id: null // Ainda não sabemos o ID do customer
        }
      }])
      finalAuthIdentityId = newAuthIdentity[0].id
    }

    // Se temos a AuthIdentity, verificamos se ela está ligada a um Customer.
    // Se não, vamos ver se já existe Customer com esse E-mail.
    let targetCustomer;

    // Ler a AuthIdentity novamente para ver app_metadata
    const currentIdentity = await authModule.retrieveAuthIdentity(finalAuthIdentityId)

    if (currentIdentity.app_metadata?.customer_id) {
       targetCustomer = await customerModule.retrieveCustomer(currentIdentity.app_metadata.customer_id as string)
    } else {
       // Buscar customer por email (Merge account strategy)
       const customers = await customerModule.listCustomers({ email })
       if (customers.length > 0) {
          targetCustomer = customers[0]
       } else {
          // Criar novo customer
          const newCustomers = await customerModule.createCustomers([{
             email,
             first_name: given_name,
             last_name: family_name,
             has_account: true,
          }])
          targetCustomer = newCustomers[0]
       }

       // Ligar o AuthIdentity ao Customer
       await authModule.updateAuthIdentities([{
         id: finalAuthIdentityId,
         app_metadata: {
           customer_id: targetCustomer.id
         }
       }])
    }

    // 6. Gerar Sessão JWT no Medusa para o frontend usar (como no emailpass)
    // Usamos o utilitário nativo ou o módulo HTTP do Medusa
    // Para simplificar, devolvemos success e o middleware de autenticação (JWT)
    // precisa gerenciar isso. No Medusa v2, /auth/customer/emailpass é tratado automaticamente
    // pelo Session Auth ou JWT Auth dependendo de como está montado.
    // O frontend espera apenas sucesso e vai bater no /store/customers/me depois com cookies ou Token.

    // A forma nativa de setar sessão no Medusa v2 sem o route-handler do authModule:
    req.session.auth_context = {
      actor_id: targetCustomer.id,
      actor_type: "customer",
      auth_identity_id: finalAuthIdentityId,
      app_metadata: { customer_id: targetCustomer.id }
    }

    return res.status(200).json({
      message: "Autenticação Google bem-sucedida",
      customer_id: targetCustomer.id,
      email: targetCustomer.email,
    })

  } catch (error) {
    logger.error("Erro interno no fluxo Google Sign-In:", error)
    return res.status(500).json({ message: "Erro interno ao processar login Google." })
  }
}
