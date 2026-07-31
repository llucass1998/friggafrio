import { MedusaService, InjectManager, MedusaContext } from "@medusajs/framework/utils";
import { ContactRequest } from "../models/contact-request";
import { Context } from "@medusajs/framework/types";

class ContactRequestService extends MedusaService({
  ContactRequest,
}) {
  /**
   * Override to bypass the broken internal service lookup for snake_case model names.
   * The default MedusaService tries to resolve `contact_requestService` from the container
   * (lowerCaseFirst("contact_request") = "contact_request"), which doesn't match the
   * registered key. We use baseRepository_ directly instead.
   */
  @InjectManager()
  async createContactRequestsCustom(
    data: {
      name: string;
      email: string;
      phone?: string;
      subject?: string;
      message: string;
      source?: string;
    },
    @MedusaContext() sharedContext: Context = {}
  ): Promise<any> {
    const repo = (this as any).baseRepository_;
    const manager = sharedContext.manager ?? repo.manager ?? (repo as any).em;

    const entity = manager.create(ContactRequest, {
      name: data.name,
      email: data.email,
      phone: data.phone ?? null,
      subject: data.subject ?? null,
      message: data.message,
      source: data.source ?? "storefront_home",
    });

    await manager.persistAndFlush(entity);
    return entity;
  }

  @InjectManager()
  async updateContactRequestsCustom(
    data: { id: string; notification_sent?: boolean; status?: string },
    @MedusaContext() sharedContext: Context = {}
  ): Promise<any> {
    const repo = (this as any).baseRepository_;
    const manager = sharedContext.manager ?? repo.manager ?? (repo as any).em;

    const entity = await manager.findOneOrFail(ContactRequest, { id: data.id });

    if (data.notification_sent !== undefined) {
      entity.notification_sent = data.notification_sent;
    }
    if (data.status !== undefined) {
      (entity as any).status = data.status;
    }

    await manager.flush();
    return entity;
  }
}

export default ContactRequestService;
