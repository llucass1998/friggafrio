import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { CreateContactRequestSchema } from "./validators";
import { CONTACT_REQUEST_MODULE } from "../../../modules/contact-request";
import ContactRequestService from "../../../modules/contact-request/services/contact-request";
import { INotificationModuleService } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    // 1. Validate payload using Zod
    const validatedBody = CreateContactRequestSchema.parse(req.body);

    // 2. Honeypot check (Zod already rejects if string length > 0, but double checking)
    if (validatedBody.website && validatedBody.website.length > 0) {
      // Bot detected, silently return success to not tip off the bot
      return res.status(201).json({
        contact_request: {
          status: "spam_rejected",
          created_at: new Date().toISOString()
        }
      });
    }

    // Remove honeypot from data
    const { website, ...contactData } = validatedBody;

    // 3. Resolve module service
    const contactRequestService = req.scope.resolve<ContactRequestService>(CONTACT_REQUEST_MODULE);

    // 4. Create record in database
    const contactRequest = await contactRequestService.createContactRequests(contactData);
    let notificationSent = false;

    // 5. Try sending notification if provider exists
    try {
      const notificationModuleService = req.scope.resolve<INotificationModuleService>(Modules.NOTIFICATION);
      
      if (notificationModuleService) {
        // Obter configurações de email da loja (assumindo que existam no ambiente ou na config)
        const recipientEmail = process.env.ADMIN_EMAIL || process.env.STORE_CONTACT_EMAIL;
        
        if (recipientEmail) {
          await notificationModuleService.createNotifications({
            to: recipientEmail,
            channel: "email",
            template: "contact_request_received", // Nome do template que você configuraria no seu provider
            data: {
              contact_request_id: contactRequest.id,
              name: contactRequest.name,
              email: contactRequest.email,
              phone: contactRequest.phone || "Não informado",
              subject: contactRequest.subject || "Novo Contato",
              message: contactRequest.message,
            },
          });
          notificationSent = true;
          
          // Update notification_sent status
          await contactRequestService.updateContactRequests({
            id: contactRequest.id,
            notification_sent: true
          });
        }
      }
    } catch (notificationError) {
      // If notification fails, we log it but don't fail the request
      // since the data is safely persisted
      req.scope.resolve("logger").warn(
        `Failed to send contact request notification for ${contactRequest.id}: ${
          notificationError instanceof Error ? notificationError.message : String(notificationError)
        }`
      );
    }

    // 6. Return standard success response
    return res.status(201).json({
      contact_request: {
        id: contactRequest.id,
        status: contactRequest.status,
        created_at: contactRequest.created_at,
      }
    });

  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        type: "invalid_data",
        message: "Dados de contato inválidos",
        errors: error.errors
      });
    }

    req.scope.resolve("logger").error(
      `Error processing contact request: ${error.message}`,
      error
    );

    return res.status(500).json({
      type: "internal_error",
      message: "Ocorreu um erro ao processar sua solicitação de contato."
    });
  }
}
