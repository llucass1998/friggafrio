import { expect, test } from "@playwright/test"

const viewports = [390, 768, 1280]

test("real Store API quote-only product is safe on Card and PDP", async ({ page }) => {
  for (const width of viewports) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 })

    await page.goto("/br/store")
    const card = page.locator("div.group", { hasText: "QUOTE_ONLY" }).first()
    await expect(card.getByText(/QUOTE_ONLY/)).toBeVisible()
    await expect(card.getByRole("button", { name: /Solicitar cotação/ })).toBeDisabled()
    await expect(card.getByRole("button", { name: /Comprar/ })).toHaveCount(0)
    await expect.poll(() => page.evaluate(() => document.body.scrollWidth <= window.innerWidth)).toBe(true)

    const productPath = await card.locator('a[href*="/products/"]').first().getAttribute("href")
    expect(productPath, "rendered Store API product must link to its PDP").toBeTruthy()
    await page.goto(productPath!)
    await expect(page.getByText(/QUOTE_ONLY/).first()).toBeVisible()
    await expect(page.getByRole("button", { name: /Solicitar cotação/ })).toBeDisabled()
    await expect(page.getByRole("button", { name: /Comprar/ })).toHaveCount(0)
    await expect.poll(() => page.evaluate(() => document.body.scrollWidth <= window.innerWidth)).toBe(true)
  }
})
