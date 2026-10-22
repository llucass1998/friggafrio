import { config } from "./product-quality-checklist"
import { config as omieCodeConfig } from "./omie-product-code"

describe("Product quality widgets configuration", () => {
  it("product-quality-checklist config targets product details sidebar", () => {
    expect(config.id).toBe("friggafrio.product-quality-checklist")
    const zones = Array.isArray(config.zone) ? config.zone : [config.zone]
    expect(zones).toContain("product.details.side")
  })

  it("omie-product-code config targets product details before section", () => {
    expect(omieCodeConfig.id).toBe("friggafrio.omie-product-code")
    const zones = Array.isArray(omieCodeConfig.zone) ? omieCodeConfig.zone : [omieCodeConfig.zone]
    expect(zones).toContain("product.details")
  })
})
