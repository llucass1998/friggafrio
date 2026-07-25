import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { CUSTOMER_PROFILE_MODULE } from "../../../modules/customer-profile"
import { isValidCpf, isValidCnpj, normalizeDocument } from "../../../lib/validation/document"
import { hashValue } from "../../../lib/encryption"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const customerId = req.user?.customer_id
  if (!customerId) {
    res.status(401).json({ message: "Unauthorized" })
    return
  }

  const customerProfileService = req.scope.resolve(CUSTOMER_PROFILE_MODULE)
  const profiles = await customerProfileService.listCustomerProfiles({
    customer_id: customerId,
  })

  if (!profiles.length) {
    res.status(404).json({ message: "Customer profile not found" })
    return
  }

  const profile = profiles[0]
  // Note: document field is masked in responses for safety, the hash isn't sent
  res.json({
    customer_profile: {
      ...profile,
      document: profile.document_last_four ? `***.***.***-${profile.document_last_four}` : null,
      document_hash: undefined
    }
  })
}

const updateProfileSchema = z.object({
  document_type: z.enum(["cpf", "cnpj"]).optional(),
  document: z.string().optional(),
  corporate_name: z.string().optional(),
  state_inscription: z.string().optional(),
  is_state_inscription_exempt: z.boolean().optional(),
  marketing_consent: z.boolean().optional(),
}).refine(data => {
  if (data.document && data.document_type) {
    const doc = normalizeDocument(data.document)
    if (data.document_type === "cpf" && !isValidCpf(doc)) return false
    if (data.document_type === "cnpj" && !isValidCnpj(doc)) return false
  }
  return true
}, { message: "Invalid document for the specified type" })

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const customerId = req.user?.customer_id
  if (!customerId) {
    res.status(401).json({ message: "Unauthorized" })
    return
  }

  const { success, data, error } = updateProfileSchema.safeParse(req.body)
  if (!success) {
    res.status(400).json({ message: "Invalid input", error })
    return
  }

  const normalizedDocument = data.document ? normalizeDocument(data.document) : undefined

  const customerProfileService = req.scope.resolve(CUSTOMER_PROFILE_MODULE)
  const profiles = await customerProfileService.listCustomerProfiles({
    customer_id: customerId,
  })

  const payload = {
    ...data,
    ...(normalizedDocument && {
      document: normalizedDocument,
      document_hash: hashValue(normalizedDocument),
      document_last_four: normalizedDocument.slice(-4)
    })
  }

  let profile
  if (profiles.length) {
    profile = await customerProfileService.updateCustomerProfiles({
      id: profiles[0].id,
      ...payload,
    })
  } else {
    profile = await customerProfileService.createCustomerProfiles({
      customer_id: customerId,
      ...payload,
    })
  }

  res.json({
    customer_profile: {
      ...profile,
      document: profile.document_last_four ? `***.***.***-${profile.document_last_four}` : null,
      document_hash: undefined
    }
  })
}
