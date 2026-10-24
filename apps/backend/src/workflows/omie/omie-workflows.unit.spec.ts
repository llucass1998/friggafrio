import { exportOrder } from "./export-order"
import { syncCatalog } from "./sync-catalog"
import { syncInventory } from "./sync-inventory"
import { processInvoice } from "./process-invoice"

const container = { resolve: jest.fn(() => { throw new Error("Dependência inesperada") }) }
describe("Gates dos workflows Omie", () => {
  const env = { ...process.env }
  afterEach(() => { process.env = { ...env }; jest.clearAllMocks() })
  it("não consulta serviços nem escreve sem credenciais", async () => {
    delete process.env.OMIE_APP_KEY
    delete process.env.OMIE_APP_SECRET
    expect(await exportOrder({ orderId: "order_1" }, container as never)).toMatchObject({ exported: false })
    expect(await syncCatalog({}, container as never)).toMatchObject({ skipped: true })
    expect(await syncInventory({}, container as never)).toMatchObject({ skipped: true })
    expect(container.resolve).not.toHaveBeenCalled()
  })
  it("não força writesEnabled com credenciais válidas e gate desativado", async () => {
    process.env.OMIE_APP_KEY = "fixture-key"
    process.env.OMIE_APP_SECRET = "fixture-secret"
    delete process.env.OMIE_FISCAL_WRITES_ENABLED
    expect(await exportOrder({ orderId: "order_1" }, container as never)).toEqual({ exported: false, reason: "writes_disabled" })
    expect(container.resolve).not.toHaveBeenCalled()
  })
  it("bloqueia chave NF-e inválida antes de qualquer serviço", async () => {
    await expect(processInvoice({ chave_nfe: "123" }, container as never)).rejects.toThrow("OMIE_INVALID_NFE_KEY")
    expect(container.resolve).not.toHaveBeenCalled()
  })
  it("bloqueia estoque sem mapeamento explícito de local", async () => {
    process.env.OMIE_APP_KEY = "fixture-key"
    process.env.OMIE_APP_SECRET = "fixture-secret"
    delete process.env.OMIE_STOCK_LOCATION_MAP
    await expect(syncInventory({}, container as never)).rejects.toThrow("OMIE_STOCK_LOCATION_MAP_REQUIRED")
  })
})
