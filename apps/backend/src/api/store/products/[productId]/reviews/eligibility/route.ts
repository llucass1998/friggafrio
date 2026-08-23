import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { reviewEligibility } from "../route"

export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => reviewEligibility(req, res)
