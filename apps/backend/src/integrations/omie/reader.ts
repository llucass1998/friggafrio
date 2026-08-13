import { OmieClient, OmieClientError } from "./client"
import { OmieCatalogPage, OmieProductRecord, OmieRecord } from "./types"

const PRODUCT_KEYS = [
  "produto_servico_cadastro",
  "produtos",
  "products",
  "items",
] as const

const asRecord = (value: unknown): OmieRecord | null =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as OmieRecord)
    : null

const asProducts = (value: unknown): OmieProductRecord[] => {
  if (!Array.isArray(value)) {
    return []
  }
  return value.filter((item): item is OmieProductRecord => asRecord(item) !== null)
}

const extractProducts = (response: unknown): OmieProductRecord[] => {
  if (Array.isArray(response)) {
    return asProducts(response)
  }

  const record = asRecord(response)
  if (!record) {
    return []
  }

  for (const key of PRODUCT_KEYS) {
    const products = asProducts(record[key])
    if (products.length > 0) {
      return products
    }
  }

  return []
}

const responseHasMore = (response: unknown, page: number, count: number, pageSize: number): boolean => {
  const record = asRecord(response)
  const total = record?.total_de_registros ?? record?.total
  if (typeof total === "number" && Number.isFinite(total)) {
    return page * pageSize < total
  }

  return count >= pageSize
}

export interface OmieCatalogReaderOptions {
  pageSize?: number
  maxPages?: number
}

export class OmieCatalogReader {
  constructor(private readonly client: OmieClient) {}

  async readPage(page: number, pageSize: number): Promise<OmieCatalogPage> {
    const response = await this.client.request<unknown>("ListarProdutos", {
      pagina: page,
      registros_por_pagina: pageSize,
    })
    const products = extractProducts(response)

    return {
      products,
      page,
      pageSize,
      hasMore: responseHasMore(response, page, products.length, pageSize),
    }
  }

  async readAll(options: OmieCatalogReaderOptions = {}): Promise<OmieProductRecord[]> {
    const pageSize = options.pageSize ?? 100
    const maxPages = options.maxPages ?? 100
    const products: OmieProductRecord[] = []
    const pageSignatures = new Set<string>()

    for (let page = 1; page <= maxPages; page += 1) {
      const result = await this.readPage(page, pageSize)
      const signature = JSON.stringify(result.products)
      if (result.products.length > 0 && pageSignatures.has(signature)) {
        throw new OmieClientError({
          code: "INVALID_RESPONSE",
          operation: "ListarProdutos",
          retryable: false,
        })
      }
      pageSignatures.add(signature)
      products.push(...result.products)
      if (!result.hasMore || result.products.length === 0) {
        return products
      }
    }

    throw new OmieClientError({
      code: "INVALID_RESPONSE",
      operation: "ListarProdutos",
      retryable: false,
    })
  }
}
