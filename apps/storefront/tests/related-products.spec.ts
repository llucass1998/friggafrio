import { expect, test } from "@playwright/test"

const backendUrl = "http://127.0.0.1:9000"
const publishableKey = process.env.VITE_MEDUSA_PUBLISHABLE_KEY?.trim()
  || "pk_99c64d5a87e0109049ed7333c05d7160483814d28b14d8a0c1c4f9aa13773cd1"
const regionId = "reg_01KZRPFF8N4VRAKJXTMX0NQGBT"
const fields = "id,title,handle,thumbnail,metadata,*categories,*type,*collection,*tags,*images,*variants.calculated_price,+variants.inventory_quantity,+variants.manage_inventory,+variants.allow_backorder,*variants.options"

test.describe.configure({ mode: "serial" })

test("contextual related products stay diverse across ten real PDPs", async ({ page, request }) => {
  const candidates: any[] = []
  for (let offset = 0; offset < 1200; offset += 100) {
    const response = await request.get(`${backendUrl}/store/products?limit=100&offset=${offset}&region_id=${regionId}&fields=${encodeURIComponent(fields)}`, {
      headers: { "x-publishable-api-key": publishableKey },
    })
    expect(response.ok()).toBe(true)
    const payload = await response.json()
    candidates.push(...payload.products)
    const categoryCount = new Set(candidates.map((product) => product.categories?.[0]?.id).filter(Boolean)).size
    if (categoryCount >= 10) break
    if (payload.products.length < 100) break
  }
  const sources = candidates.filter((product: { categories?: Array<{ id?: string }> }) => product.categories?.[0]?.id).reduce((result: any[], product: any) => {
    const category = product.categories[0].id
    if (!result.some((item) => item.categories?.[0]?.id === category)) result.push(product)
    return result
  }, []).slice(0, 10)
  expect(sources).toHaveLength(10)

  const relatedSets = new Set<string>()
  const unexpectedConsoleErrors: string[] = []
  const pageErrors: string[] = []
  const forbiddenRequests: string[] = []
  page.on("console", (message) => {
    if (message.type() === "error" && !message.text().includes("401 (Unauthorized)")) {
      unexpectedConsoleErrors.push(message.text())
    }
  })
  page.on("pageerror", (error) => pageErrors.push(error.message))
  page.on("request", (networkRequest) => {
    const url = networkRequest.url()
    if (/mercadopago|googleapis\.com\/maps|routes\.googleapis\.com/i.test(url)) forbiddenRequests.push(url)
  })

  for (const source of sources) {
    await page.goto(`/br/products/${source.handle}`, { waitUntil: "domcontentloaded" })
    const section = page.getByRole("region", { name: "Produtos relacionados" })
    await expect(section).toBeVisible()
    const links = await section.locator('a[href*="/products/"]').evaluateAll((anchors) => anchors.map((anchor) => anchor.getAttribute("href") || ""))
    const relatedIds = links.map((href) => href.split("/products/")[1]).filter(Boolean)
    expect(relatedIds).toHaveLength(new Set(relatedIds).size)
    expect(relatedIds.some((id) => id === source.handle)).toBe(false)
    relatedSets.add(relatedIds.join(","))
  }

  expect(relatedSets.size).toBeGreaterThanOrEqual(5)
  expect(unexpectedConsoleErrors).toEqual([])
  expect(pageErrors).toEqual([])
  expect(forbiddenRequests).toEqual([])
})
