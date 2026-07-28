import { Module } from "@medusajs/framework/utils";
import ContactRequestService from "./services/contact-request";

export const CONTACT_REQUEST_MODULE = "contactRequest";

export default Module(CONTACT_REQUEST_MODULE, {
  service: ContactRequestService,
});
