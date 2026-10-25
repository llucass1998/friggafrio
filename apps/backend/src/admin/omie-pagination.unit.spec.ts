import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { runInNewContext } from "node:vm"

describe("Regressão da paginação DPGS no Dashboard patch", () => {
  const patch = readFileSync(resolve(__dirname, "../../../../patches/@medusajs__dashboard@2.18.0.patch"), "utf8")
  it("inclui filtros e offset na chave de cada consulta de códigos", () => {
    expect(patch.match(/queryKey: \["frigga-omie-products", privateLinksQuery.data\?\.product_ids, searchParams\]/g)).toHaveLength(2)
    expect(patch.match(/offset: searchParams.offset \?\? 0/g)).toHaveLength(2)
    expect(patch).not.toContain("limit: PAGE_SIZE, offset: 0, is_giftcard")
  })
  it("envia offsets distintos ao avançar e voltar preservando filtros", () => {
    const expression = patch.split("\n").find((line) => line.startsWith("+    queryFn: () => sdk.admin.product.list({ ...searchParams"))!.slice(1).trim().replace(/,$/, "")
    const calls: Array<Record<string, unknown>> = []
    for (const offset of [0,20,40,20]) {
      const query = runInNewContext(`({${expression}})`, {
        sdk: { admin: { product: { list: (params: Record<string, unknown>) => calls.push(params) } } },
        searchParams: { offset, q: "DPGS", status: ["published"] },
        PAGE_SIZE: 20, privateLinksQuery: { data: { product_ids: ["p1", "p2"] } },
      })
      query.queryFn()
    }
    expect(calls.map((call) => call.offset)).toEqual([0,20,40,20])
    expect(calls.every((call) => call.q === undefined && call.limit === 20)).toBe(true)
    expect(calls[1].status).toEqual(["published"])
  })
  it("preserva a página vazia da busca por código, sem cair na lista genérica", () => {
    expect(patch).not.toContain("linkedProductQuery.data?.products?.length ?")
    expect(patch.match(/linkedProductQuery.isEnabled \? linkedProductQuery.data\?\.count \?\? 0 : count/g)).toHaveLength(2)
  })
})
