export type FormatCurrencyParams = {
  amount: number | null | undefined
  currencyCode?: string
  minimumFractionDigits?: number
  maximumFractionDigits?: number
  locale?: string
}

export const formatCurrencyAmount = ({
  amount,
  currencyCode,
  minimumFractionDigits = 2,
  maximumFractionDigits = 2,
  locale = "pt-BR",
}: FormatCurrencyParams): string => {
  if (amount === null || amount === undefined) return "-"
  if (!currencyCode) return "-"

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode.toUpperCase(),
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(amount)
}
