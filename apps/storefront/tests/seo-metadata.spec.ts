import { expect, test } from "@playwright/test"

const backendUrl = "http://127.0.0.1:9000"
const publishableKey = process.env.VITE_MEDUSA_PUBLISHABLE_KEY?.trim()
  || "pk_99c64d5a87e0109049ed7333c05d7160483814d28b14d8a0c1c4f9aa13773cd1"
const regionId = "reg_01KZRPFF8N4VRAKJXTMX0NQGBT"

function jsonLd(page: import("@playwright/test").Page) {
  return page.locator('script[type="application/ld+json"]').evaluateAll((scripts) => scripts.map((script) => {
    const text = script.textContent?.trim() || ""
    return JSON.parse(text) as Record<string, unknown>
  }))
}

test.describe("SEO técnico local", () => {
  test("public routes expose unique metadata and absolute canonicals", async ({ page }) => {
    for (const path of ["/br", "/br/store", "/br/categories", "/nossa-loja", "/ajuda", "/termos", "/privacidade"]) {
      await page.goto(path, { waitUntil: "domcontentloaded" })
      await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR")
      const title = await page.locator("title").textContent()
      expect(title?.trim().length).toBeGreaterThan(0)
      await expect(page.locator('meta[name="description"]')).toHaveCount(1)
      const canonical = await page.locator('link[rel="canonical"]').getAttribute("href")
      expect(canonical).toMatch(/^https:\/\/friggafrio\.com\.br\//)
      await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute("content", "pt_BR")
    }
  })

  test("private routes are explicitly noindex and absent from sitemap", async ({ page, request }) => {
    for (const path of ["/br/cart", "/br/checkout", "/br/favorites", "/br/account/login", "/br/account/orders"]) {
      await page.goto(path, { waitUntil: "domcontentloaded" })
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex,nofollow")
    }
    const sitemap = await request.get("/sitemap.xml")
    expect(sitemap.ok()).toBe(true)
    const sitemapText = await sitemap.text()
    expect(sitemapText).toContain("https://friggafrio.com.br/br")
    expect(sitemapText).not.toContain("/checkout")
    expect(sitemapText).not.toContain("/account/")
  })

  test("JSON-LD remains parseable and uses factual product offers", async ({ page, request }) => {
    const response = await request.get(
      `${backendUrl}/store/products?limit=10&region_id=${regionId}&fields=id,title,handle,*images,*variants.calculated_price`,
      { headers: { "x-publishable-api-key": publishableKey } },
    )
    expect(response.ok()).toBe(true)
    const products = (await response.json()).products as Array<{ handle: string }>
    expect(products[0]?.handle).toBeTruthy()

    await page.goto(`/br/products/${products[0].handle}`, { waitUntil: "domcontentloaded" })
    const data = await jsonLd(page)
    const product = data.find((entry) => entry["@type"] === "Product")
    const breadcrumbs = data.find((entry) => entry["@type"] === "BreadcrumbList")
    expect(product).toBeTruthy()
    expect(breadcrumbs).toBeTruthy()
    expect(product?.url).toMatch(/^https:\/\/friggafrio\.com\.br\/br\/products\//)
    if (product?.offers) {
      const offer = product.offers as Record<string, unknown>
      expect(typeof offer.price).toBe("string")
      expect(offer.priceCurrency).toBe("BRL")
    }
  })
})
