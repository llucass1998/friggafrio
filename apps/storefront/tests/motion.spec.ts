import { test, expect } from "@playwright/test"

test.describe("storefront motion interactions", () => {
  test("mobile drawer opens, closes, and navigates without blocking the page", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto("/br")
    await page.waitForTimeout(750)

    const trigger = page.getByTestId("mobile-navigation-trigger")
    await trigger.click()

    const drawer = page.getByTestId("mobile-navigation-drawer")
    await expect(drawer).toBeVisible()
    await expect(drawer.getByRole("link", { name: "Produtos" })).toBeVisible()
    await expect(drawer.getByRole("link", { name: "Nossa Loja" })).toBeVisible()

    await page.getByTestId("mobile-navigation-overlay").click({ position: { x: 380, y: 420 } })
    await expect(drawer).toBeHidden()

    await trigger.click()
    await drawer.getByRole("link", { name: "Nossa Loja" }).click()
    await expect(page).toHaveURL(/\/nossa-loja$/)
    await expect(drawer).toBeHidden()
  })

  test("desktop Products dropdown uses click, route, and Escape close", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto("/br")
    await page.waitForTimeout(750)

    const productsTrigger = page.locator("header button[aria-controls^='products-mega-menu-']:visible").first()
    await productsTrigger.click()
    const productsMenu = page.locator("[id^='products-mega-menu-']:visible").first()
    await expect(productsMenu).toBeVisible()

    await productsMenu.getByRole("link", { name: "Ver todos os produtos" }).click()
    await expect(page).toHaveURL(/\/br\/store(?:\?.*)?$/)

    await page.goto("/br")
    await page.waitForTimeout(750)
    await page.locator("header button[aria-controls^='products-mega-menu-']:visible").first().click()
    await page.keyboard.press("Escape")
    await expect(page.locator("[id^='products-mega-menu-']:visible")).toHaveCount(0)
  })

  test("cart drawer opens and closes with the Radix lifecycle", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto("/br")
    await page.waitForTimeout(750)

    await page.getByRole("button", { name: /Abrir carrinho com/ }).click()
    await expect(page.getByRole("heading", { name: "Seu Carrinho", exact: true })).toBeVisible()

    await page.getByRole("button", { name: "Fechar carrinho" }).click()
    await expect(page.getByRole("heading", { name: "Seu Carrinho", exact: true })).toBeHidden()
  })

  test("reduced motion removes non-essential drawer timing", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto("/br")
    await page.waitForTimeout(750)
    await page.getByTestId("mobile-navigation-trigger").click()

    const transitionDuration = await page.getByTestId("mobile-navigation-drawer").evaluate(
      (element) => Number.parseFloat(getComputedStyle(element).transitionDuration)
    )

    expect(transitionDuration).toBeLessThanOrEqual(0.01)
  })
})
