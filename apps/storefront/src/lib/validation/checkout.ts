import { isValidCnpj, isValidCpf } from "@/lib/utils/validation-documents"

export const normalizeDigits = (value: unknown, maxLength?: number): string => {
  const digits = typeof value === "string" ? value.replace(/\D/g, "") : ""
  return typeof maxLength === "number" ? digits.slice(0, maxLength) : digits
}

const isLetter = (character: string): boolean =>
  character.toLocaleUpperCase() !== character.toLocaleLowerCase()

export const normalizePersonName = (value: string): string =>
  Array.from(value)
    .filter((character) => isLetter(character) || /\s|[.'-]/.test(character))
    .join("")
    .replace(/\s+/g, " ")
    .trim()

export const isValidPersonName = (value: string): boolean => {
  const normalized = normalizePersonName(value)
  return normalized.length >= 2 && Array.from(normalized).some(isLetter) && !/[0-9]/.test(value)
}

export const isValidEmail = (value: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) && !/\s/.test(value.trim())

export const isValidBrazilPhone = (value: string): boolean => {
  const digits = normalizeDigits(value, 11)
  return (digits.length === 10 || digits.length === 11) && !/^([0-9])\1+$/.test(digits)
}

export const isValidBrazilPostalCode = (value: string): boolean => normalizeDigits(value, 8).length === 8

export { isValidCpf, isValidCnpj }
