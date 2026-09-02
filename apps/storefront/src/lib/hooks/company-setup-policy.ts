export type CompanySetupAuthState = "loading" | "authenticated" | "guest"

export const companySetupQueryKey = (customerId?: string): readonly [string, string | undefined] =>
  ["company-setup-status", customerId]

export const isCompanySetupEligible = (input: {
  authState: CompanySetupAuthState
  customerId?: string | null
  companyId?: string | null
}): boolean => input.authState === "authenticated" && Boolean(input.customerId && input.companyId)

export const shouldRetryCompanySetup = (failureCount: number, error: unknown): boolean => {
  const status = typeof error === "object" && error !== null && "status" in error
    ? (error as { status?: unknown }).status
    : undefined
  if (status === 401 || status === 403 || status === 404) return false
  return failureCount < 2
}
