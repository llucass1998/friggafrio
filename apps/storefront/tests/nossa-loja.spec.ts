import { test, expect } from "@playwright/test"

test.describe("Página Nossa Loja - Responsive Layout", () => {
  const viewports = [
    { width: 1440, height: 900, name: "desktop" },
    { width: 768, height: 1024, name: "tablet" },
    { width: 390, height: 844, name: "mobile" },
  ]

  for (const vp of viewports) {
    test(`renderiza layout correto em ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
      await page.setViewportSize(vp)
      await page.goto("/nossa-loja")

      // Espera renderizar a seção
      const section = page.locator('section[aria-label="Informações da Loja"]')
      await expect(section).toBeVisible()

      // Testa se o titulo aparece (o nome da loja, que é FriggaFrio, está em um h2/heading)
      await expect(page.getByRole("heading", { name: "FriggaFrio", exact: true })).toBeVisible()
      // O identificador "Nossa Loja" está em um span, podemos verificar apenas com getByText dentro da section
      await expect(section.getByText("Nossa Loja", { exact: true }).first()).toBeVisible()

      // Não deve ter texto "Loja 1", "Loja 2", "Unidade selecionada"
      await expect(page.locator("text=Loja 1")).toHaveCount(0)
      await expect(page.locator("text=Loja 2")).toHaveCount(0)
      await expect(page.locator("text=Unidade selecionada")).toHaveCount(0)

      // Em desktop, verifica CSS Grid
      if (vp.width >= 1024) {
        const bbox = await section.locator("> div").boundingBox()
        expect(bbox).toBeDefined()
        if (bbox) {
          expect(bbox.height).toBeLessThanOrEqual(520)
        }
      }

      // Tira screenshot
      await page.waitForTimeout(1000)
      await page.screenshot({ path: `test-results/nossa-loja-${vp.name}.png`, fullPage: true })
    })
  }

  test("mapa e vista da rua alternam corretamente via toolbar", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto("/nossa-loja")

    const btnStreet = page.getByRole("button", { name: "Rua", exact: true })
    const btnMap = page.getByRole("button", { name: "Mapa", exact: true })

    // In CI or tests, API KEY is likely empty, rendering the fallback.
    // If not, it renders an iframe. We can check for either.
    const fallbackMap = page.locator('h3:has-text("Localização no Mapa")')
    const fallbackStreet = page.locator('h3:has-text("Street View")')
    const iframeMap = page.locator('iframe[title*="Mapa da"]')
    const iframeStreet = page.locator('iframe[title*="Street View da"]')

    // Let's just give it a moment to load
    await page.waitForTimeout(500)

    const hasApiKey = await iframeMap.isVisible().catch(() => false)

    if (hasApiKey) {
      await expect(iframeMap).toBeVisible()
      await expect(iframeStreet).not.toBeVisible()

      await btnStreet.click()
      await page.waitForTimeout(500)

      await expect(iframeStreet).toBeVisible()
      await expect(iframeMap).not.toBeVisible()

      await btnMap.click()
      await page.waitForTimeout(500)

      await expect(iframeMap).toBeVisible()
    } else {
      await expect(fallbackMap).toBeVisible()
      await expect(fallbackStreet).not.toBeVisible()

      await btnStreet.click()
      await page.waitForTimeout(500)

      await expect(fallbackStreet).toBeVisible()
      await expect(fallbackMap).not.toBeVisible()

      await btnMap.click()
      await page.waitForTimeout(500)

      await expect(fallbackMap).toBeVisible()
    }
  })
})
