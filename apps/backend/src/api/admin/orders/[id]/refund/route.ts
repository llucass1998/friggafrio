import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { sendPaymentUnavailable } from "../../../../../utils/payment-availability";

export const POST = async (_request: MedusaRequest, response: MedusaResponse) =>
  sendPaymentUnavailable(response);
