export function isValidCpf(cpf: string): boolean {
  cpf = cpf.replace(/[^\d]+/g, "")
  if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false
  const cpfArray = cpf.split("").map(Number)
  const rest = (count: number) =>
    ((cpfArray
      .slice(0, count - 12)
      .reduce((sum, el, index) => sum + el * (count - index), 0) *
      10) %
      11) %
    10
  return rest(10) === cpfArray[9] && rest(11) === cpfArray[10]
}

export function isValidCnpj(cnpj: string): boolean {
  cnpj = cnpj.replace(/[^\d]+/g, "")
  if (cnpj.length !== 14 || !!cnpj.match(/(\d)\1{13}/)) return false
  const cnpjArray = cnpj.split("").map(Number)
  const calc = (x: number) => {
    const slice = cnpjArray.slice(0, x)
    let factor = x - 7
    let sum = 0
    for (let i = x; i >= 1; i--) {
      const n = slice[x - i]
      sum += n * factor--
      if (factor < 2) factor = 9
    }
    const result = 11 - (sum % 11)
    return result > 9 ? 0 : result
  }
  return calc(12) === cnpjArray[12] && calc(13) === cnpjArray[13]
}

export function normalizeDocument(document: string): string {
  return document.replace(/[^\d]+/g, "")
}
