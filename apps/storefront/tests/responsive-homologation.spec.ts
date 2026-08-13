import { test, expect, type Page } from "@playwright/test"

const viewports = [
  { width: 320, height: 740 },
  { width: 360, height: 800 },
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 414, height: 896 },
  { width: 768, height: 1024 },
  { width: 1024, height: 900 },
  { width: 1280, height: 900 },
  { width: 1440, height: 900 },
]

const mobileViewports = new Set([320, 360, 375, 390, 414, 768])

async function assertNoHorizontalOverflow(page: Page) {
  const metrics = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
  }))

  expect(metrics.documentWidth, `horizontal overflow at ${metrics.viewportWidth}px`).toBeLessThanOrEqual(
    metrics.viewportWidth
  )
}

async function waitForHydration(page: Page) {
  await page.waitForTimeout(750)
}

test.describe("final responsive storefront homologation", () => {
  for (const viewport of viewports) {
    test(`home layout and header at ${viewport.width}px`, async ({ page }) => {
      const consoleErrors: string[] = []
      page.on("console", (message) => {
        if (message.type() === "error") consoleErrors.push(message.text())
      })

      await page.setViewportSize(viewport)
      await page.goto("/br", { waitUntil: "domcontentloaded" })
      await waitForHydration(page)
      await expect(page.locator("body")).not.toContainText("Failed to load storefront regions from Medusa")
      await assertNoHorizontalOverflow(page)

      const trigger = page.getByTestId("mobile-navigation-trigger")
      if (mobileViewports.has(viewport.width)) {
        await expect(trigger).toBeVisible()
        await expect(page.locator('a[aria-label="Minha conta"]:visible')).toHaveCount(1)
        await expect(page.locator('button[aria-label^="Abrir carrinho com"]:visible')).toHaveCount(1)
      } else {
        await expect(trigger).toBeHidden()
        await expect(page.getByRole("button", { name: /Produtos/ }).first()).toBeVisible()
      }

      expect(consoleErrors.filter((error) => !error.includes("/store/customers/me")).length).toBe(0)
    })
  }

  for (const width of [320, 360, 375, 390, 414]) {
    test(`mobile menu and cart flow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 })
      await page.goto("/br", { waitUntil: "domcontentloaded" })
      await waitForHydration(page)

      const trigger = page.getByTestId("mobile-navigation-trigger")
      const drawer = page.getByTestId("mobile-navigation-drawer")
      await expect(trigger).toHaveAttribute("data-hydrated", "true")
      await trigger.click()
      await expect(drawer).toHaveAttribute("data-state", "open")
      await expect(drawer.getByRole("link", { name: "Produtos", exact: true })).toBeVisible()
      await expect(drawer.getByRole("link", { name: "Nossa Loja", exact: true })).toBeVisible()
      await expect(drawer.getByText("Unidade selecionada")).toHaveCount(0)
      await expect(page.getByTestId("mobile-navigation-layer")).toHaveCount(1)

      await page.getByTestId("mobile-navigation-close").click()
      await expect(drawer).toHaveCount(0)
      await trigger.click()
      await page.getByTestId("mobile-navigation-overlay").click({ position: { x: width - 2, y: 420 } })
      await expect(drawer).toHaveAttribute("data-state", "closed")
      await expect(drawer).toHaveCount(0, { timeout: 2000 })

      await trigger.click()
      await expect(drawer).toHaveAttribute("data-state", "open")
      await page.getByTestId("mobile-navigation-close").click()
      await expect(drawer).toHaveCount(0)
      await trigger.click()
      await page.getByTestId("mobile-navigation-close").click()

      await page.getByRole("button", { name: /Abrir carrinho com/ }).click()
      await expect(page.getByRole("heading", { name: "Seu Carrinho", exact: true })).toBeVisible()
      await page.getByRole("button", { name: "Fechar carrinho" }).click()
      await expect(page.getByRole("heading", { name: "Seu Carrinho", exact: true })).toHaveCount(0)
      await assertNoHorizontalOverflow(page)
    })
  }

  test("single store, navigation and back/forward flow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto("/br", { waitUntil: "domcontentloaded" })
    await waitForHydration(page)

    await page.getByTestId("mobile-navigation-trigger").click()
    await page.getByTestId("mobile-navigation-drawer").getByRole("link", { name: "Nossa Loja", exact: true }).click()
    await expect(page).toHaveURL(/\/nossa-loja$/)
    await expect(page.getByTestId("store-location-card")).toHaveCount(1)
    await expect(page.getByText(/Loja 2/)).toHaveCount(0)
    await expect(page.getByText(/CNPJ:/)).toHaveCount(1)
    await assertNoHorizontalOverflow(page)

    await page.goBack()
    await expect(page).toHaveURL(/\/br$/)
    await page.goForward()
    await expect(page).toHaveURL(/\/nossa-loja$/)
  })

  for (const reducedMotion of ["reduce"] as const) {
    for (const width of [390, 1280]) {
      test(`reduced motion remains functional at ${width}px`, async ({ page }) => {
        await page.emulateMedia({ reducedMotion })
        await page.setViewportSize({ width, height: 844 })
        await page.goto("/br", { waitUntil: "domcontentloaded" })
        await waitForHydration(page)

        if (width < 1024) {
          await page.getByTestId("mobile-navigation-trigger").click()
          const duration = await page.getByTestId("mobile-navigation-drawer").evaluate(
            (element) => Number.parseFloat(getComputedStyle(element).transitionDuration)
          )
          expect(duration).toBeLessThanOrEqual(0.01)
        } else {
          await expect(page.getByTestId("mobile-navigation-trigger")).toBeHidden()
        }
      })
    }
  }
})
