import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

/**
 * Google authentication is intentionally fail-closed.
 *
 * The previous route manually inspected an ID token, mutated Auth and Customer
 * services directly, and wrote an HTTP session without a registered Medusa
 * provider. Re-enable this endpoint only with a Medusa v2 auth provider,
 * callback/state validation and dedicated integration tests.
 */
export async function POST(
  _req: MedusaRequest,
  res: MedusaResponse,
): Promise<void> {
  res.status(503).json({
    code: "AUTH_PROVIDER_DISABLED",
    message: "O login com Google está temporariamente indisponível.",
  });
}
