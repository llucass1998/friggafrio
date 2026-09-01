import { formatCurrencyAmount } from "@/lib/utils/currency"

export const MAX_INTEREST_FREE_INSTALLMENTS = 10

export function getInterestFreeInstallment(amount: number | null | undefined): {
  installmentAmount: number
  label: string
} | null {
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) return null

  const installmentAmount = Math.round((amount / MAX_INTEREST_FREE_INSTALLMENTS) * 100) / 100
  if (!Number.isFinite(installmentAmount) || installmentAmount <= 0) return null

  return {
    installmentAmount,
    label: `ou ${MAX_INTEREST_FREE_INSTALLMENTS}x de ${formatCurrencyAmount({ amount: installmentAmount, currencyCode: "BRL" })} sem juros`,
  }
}
