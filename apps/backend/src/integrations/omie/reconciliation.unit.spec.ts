import { buildOmieReconciliation, omieFingerprint, stableOmieHandle } from "./reconciliation"
import type { NormalizedProduct } from "./types"

const product = (externalId = "10", sku = "SKU-10"): NormalizedProduct => ({
  externalId, title: "Produto", handle: null, category: null, tags: [], image: null, source: "omie",
  approval: { product: false, price: false, inventory: false, fiscal: false, shipping: false }, commercialStatus: "QUOTE_ONLY",
  variants: [{ externalId, title: "Produto", sku, weight: null, weightUnit: null, shippingProfile: null, fiscalCode: null,
    price: { amount: 12.5, currency: null, sourceField: "preco_venda" }, inventory: { quantity: 0, location: null, sourceField: "saldo_estoque" }, commercialStatus: "QUOTE_ONLY" }],
})

describe("Omie reconciliation", () => {
  it("creates once and becomes a no-op by fingerprint", () => {
    const incoming = product()
    expect(buildOmieReconciliation([incoming], [])[0].action).toBe("create")
    expect(buildOmieReconciliation([incoming], [{ id: "prod_1", externalId: "10", sku: "SKU-10", fingerprint: omieFingerprint(incoming) }])[0].action).toBe("no-op")
  })
  it("fails closed on drift and ambiguous mappings", () => {
    expect(buildOmieReconciliation([product()], [{ id: "prod_1", externalId: "10", sku: "SKU-10", fingerprint: "old" }])[0].action).toBe("conflict")
    expect(buildOmieReconciliation([product(), product() ], [])[1].action).toBe("conflict")
  })
  it("reconciles QUOTE_ONLY visibility while preserving the purchase block", () => {
    const incoming = product()
    expect(buildOmieReconciliation([incoming], [{
      id: "prod_1", externalId: "10", sku: "SKU-10", fingerprint: omieFingerprint(incoming),
      status: "draft", storefrontVisible: false, purchaseEnabled: false, commercialStatus: "QUOTE_ONLY",
    }])[0].action).toBe("update")
    expect(buildOmieReconciliation([incoming], [{
      id: "prod_1", externalId: "10", sku: "SKU-10", fingerprint: omieFingerprint(incoming),
      status: "published", storefrontVisible: true, purchaseEnabled: false, commercialStatus: "QUOTE_ONLY",
    }])[0].action).toBe("no-op")
  })
  it("builds deterministic collision-resistant handles", () => {
    expect(stableOmieHandle("ABC 123")).toBe(stableOmieHandle("ABC 123"))
    expect(stableOmieHandle("ABC 123")).not.toBe(stableOmieHandle("ABC-123"))
  })
})
