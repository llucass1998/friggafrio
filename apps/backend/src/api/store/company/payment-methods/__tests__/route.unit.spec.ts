import { GET, POST } from "../route"
import { MedusaError } from "@medusajs/framework/utils"

jest.mock("../../../../../workflows/create-company-account-holder", () => ({
  createCompanyAccountHolderWorkflow: () => ({
    run: jest.fn().mockImplementation((...args) => {
      return (globalThis as any).__mockRun(...args)
    })
  })
}))

jest.mock("../../../../../utils/is-stripe-configured", () => ({
  isStripeConfigured: () => (globalThis as any).__mockIsStripeConfigured ?? false
}))

describe("Payment Methods Route", () => {
  let mockGraph: jest.Mock
  let mockResolve: jest.Mock
  let mockRun: jest.Mock
  let req: any
  let res: any

  beforeEach(() => {
    mockGraph = jest.fn()
    mockRun = jest.fn()

    mockResolve = jest.fn().mockImplementation((key) => {
      if (key === "query") return { graph: mockGraph }
      if (key === "payment") return { listPaymentMethods: jest.fn().mockResolvedValue([{ id: "pm_123" }]) }
      return {}
    })

    req = {
      auth_context: { actor_id: "cus_123" },
      scope: { resolve: mockResolve },
      query: {},
    }

    res = {
      json: jest.fn(),
    }
  })

  describe("GET", () => {
    it("1. Rejeita requisição sem autenticação", async () => {
      req.auth_context = {}
      await expect(GET(req, res)).rejects.toThrowError(MedusaError)
      await expect(GET(req, res)).rejects.toThrow("Unauthorized")
    })

    it("2. Lança erro se customer for inexistente", async () => {
      mockGraph.mockResolvedValueOnce({ data: [] })
      await expect(GET(req, res)).rejects.toThrow("Customer not found")
    })

    it("3. Lança erro se funcionário sem permissão administrativa", async () => {
      mockGraph.mockResolvedValueOnce({
        data: [{ id: "cus_123", employee: { is_admin: false, company: { id: "comp_1" } } }],
      })
      await expect(GET(req, res)).rejects.toThrow("Only company admins can manage payment methods")
    })

    it("4. Lança erro se empresa inexistente", async () => {
      mockGraph.mockResolvedValueOnce({
        data: [{ id: "cus_123", employee: { is_admin: true, company: null } }],
      })
      await expect(GET(req, res)).rejects.toThrow("Company not found")
    })

    it("5. Retorna vazio se account holder ausente", async () => {
      mockGraph.mockResolvedValueOnce({
        data: [{ id: "cus_123", employee: { is_admin: true, company: { id: "comp_1", name: "C", email: "e" } } }],
      })
      mockGraph.mockResolvedValueOnce({
        data: [{ id: "comp_1", account_holder: null }],
      })
      await GET(req, res)
      expect(res.json).toHaveBeenCalledWith({ payment_methods: [] })
    })

    it("6. Retorna vazio se account holder não tiver data.id", async () => {
      mockGraph.mockResolvedValueOnce({
        data: [{ id: "cus_123", employee: { is_admin: true, company: { id: "comp_1", name: "C", email: "e" } } }],
      })
      mockGraph.mockResolvedValueOnce({
        data: [{ id: "comp_1", account_holder: { id: "ah_123", provider_id: "stripe" } }],
      })
      await GET(req, res)
      expect(res.json).toHaveBeenCalledWith({ payment_methods: [] })
    })

    it("7. Retorna vazio se account holder não tiver provider_id (fail-closed)", async () => {
      mockGraph.mockResolvedValueOnce({
        data: [{ id: "cus_123", employee: { is_admin: true, company: { id: "comp_1", name: "C", email: "e" } } }],
      })
      mockGraph.mockResolvedValueOnce({
        data: [{ id: "comp_1", account_holder: { id: "ah_123", data: { id: "stripe_cus" } } }],
      })
      await GET(req, res)
      expect(res.json).toHaveBeenCalledWith({ payment_methods: [] })
    })

    it("8, 9, 10. Ignora req.query totalmente, não é lido no GET fail-closed", async () => {
      mockGraph.mockImplementation((q) => {
        if (q.entity === "customer") return Promise.resolve({ data: [{ id: "cus_123", employee: { is_admin: true, company: { id: "comp_1", name: "C", email: "e" } } }] })
        if (q.entity === "company") return Promise.resolve({ data: [{ id: "comp_1", account_holder: { id: "ah_123", provider_id: "pp_stripe_stripe", data: { id: "stripe_cus" } } }] })
        return Promise.resolve({ data: [] })
      })

      req.query = { provider_id: "arbitrary_provider" }
      await GET(req, res)

      req.query = { provider_id: ["array", "of", "providers"] }
      await GET(req, res)

      req.query = {}
      await GET(req, res)

      expect(res.json).toHaveBeenCalledTimes(3)
    })

    it("11. Sucesso se account holder válido", async () => {
      mockGraph.mockResolvedValueOnce({
        data: [{ id: "cus_123", employee: { is_admin: true, company: { id: "comp_1", name: "C", email: "e" } } }],
      })
      mockGraph.mockResolvedValueOnce({
        data: [{ id: "comp_1", account_holder: { id: "ah_123", provider_id: "pp_stripe_stripe", data: { id: "stripe_cus" } } }],
      })
      await GET(req, res)
      expect(res.json).toHaveBeenCalledWith({ payment_methods: [{ id: "pm_123" }] })
    })

    it("14. Serviço de pagamento não sendo chamado nos casos fail-closed", async () => {
      mockGraph.mockResolvedValueOnce({
        data: [{ id: "cus_123", employee: { is_admin: true, company: { id: "comp_1", name: "C", email: "e" } } }],
      })
      mockGraph.mockResolvedValueOnce({
        data: [{ id: "comp_1", account_holder: { id: "ah_123", data: { id: "stripe_cus" } } }], // Missing provider_id
      })

      const paymentMock = req.scope.resolve("payment")
      paymentMock.listPaymentMethods.mockClear()

      await GET(req, res)
      expect(paymentMock.listPaymentMethods).not.toHaveBeenCalled()
      expect(res.json).toHaveBeenCalledWith({ payment_methods: [] })
    })
  })

  describe("POST", () => {
    afterEach(() => {
      (globalThis as any).__mockIsStripeConfigured = undefined
      ;(globalThis as any).__mockRun = undefined
    })

    it("12. Lança erro se listPaymentMethods ausente ou Stripe desabilitado", async () => {
      mockGraph.mockResolvedValueOnce({
        data: [{ id: "cus_123", employee: { is_admin: true, company: { id: "comp_1", name: "C", email: "e" } } }],
      })
      mockGraph.mockResolvedValueOnce({
        data: [{ id: "comp_1", account_holder: null }],
      })

      ;(globalThis as any).__mockIsStripeConfigured = false

      await expect(POST(req, res)).rejects.toThrow("Saved payment methods are not available. Stripe is not configured.")
    })

    it("13. Workflow retornando estrutura inválida", async () => {
      mockGraph.mockResolvedValueOnce({
        data: [{ id: "cus_123", employee: { is_admin: true, company: { id: "comp_1", name: "C", email: "e" } } }],
      })
      mockGraph.mockResolvedValueOnce({
        data: [{ id: "comp_1", account_holder: null }],
      })

      ;(globalThis as any).__mockIsStripeConfigured = true
      ;(globalThis as any).__mockRun = jest.fn().mockResolvedValueOnce({ result: { invalid: "structure" } })

      await expect(POST(req, res)).rejects.toThrow("Workflow returned an invalid account holder structure")
    })
  })
})
