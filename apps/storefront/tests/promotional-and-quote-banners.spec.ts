import { test, expect } from "@playwright/test"

test.describe("Promotional Banners and WhatsApp Quote Banner Responsiveness", () => {
  const viewports = [
    { name: "mobile-320", width: 320, height: 700 },
    { name: "mobile-390", width: 390, height: 844 },
    { name: "tablet-768", width: 768, height: 1024 },
    { name: "desktop-1280", width: 1280, height: 800 },
    { name: "desktop-1672", width: 1672, height: 900 },
  ]

  for (const vp of viewports) {
    test("renders promotional carousel and WhatsApp quote banner cleanly on " + vp.name, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.addInitScript(() => {
        localStorage.setItem("friggafrio:consent-version", "2026-09")
        localStorage.setItem("friggafrio:analytics-consent", "granted")
        localStorage.setItem("friggafrio:analytics-consent-recorded", "true")
      })
      await page.goto("/br", { waitUntil: "networkidle" })

      // Check no horizontal scrollbar / overflow
      const documentOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      )
      expect(documentOverflow).toBe(0)

      // Check promotional banners section
      const promoSection = page.getByLabel("Linhas de produtos FriggaFrio")
      await expect(promoSection).toBeVisible()

      const promoImgs = promoSection.locator("img")
      await expect(promoImgs).toHaveCount(3)

      // In mobile, carousel has indicators and 1 slide visible per snap
      const indicators = promoSection.getByLabel("Navegação dos banners")
      if (vp.width < 768) {
        await expect(indicators).toBeVisible()
        const firstImg = promoImgs.first()
        const box = await firstImg.boundingBox()
        expect(box).not.toBeNull()
        expect(box!.width).toBeGreaterThan(vp.width - 48)
      } else {
        await expect(indicators).toBeHidden()
        for (let i = 0; i < 3; i++) {
          await expect(promoImgs.nth(i)).toBeVisible()
        }
      }

      // Check WhatsApp quote banner
      const waSection = page.getByLabel("Solicite um orçamento")
      await expect(waSection).toBeVisible()

      const waLink = waSection.locator("a")
      await expect(waLink).toBeVisible()
      const href = await waLink.getAttribute("href")
      expect(href).toContain("https://wa.me/")
      expect(decodeURIComponent(href!)).toContain("Não encontrou o produto")

      const waImg = waSection.locator("img")
      await expect(waImg).toBeVisible()
      const waBox = await waImg.boundingBox()
      expect(waBox).not.toBeNull()
      const ratio = waBox!.width / waBox!.height
      expect(ratio).toBeGreaterThan(6.0)
      expect(ratio).toBeLessThan(6.5)
    })
  }

  test("promotional carousel mobile navigation slides correctly", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.addInitScript(() => {
      localStorage.setItem("friggafrio:consent-version", "2026-09")
      localStorage.setItem("friggafrio:analytics-consent", "granted")
    })
    await page.goto("/br", { waitUntil: "networkidle" })

    const promoSection = page.getByLabel("Linhas de produtos FriggaFrio")
    const indicatorButtons = promoSection.locator("button[aria-label*='Ir para banner']")
    await expect(indicatorButtons).toHaveCount(3)

    // Initially first button is active
    await expect(indicatorButtons.nth(0)).toHaveAttribute("aria-current", "true")
    await expect(indicatorButtons.nth(1)).toHaveAttribute("aria-current", "false")

    // Click second dot
    await indicatorButtons.nth(1).click()
    await page.waitForTimeout(300)
    await expect(indicatorButtons.nth(1)).toHaveAttribute("aria-current", "true")

    // Click third dot
    await indicatorButtons.nth(2).click()
    await page.waitForTimeout(300)
    await expect(indicatorButtons.nth(2)).toHaveAttribute("aria-current", "true")
  })
})
