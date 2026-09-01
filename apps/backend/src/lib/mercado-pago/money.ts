const BRL_SCALE = 2

/** Medusa totals are major currency units; Mercado Pago accepts a BRL string. */
export const brlMajorToDecimal = (amount: number | string): string => {
  const major = typeof amount === "string" ? Number(amount) : amount
  if (!Number.isFinite(major) || major < 0) {
    throw new Error("Mercado Pago amount must be a non-negative finite BRL value")
  }
  return major.toFixed(BRL_SCALE)
}

export const brlMajorToCents = (amount: number | string): number => {
  const major = typeof amount === "string" ? Number(amount) : amount
  if (!Number.isFinite(major) || major < 0) {
    throw new Error("Mercado Pago amount must be a non-negative finite BRL value")
  }
  const cents = Math.round(major * 10 ** BRL_SCALE)
  if (!Number.isSafeInteger(cents)) throw new Error("Mercado Pago amount exceeds the supported integer range")
  return cents
}

export const brlCentsToDecimal = (amount: number | string): string => {
  const cents = typeof amount === "string" ? Number(amount) : amount
  if (!Number.isSafeInteger(cents) || cents < 0) {
    throw new Error("Mercado Pago amount must be a non-negative integer in centavos")
  }
  return (cents / 10 ** BRL_SCALE).toFixed(BRL_SCALE)
}

export const brlDecimalToCents = (amount: string): number => {
  if (!/^\d+(?:\.\d{1,2})?$/.test(amount)) {
    throw new Error("Mercado Pago amount must use a BRL decimal representation")
  }
  const [whole, fraction = ""] = amount.split(".")
  const cents = Number(`${whole}${fraction.padEnd(BRL_SCALE, "0")}`)
  if (!Number.isSafeInteger(cents)) throw new Error("Mercado Pago amount exceeds the supported integer range")
  return cents
}

export const brlDecimalToMajor = (amount: string): number => brlDecimalToCents(amount) / 10 ** BRL_SCALE

export const assertBrl = (currencyCode: string): void => {
  if (currencyCode.toLowerCase() !== "brl") throw new Error("Mercado Pago V1 accepts only BRL payment sessions")
}
