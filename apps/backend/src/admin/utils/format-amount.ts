export const formatAmount = (amount: number, currency_code: string) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: currency_code,
  }).format(amount)
}
