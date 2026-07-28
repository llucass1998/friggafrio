export function normalizeHeaderString(header: string): string {
  if (typeof header !== "string") return ""
  return header
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // Remove acentos
    .replace(/\s+/g, " ") // Colapsa espaços duplos
}

export type RequiredColumnsMap = {
  codigoKey: string | null
  descricaoKey: string | null
  unidadeKey: string | null
  quantidadeKey: string | null
  valorKey: string | null
}

export function mapRequiredColumns(headers: string[]): RequiredColumnsMap {
  const map: RequiredColumnsMap = {
    codigoKey: null,
    descricaoKey: null,
    unidadeKey: null,
    quantidadeKey: null,
    valorKey: null,
  }

  for (const header of headers) {
    const normalized = normalizeHeaderString(header)

    if (normalized === "CODIGO") {
      if (map.codigoKey) throw new Error("Duplicate CODIGO column")
      map.codigoKey = header
    } else if (normalized === "DESCRICAO") {
      if (map.descricaoKey) throw new Error("Duplicate DESCRICAO column")
      map.descricaoKey = header
    } else if (normalized === "UNIDADE") {
      if (map.unidadeKey) throw new Error("Duplicate UNIDADE column")
      map.unidadeKey = header
    } else if (normalized === "QUANTIDADE") {
      if (map.quantidadeKey) throw new Error("Duplicate QUANTIDADE column")
      map.quantidadeKey = header
    } else if (normalized === "VALOR") {
      if (map.valorKey) throw new Error("Duplicate VALOR column")
      map.valorKey = header
    }
  }

  return map
}
