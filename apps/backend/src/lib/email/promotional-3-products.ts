export type PromotionalProduct = {
  name: string
  variant: string
  imageUrl: string
  productUrl: string
  normalPrice: number
  promotionalPrice: number
  discountPercent: number
}
const escapeHtml = (value: string): string => value
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/\"/g, "&quot;")
  .replace(/'/g, "&#39;")

const publicHttpsUrl = (value: string): string => {
  let url: URL
  try { url = new URL(value) } catch { throw new Error("Promotional image or product URL is invalid") }
  if (url.protocol !== "https:") throw new Error("Promotional URLs must use HTTPS")
  if (url.username || url.password || url.hash) throw new Error("Promotional URL contains forbidden credentials or fragments")
  return url.toString()
}

const money = (value: number): string => new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
}).format(value)

export const renderPromotional3Products = (products: PromotionalProduct[]): string => {
  if (products.length !== 3) throw new Error("Exactly three products are required")
  const safe = products.map((product) => {
    if (!product.name.trim() || !product.variant.trim()) throw new Error("Product name and variant are required")
    if (!Number.isFinite(product.normalPrice) || !Number.isFinite(product.promotionalPrice) || product.normalPrice <= 0 || product.promotionalPrice <= 0 || product.promotionalPrice >= product.normalPrice) {
      throw new Error("A valid promotional price is required")
    }
    if (!Number.isFinite(product.discountPercent) || product.discountPercent <= 0 || product.discountPercent >= 100) throw new Error("Discount is invalid")
    return {
      ...product,
      name: escapeHtml(product.name),
      variant: escapeHtml(product.variant),
      imageUrl: escapeHtml(publicHttpsUrl(product.imageUrl)),
      productUrl: escapeHtml(publicHttpsUrl(product.productUrl)),
      normal: escapeHtml(money(product.normalPrice)),
      promo: escapeHtml(money(product.promotionalPrice)),
      discount: escapeHtml(`${Math.round(product.discountPercent)}%`),
    }
  })
  const card = (product: typeof safe[number], featured = false) => `
    <article class="product ${featured ? "featured" : ""}">
      <a href="${product.productUrl}" style="text-decoration:none;color:inherit;display:block">
        <img src="${product.imageUrl}" alt="${product.name}" width="${featured ? 560 : 260}" height="${featured ? 320 : 220}" style="width:100%;height:auto;display:block;object-fit:contain;background:#f4f7fa;border-radius:12px">
        <p class="eyebrow">${product.variant}</p><h2>${product.name}</h2>
        <p class="prices"><s>${product.normal}</s> <strong>${product.promo}</strong> <span class="discount">-${product.discount}</span></p>
        <span class="button">Ver produto</span>
      </a>
    </article>`

  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Ofertas FriggaFrio</title><style>body{margin:0;background:#f4f7fa;color:#102a43;font-family:Arial,Helvetica,sans-serif}.wrap{max-width:640px;margin:auto;background:#fff}.header{padding:28px 24px;background:#0f2f57;color:#fff}.content{padding:24px}.hero{background:#e7f3fb;padding:18px;border-radius:14px;margin-bottom:18px}.product{border:1px solid #d8e3ed;border-radius:14px;padding:14px;margin-bottom:16px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.eyebrow{font-size:12px;color:#1268b3;text-transform:uppercase;letter-spacing:.08em;font-weight:bold}.product h2{font-size:20px;margin:6px 0}.prices{font-size:15px}.prices strong{color:#0f6a3d;font-size:19px}.discount{color:#a82828;font-weight:bold}.button{display:inline-block;padding:11px 16px;border-radius:8px;background:#1268b3;color:#fff;font-weight:bold}.footer{padding:22px 24px;color:#5b7083;font-size:12px;border-top:1px solid #e1e9f0}@media(max-width:520px){.grid{display:block}.product h2{font-size:18px}}</style></head><body><main class="wrap"><header class="header"><strong style="font-size:24px">FriggaFrio</strong><p style="margin:8px 0 0;color:#cfe5fb">Ofertas selecionadas para você, {{contact.first_name | default: "cliente"}}.</p></header><section class="content"><div class="hero"><h1 style="margin:0 0 8px">Condições especiais por tempo limitado</h1><p style="margin:0">Confira produtos elegíveis enquanto durarem as condições informadas.</p></div>${card(safe[0], true)}<div class="grid">${card(safe[1])}${card(safe[2])}</div><p style="font-size:12px;color:#5b7083">Valores, disponibilidade e validade são os registrados pela FriggaFrio no momento da preparação.</p></section><footer class="footer">Você está recebendo este e-mail porque autorizou novidades e promoções da FriggaFrio. <a href="{{RESEND_UNSUBSCRIBE_URL}}">Cancelar inscrição</a>.</footer></main></body></html>`
}
