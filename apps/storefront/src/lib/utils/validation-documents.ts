export function isValidCpf(value: string): boolean {
  const cpf = value.replace(/\D/g, "")
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false
  const digits = cpf.split("").map(Number)
  const check = (length: number): number => {
    const sum = digits.slice(0, length).reduce((total, digit, index) => total + digit * (length + 1 - index), 0)
    const remainder = (sum * 10) % 11
    return remainder === 10 ? 0 : remainder
  }
  return check(9) === digits[9] && check(10) === digits[10]
}

export function isValidCnpj(value: string): boolean {
  const cnpj = value.replace(/\D/g, "")
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false
  const digits = cnpj.split("").map(Number)
  const check = (length: number): number => {
    let weight = length === 12 ? 5 : 6
    const sum = digits.slice(0, length).reduce((total, digit) => {
      const result = total + digit * weight
      weight = weight === 2 ? 9 : weight - 1
      return result
    }, 0)
    const remainder = 11 - (sum % 11)
    return remainder >= 10 ? 0 : remainder
  }
  return check(12) === digits[12] && check(13) === digits[13]
}
