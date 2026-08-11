import { DEFAULT_CURRENCY_CODE, DEFAULT_LOCALE } from "@/config/commerce"

export type FormatCurrencyParams = {
  amount: number | null | undefined
  currencyCode?: string
  minimumFractionDigits?: number
  maximumFractionDigits?: number
  locale?: string
}

export const formatCurrencyAmount = ({
  amount,
  currencyCode = DEFAULT_CURRENCY_CODE,
  minimumFractionDigits = 2,
  maximumFractionDigits = 2,
  locale = DEFAULT_LOCALE,
}: FormatCurrencyParams): string => {
  if (amount === null || amount === undefined) return "-"

  const resolvedCurrencyCode = currencyCode.trim() || DEFAULT_CURRENCY_CODE

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: resolvedCurrencyCode.toUpperCase(),
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(amount)
}
