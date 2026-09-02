import { useQuery, useQueryClient } from "@tanstack/react-query"
import { sdk } from "@/lib/medusa"
import { useAuth } from "@/lib/hooks/use-auth"
import { companySetupQueryKey, isCompanySetupEligible, shouldRetryCompanySetup } from "@/lib/hooks/company-setup-policy"

export interface CompanySetupStep {
  key: string
  label: string
  description: string
  completed: boolean
  link: string
  required_for_checkout: boolean
}

export interface CompanySetupStatus {
  completed: boolean
  checkout_ready: boolean
  steps: CompanySetupStep[]
  completed_count: number
  total_count: number
}

export function useCompanySetupStatus() {
  const { authState, customer, employee } = useAuth()
  // This endpoint is meaningful only for a verified B2B employee session.
  // Keeping B2C and transient auth states out prevents expected 401/404 retries.
  const customerId = customer?.id
  const companyId = employee?.company_id

  return useQuery({
    queryKey: companySetupQueryKey(customerId),
    queryFn: async () => {
      const response = await sdk.client.fetch<{
        setup_status: CompanySetupStatus
      }>("/store/company/setup-status", { method: "GET" })
      return response.setup_status
    },
    enabled: isCompanySetupEligible({ authState, customerId, companyId }),
    staleTime: 30_000,
    retry: shouldRetryCompanySetup,
  })
}

export function useInvalidateSetupStatus() {
  const queryClient = useQueryClient()
  return () =>
    queryClient.invalidateQueries({ queryKey: ["company-setup-status"] })
}
