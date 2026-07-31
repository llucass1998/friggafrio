export const formatCPF = (value: string) => {
  const v = value.replace(/\\D/g, "").slice(0, 11)
  if (v.length <= 3) return v
  if (v.length <= 6) return `${v.slice(0, 3)}.${v.slice(3)}`
  if (v.length <= 9) return `${v.slice(0, 3)}.${v.slice(3, 6)}.${v.slice(6)}`
  return `${v.slice(0, 3)}.${v.slice(3, 6)}.${v.slice(6, 9)}-${v.slice(9)}`
}

export const formatCNPJ = (value: string) => {
  const v = value.replace(/\\D/g, "").slice(0, 14)
  if (v.length <= 2) return v
  if (v.length <= 5) return `${v.slice(0, 2)}.${v.slice(2)}`
  if (v.length <= 8) return `${v.slice(0, 2)}.${v.slice(2, 5)}.${v.slice(5)}`
  if (v.length <= 12) return `${v.slice(0, 2)}.${v.slice(2, 5)}.${v.slice(5, 8)}/${v.slice(8)}`
  return `${v.slice(0, 2)}.${v.slice(2, 5)}.${v.slice(5, 8)}/${v.slice(8, 12)}-${v.slice(12)}`
}

export const formatPhone = (value: string) => {
  const v = value.replace(/\\D/g, "").slice(0, 11)
  if (v.length <= 2) return v ? `(${v}` : ""
  if (v.length <= 6) return `(${v.slice(0, 2)}) ${v.slice(2)}`
  if (v.length <= 10) return `(${v.slice(0, 2)}) ${v.slice(2, 6)}-${v.slice(6)}`
  return `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`
}

// Convert format +5511999999999 to E.164 without exposing masks globally.
export const normalizeToE164 = (phone: string, countryCode = "55") => {
  const digits = phone.replace(/\\D/g, "")
  if (!digits) return ""
  // If it already has country code, don't duplicate
  if (digits.startsWith(countryCode) && digits.length >= 12) {
    return `+${digits}`
  }
  return `+${countryCode}${digits}`
}

export const extractOnlyNumbers = (val: string) => val.replace(/\\D/g, "")


export const formatCEP = (value: string) => {
  const v = value.replace(/\D/g, "").slice(0, 8)
  if (v.length <= 5) return v
  return `${v.slice(0, 5)}-${v.slice(5)}`
}
