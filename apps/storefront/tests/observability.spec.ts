import { expect, test } from "@playwright/test"

test("Analytics stays blocked until explicit consent and loads one tag after acceptance", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.removeItem("friggafrio:analytics-consent")
    const descriptor = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, "src")
    if (!descriptor?.set) return
    Object.defineProperty(HTMLScriptElement.prototype, "src", {
      configurable: true,
      get: descriptor.get,
      set(value: string) {
        if (value.includes("googletagmanager.com/gtag/js")) {
          descriptor.set?.call(this, "data:application/javascript,")
          return
        }
        descriptor.set?.call(this, value)
      },
    })
  })
  await page.goto("/br", { waitUntil: "domcontentloaded" })
  await expect(page.getByRole("button", { name: "Permitir Analytics" })).toBeVisible()
  await expect.poll(() => page.evaluate(() => Boolean((window as Window & { dataLayer?: unknown[] }).dataLayer?.some((entry) => Array.isArray(entry) && entry[0] === "consent" && entry[1] === "default")))).toBe(true)
  await page.getByRole("button", { name: "Permitir Analytics" }).click()
  await expect.poll(() => page.evaluate(() => (window as Window & { dataLayer?: unknown[] }).dataLayer?.some((entry) => Array.isArray(entry) && entry[0] === "config"))).toBe(true)
  expect(await page.evaluate(() => document.querySelectorAll("script[data-friggafrio-ga]").length)).toBe(1)
})

test("Newsletter requires consent before a submission on desktop and mobile", async ({ page, isMobile }) => {
  await page.goto("/br", { waitUntil: "domcontentloaded" })
  const form = page.locator("form").filter({ has: page.getByRole("button", { name: "Quero receber novidades" }) })
  await form.getByLabel("Nome").fill("Cliente Teste")
  await form.locator('input[type="email"]').fill("cliente@example.com")
  await expect(form.getByRole("button", { name: "Quero receber novidades" })).toBeDisabled()
  if (isMobile) await expect(form).toBeVisible()
})
