import { test, expect, type Page } from "@playwright/test"

const productHandle = "omie-5355643802-55e1b3ebc2b8"

async function dismissConsent(page: Page) {
  const reject = page.getByRole("button", { name: "Recusar opcionais" })
  if (await reject.isVisible().catch(() => false)) await reject.click()
}

for (const viewport of [
  { name: "desktop", width: 1672, height: 941 },
  { name: "mobile", width: 390, height: 844 },
]) {
  test(`captures catalog, PDP, and hero reference surfaces at ${viewport.name}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })

    for (const [name, path] of [
      ["catalog", "/br/store"],
      ["pdp", `/br/products/${productHandle}`],
      ["home", "/br"],
    ] as const) {
      await page.goto(path, { waitUntil: "networkidle" })
      await dismissConsent(page)
      await expect(page.locator("body")).toBeVisible()
      await page.screenshot({ path: testInfo.outputPath(`${name}-${viewport.width}x${viewport.height}.png`), fullPage: false })
    }
  })
}
