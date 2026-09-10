import { test, expect, type Page } from "@playwright/test"

const productHandle = "omie-1988730838-57a3f2702fe2"

async function useHomeCarouselFixture(page: Page) {
  await page.route("**/store/products**", async (route) => {
    const response = await route.fetch()
    const payload = await response.json()
    const requestUrl = route.request().url()
    if (!requestUrl.includes("limit=500") || !payload.products?.length) {
      await route.fulfill({ response, body: JSON.stringify(payload) })
      return
    }
    const source = payload.products.slice(0, 8)
    payload.products = source.map((product: Record<string, any>, index: number) => ({
      ...product,
      id: `${String(product.id)}-carousel-${index}`,
      handle: `${String(product.handle)}-carousel-${index}`,
      title: `${String(product.title)} ${index + 1}`,
      // Make the isolated fixture commercially valid and category-aware so
      // the shelf selection is deterministic and has genuine overflow.
      metadata: { ...(product.metadata || {}), price_pending: false, is_demo_price: false, purchase_enabled: true, is_quote_only: false },
      categories: [{ id: `fixture-category-${index % 2}`, handle: "gases-refrigerantes", name: "Gases refrigerantes" }],
      variants: (product.variants || []).map((variant: Record<string, any>) => ({
        ...variant,
        calculated_price: { ...(variant.calculated_price || {}), calculated_amount: 100 + index, currency_code: "brl" },
        manage_inventory: false,
        allow_backorder: true,
      })),
    }))
    await route.fulfill({ response, body: JSON.stringify(payload) })
  })
}

test.describe("PDP and product shelves", () => {
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 1280, height: 900 },
    { width: 1024, height: 900 },
    { width: 768, height: 1024 },
    { width: 390, height: 844 },
    { width: 320, height: 740 },
  ]) {
    test(`PDP grid remains aligned at ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await page.goto(`/br/products/${productHandle}`, { waitUntil: "networkidle" })
      await expect(page.getByTestId("product-top-layout")).toBeVisible()
      await expect(page.getByTestId("product-breadcrumbs")).toBeVisible()
      await expect(page.getByTestId("purchase-panel")).toBeVisible()
      const detailPanels = page.getByTestId("product-detail-panels")
      if (await detailPanels.count()) await expect(detailPanels).toBeVisible()

      const metrics = await page.evaluate(() => {
        const header = document.querySelector("header")?.getBoundingClientRect()
        const top = document.querySelector<HTMLElement>("[data-testid=product-top-layout]")?.getBoundingClientRect()
        const gallery = document.querySelector<HTMLElement>("[aria-label='Galeria do produto']")?.getBoundingClientRect()
        const purchase = document.querySelector<HTMLElement>("[data-testid=purchase-panel]")?.getBoundingClientRect()
        return {
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          headerBottom: header?.bottom ?? 0,
          topTop: top?.top ?? 0,
          galleryTop: gallery?.top ?? 0,
          purchaseTop: purchase?.top ?? 0,
          detailWidth: document.querySelector<HTMLElement>("[data-testid=product-detail-panels]")?.getBoundingClientRect().width
            ?? document.querySelector<HTMLElement>("[data-testid=product-top-layout]")?.getBoundingClientRect().width
            ?? 0,
        }
      })

      expect(metrics.overflow).toBe(0)
      expect(metrics.topTop).toBeGreaterThanOrEqual(metrics.headerBottom)
      if (viewport.width >= 1280) expect(Math.abs(metrics.galleryTop - metrics.purchaseTop)).toBeLessThanOrEqual(2)
      expect(metrics.detailWidth).toBeGreaterThanOrEqual(Math.min(viewport.width - 32, 300))
    })
  }

  test("single-image products do not create false gallery controls", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`/br/products/${productHandle}`, { waitUntil: "networkidle" })
    const gallery = page.locator("[aria-label='Galeria do produto']")
    await expect(gallery.locator("button[aria-label^='Selecionar imagem']")).toHaveCount(0)
    await expect(gallery.locator("button[aria-label='Imagem anterior']")).toHaveCount(0)
    await expect(gallery.locator("button[aria-label^='Próxima imagem']")).toHaveCount(0)
  })

  test("mobile purchase actions stay in document flow without a sticky bar", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`/br/products/${productHandle}`, { waitUntil: "networkidle" })
    await expect(page.getByTestId("product-purchase-actions")).toBeVisible()
    const fixedPurchaseControls = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>("*")]
      .filter((element) => getComputedStyle(element).position === "fixed" && (element.textContent || "").includes("Adicionar ao carrinho")).length)
    expect(fixedPurchaseControls).toBe(0)

    await page.getByTestId("mobile-navigation-trigger").click()
    await page.getByTestId("mobile-navigation-drawer").getByRole("button", { name: "Acessibilidade", exact: true }).click()
    await expect(page.getByRole("dialog", { name: "Recursos de Acessibilidade" })).toBeVisible()
  })

  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
  ]) {
    test(`shelf controls respect start, advance, end and return at ${viewport.width}px`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name.includes("Mobile") && viewport.width > 768, "Desktop viewport tested under desktop project")
      await page.setViewportSize(viewport)
      await useHomeCarouselFixture(page)
      await page.goto("/br", { waitUntil: "networkidle" })
      const section = page.getByTestId("home-specialized-products")
      await expect(section.locator("[data-carousel-slide]").first()).toBeVisible({ timeout: 10000 })

      const stageButtons = section.locator(".ff-carousel-stage > button")

      if (viewport.width >= 768) {
        await expect(stageButtons).toHaveCount(2)
        const previous = stageButtons.nth(0)
        const next = stageButtons.nth(1)
        await expect(previous).toBeDisabled()
        await expect(next).toBeEnabled()
        await page.screenshot({ path: testInfo.outputPath(`home-${viewport.width}-carousel-start.png`), fullPage: false })
        await next.click()
        await expect(previous).toBeEnabled()
        await page.screenshot({ path: testInfo.outputPath(`home-${viewport.width}-carousel-middle.png`), fullPage: false })
        for (let index = 0; index < 12 && await next.isEnabled(); index += 1) await next.click()
        await expect(next).toBeDisabled()
        await page.screenshot({ path: testInfo.outputPath(`home-${viewport.width}-carousel-end.png`), fullPage: false })
        // End state must retain the previous control so users can recover without
        // refreshing the shelf after Embla trims the final snap.
        await expect(previous).toBeEnabled()
        await previous.click()
        await expect(next).toBeEnabled()
        await page.screenshot({ path: testInfo.outputPath(`home-${viewport.width}-carousel-back-from-end.png`), fullPage: false })
      } else {
        // Mobile hides side circular buttons and relies on touch swipe
        if (await stageButtons.count() > 0) {
          await expect(stageButtons.first()).toBeHidden()
          await expect(stageButtons.last()).toBeHidden()
        }
        const viewportEl = section.locator(".ff-carousel-viewport")
        await expect(viewportEl).toBeVisible()
        await page.screenshot({ path: testInfo.outputPath(`home-${viewport.width}-carousel-mobile.png`), fullPage: false })
      }
    })
  }
})
