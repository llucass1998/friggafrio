import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { z } from "@medusajs/framework/zod";
import { CUSTOMER_PROFILE_MODULE } from "../../../modules/customer-profile";
import {
  isValidCpf,
  isValidCnpj,
  normalizeDocument,
} from "../../../lib/validation/document";
import { encrypt, hashValue } from "../../../lib/encryption";

type CustomerProfileResponseSource = {
  id: string;
  customer_id: string;
  document_type: "cpf" | "cnpj";
  document_last_four?: string | null;
  corporate_name?: string | null;
  state_inscription?: string | null;
  is_state_inscription_exempt: boolean;
  accepted_terms_at?: Date | string | null;
  accepted_terms_version?: string | null;
  marketing_consent: boolean;
};

const serializeCustomerProfile = (profile: CustomerProfileResponseSource) => ({
  id: profile.id,
  customer_id: profile.customer_id,
  document_type: profile.document_type,
  document: profile.document_last_four
    ? `***.***.***-${profile.document_last_four}`
    : null,
  corporate_name: profile.corporate_name ?? null,
  state_inscription: profile.state_inscription ?? null,
  is_state_inscription_exempt: profile.is_state_inscription_exempt,
  accepted_terms_at: profile.accepted_terms_at ?? null,
  accepted_terms_version: profile.accepted_terms_version ?? null,
  marketing_consent: profile.marketing_consent,
});

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
) => {
  const customerId = req.auth_context?.actor_id;
  if (!customerId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const customerProfileService = req.scope.resolve(CUSTOMER_PROFILE_MODULE);
  const profiles = await customerProfileService.listCustomerProfiles({
    customer_id: customerId,
  });

  if (!profiles.length) {
    res.status(404).json({ message: "Customer profile not found" });
    return;
  }

  res.json({
    customer_profile: serializeCustomerProfile(profiles[0]),
  });
};

const updateProfileSchema = z.object({
  document_type: z.enum(["cpf", "cnpj"]).optional(),
  document: z.string().optional(),
  corporate_name: z.string().optional(),
  state_inscription: z.string().optional(),
  is_state_inscription_exempt: z.boolean().optional(),
  marketing_consent: z.boolean().optional(),
});

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
) => {
  const customerId = req.auth_context?.actor_id;
  if (!customerId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const { success, data, error } = updateProfileSchema.safeParse(req.body);
  if (!success) {
    res.status(400).json({ message: "Invalid input", error });
    return;
  }

  const normalizedDocument = data.document
    ? normalizeDocument(data.document)
    : undefined;

  const customerProfileService = req.scope.resolve(CUSTOMER_PROFILE_MODULE);
  const profiles = await customerProfileService.listCustomerProfiles({
    customer_id: customerId,
  });

  const documentType =
    data.document_type ?? profiles[0]?.document_type ?? "cpf";

  if (
    normalizedDocument &&
    ((documentType === "cpf" && !isValidCpf(normalizedDocument)) ||
      (documentType === "cnpj" && !isValidCnpj(normalizedDocument)))
  ) {
    res.status(400).json({
      message: "Invalid document for the specified type",
    });
    return;
  }

  const encryptedDocument = normalizedDocument
    ? encrypt(normalizedDocument)
    : undefined;

  const payload = {
    ...(data.document_type && { document_type: data.document_type }),
    ...(data.corporate_name !== undefined && {
      corporate_name: data.corporate_name,
    }),
    ...(data.state_inscription !== undefined && {
      state_inscription: data.state_inscription,
    }),
    ...(data.is_state_inscription_exempt !== undefined && {
      is_state_inscription_exempt: data.is_state_inscription_exempt,
    }),
    ...(data.marketing_consent !== undefined && {
      marketing_consent: data.marketing_consent,
    }),
    ...(normalizedDocument &&
      encryptedDocument && {
        document_type: documentType,
        document_ciphertext: encryptedDocument.encryptedData,
        document_iv: encryptedDocument.iv,
        document_auth_tag: encryptedDocument.authTag,
        document_hash: hashValue(normalizedDocument),
        document_last_four: normalizedDocument.slice(-4),
      }),
  };

  let profile;
  if (profiles.length) {
  // eslint-disable-next-line @medusajs/no-service-mutations-in-api-route
    profile = await customerProfileService.updateCustomerProfiles({
      id: profiles[0].id,
      ...payload,
    });
  } else {
  // eslint-disable-next-line @medusajs/no-service-mutations-in-api-route
    profile = await customerProfileService.createCustomerProfiles({
      customer_id: customerId,
      ...payload,
    });
  }

  res.json({
    customer_profile: serializeCustomerProfile(profile),
  });
};
