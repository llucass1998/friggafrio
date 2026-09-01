import { renderPromotional3Products } from "./promotional-3-products"

const product = (n: number) => ({ name: `Produto ${n}`, variant: "Padrão", imageUrl: `https://cdn.example.com/${n}.jpg`, productUrl: `https://friggafrio.istigestao.com.br/br/products/p-${n}`, normalPrice: 100, promotionalPrice: 80, discountPercent: 20 })

describe("promotional three-product renderer", () => {
  it("renders exactly three escaped products and keeps only native Resend variables", () => {
    const html = renderPromotional3Products([product(1), { ...product(2), name: "<script>" }, product(3)])
    expect(html).toContain("{{contact.first_name")
    expect(html).toContain("{{RESEND_UNSUBSCRIBE_URL}}")
    expect(html).toContain("&lt;script&gt;")
    expect(html).not.toContain("{{PRODUCT")
  })

  it("rejects unsafe URLs and quantities other than three", () => {
    expect(() => renderPromotional3Products([product(1), product(2)])).toThrow("Exactly three")
    expect(() => renderPromotional3Products([{ ...product(1), imageUrl: "http://localhost/a.jpg" }, product(2), product(3)])).toThrow("HTTPS")
    expect(() => renderPromotional3Products([{ ...product(1), promotionalPrice: 110 }, product(2), product(3)])).toThrow("promotional price")
  })
})
