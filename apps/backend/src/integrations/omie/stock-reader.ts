import { OmieClient, OmieClientError } from "./client"
import type { OmieRecord, OmieStockRecord } from "./types"

const asRecord = (value: unknown): OmieRecord | null =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as OmieRecord)
    : null

const numberValue = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null
  const number = typeof value === "number" ? value : Number(String(value).replace(",", "."))
  return Number.isFinite(number) ? number : null
}

const stringValue = (value: unknown): string | null => {
  if (typeof value === "string" && value.trim()) return value.trim()
  if (typeof value === "number" && Number.isFinite(value)) return String(value)
  return null
}

const extractRows = (response: unknown): OmieRecord[] => {
  if (Array.isArray(response)) return response.filter((value): value is OmieRecord => asRecord(value) !== null)
  const record = asRecord(response)
  const rows = record?.produtos
  return Array.isArray(rows) ? rows.filter((value): value is OmieRecord => asRecord(value) !== null) : []
}

export const normalizeOmieStock = (record: OmieRecord): OmieStockRecord => {
  const rawPhysical = record.fisico
  const physical = numberValue(rawPhysical)
  const state = physical === null
    ? rawPhysical === null || rawPhysical === undefined || rawPhysical === "" ? "MISSING" : "INVALID"
    : physical < 0 ? "INVALID" : physical === 0 ? "REAL_ZERO" : "REAL_POSITIVE"

  return {
    externalId: stringValue(record.nCodProd),
    sku: stringValue(record.cCodigo),
    internalCode: stringValue(record.cCodInt),
    locationCode: stringValue(record.codigo_local_estoque),
    physical: state === "INVALID" || state === "MISSING" ? null : physical,
    reserved: numberValue(record.reservado),
    balance: numberValue(record.nSaldo),
    pending: numberValue(record.nPendente),
    state,
  }
}

export interface OmieStockReaderOptions {
  pageSize?: number
  maxPages?: number
  positionDate?: string
  locationCode?: number
}

export class OmieStockReader {
  constructor(private readonly client: OmieClient) {}

  async readPage(page: number, options: OmieStockReaderOptions = {}): Promise<{ records: OmieStockRecord[]; page: number; hasMore: boolean }> {
    const pageSize = options.pageSize ?? 50
    const response = await this.client.request<unknown>("ListarPosEstoque", {
      nPagina: page,
      nRegPorPagina: pageSize,
      dDataPosicao: options.positionDate,
      cExibeTodos: "S",
      ...(options.locationCode === undefined ? {} : { codigo_local_estoque: options.locationCode }),
    })
    const record = asRecord(response)
    const rows = extractRows(response)
    const totalPages = numberValue(record?.nTotPaginas)
    return {
      records: rows.map(normalizeOmieStock),
      page,
      hasMore: totalPages !== null ? page < totalPages : rows.length >= pageSize,
    }
  }

  async readAll(options: OmieStockReaderOptions = {}): Promise<OmieStockRecord[]> {
    const pageSize = options.pageSize ?? 50
    const maxPages = options.maxPages ?? 200
    const records: OmieStockRecord[] = []
    const signatures = new Set<string>()
    for (let page = 1; page <= maxPages; page += 1) {
      const result = await this.readPage(page, { ...options, pageSize })
      const signature = JSON.stringify(result.records)
      if (result.records.length > 0 && signatures.has(signature)) {
        throw new OmieClientError({ code: "INVALID_RESPONSE", operation: "ListarPosEstoque", retryable: false })
      }
      signatures.add(signature)
      records.push(...result.records)
      if (!result.hasMore || result.records.length === 0) return records
    }
    throw new OmieClientError({ code: "INVALID_RESPONSE", operation: "ListarPosEstoque", retryable: false })
  }
}
