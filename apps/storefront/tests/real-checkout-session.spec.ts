import { test, expect } from "@playwright/test"

test.describe("real customer checkout session", () => {
  test.setTimeout(120000)

  test("registers, transfers the guest cart, and reaches payment preparation", async ({ page }) => {
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"], { origin: "http://127.0.0.1:5173" })
    const statuses: Array<{ path: string; status: number }> = []
    page.on("response", (response) => {
      const url = new URL(response.url())
      if ((url.hostname === "127.0.0.1" || url.hostname === "localhost") && /\/store\/customers\/register|\/auth\/unified\/emailpass|\/store\/customers\/me|\/store\/carts\/.+\/customer|\/store\/carts\/.+\/prepare|\/store\/payment-collections/.test(url.pathname)) {
        statuses.push({ path: url.pathname, status: response.status() })
      }
    })

    const email = process.env.E2E_MP_TEST_EMAIL || `e2e.checkout.${Date.now()}@example.com`
    const password = process.env.E2E_MP_TEST_PASSWORD || "Password123!"

    // Create the cart while anonymous so the authenticated session must
    // transfer ownership before the protected prepare route is reached.
    await page.goto("/br/products/omie-1988730838-57a3f2702fe2")
    await expect(page.getByRole("button", { name: /Comprar agora/i })).toBeVisible({ timeout: 20000 })
    const lineItemResponse = page.waitForResponse((response) => {
      const url = new URL(response.url())
      return /\/store\/carts\/[^/]+\/line-items$/.test(url.pathname) && response.request().method() === "POST"
    })
    await page.getByRole("button", { name: /Comprar agora/i }).click()
    const lineItem = await lineItemResponse
    if (!lineItem.ok()) {
      throw new Error(`Sanitized cart transport: ${JSON.stringify({ status: lineItem.status(), path: new URL(lineItem.url()).pathname })}`)
    }
    await expect(page).toHaveURL(/\/br\/checkout/, { timeout: 15000 })

    await page.goto("/br/account/register")
    await page.waitForLoadState("networkidle")
    await page.locator("#pf_firstName").fill("Checkout")
    await page.locator("#pf_lastName").fill("Customer")
    await page.locator("#pf_email").fill(email)
    await page.locator("#pf_phone").fill("11999999999")
    await page.locator("#pf_password").fill(password)
    await page.locator("#pf_confirmPassword").fill(password)
    await page.locator("#pf_firstName").locator("xpath=ancestor::form").getByRole("checkbox").first().check()
    await page.getByRole("button", { name: "Criar conta" }).click()
    const registrationFailure = page.getByRole("alert")
    await Promise.race([
      page.waitForURL(/\/br\/?$/, { timeout: 15000 }),
      registrationFailure.waitFor({ state: "visible", timeout: 15000 }),
    ])
    if (await registrationFailure.isVisible()) {
      throw new Error(`Sanitized registration transport: ${JSON.stringify(statuses)}`)
    }
    await page.waitForURL(/\/br\/?$/)
    await page.goto("/br/checkout")
    await expect(page).toHaveURL(/\/br\/checkout/, { timeout: 15000 })

    await expect(page.locator("#checkout-first-name")).toHaveValue("Checkout", { timeout: 15000 })
    await page.locator("#checkout-document").fill("52998224725")
    await page.getByRole("button", { name: "Continuar para recebimento" }).click()
    await expect(page.getByRole("heading", { name: "Como deseja receber" })).toBeVisible()
    const pickup = page.getByRole("radio", { name: /^Retirada na Loja 1/i })
    await expect(pickup).toBeEnabled({ timeout: 15000 })
    await pickup.check({ force: true })
    await page.getByRole("button", { name: /Pr.o?ximo/i }).last().click()

    await expect(page.getByText(/Total confirmado pelo servidor/i)).toBeVisible({ timeout: 30000 })
    await expect(page.getByRole("radio", { name: /Pix/i })).toBeVisible()
    await expect(page.getByRole("radio", { name: /Cart.o de cr.dito/i })).toBeVisible()
    await page.getByRole("radio", { name: /Pix/i }).click()
    await page.getByTestId("checkout-payment-next").click()
    await expect(page.getByRole("heading", { name: /Revis.o/i })).toBeVisible({ timeout: 15000 })
    await page.getByRole("checkbox", { name: /Confirmo que revisei/i }).check()
    const paymentSessionResponse = page.waitForResponse((response) =>
      (response.url().includes("localhost:9000/store/payment-collections/") || response.url().includes("127.0.0.1:9000/store/payment-collections/")) &&
      response.url().includes("/payment-sessions") && response.request().method() === "POST",
    )
    await page.getByRole("button", { name: /Confirmar e pagar/i }).click()
    const paymentSession = await paymentSessionResponse
    const paymentFailure = page.getByRole("alert")
    const pendingHeading = page.getByRole("heading", { name: "Pagamento aguardando confirmacao" })
    await Promise.race([
      pendingHeading.waitFor({ state: "visible", timeout: 30000 }),
      paymentFailure.waitFor({ state: "visible", timeout: 30000 }),
    ])
    if (await paymentFailure.isVisible()) {
      const body = await paymentSession.json().catch(() => ({})) as { type?: unknown; code?: unknown; message?: unknown }
      const message = typeof body.message === "string" ? body.message.slice(0, 180).replace(/[\r\n]/g, " ") : undefined
      throw new Error(`Sanitized payment transport: ${JSON.stringify({ statuses, paymentSession: { status: paymentSession.status(), type: body.type, code: body.code, message } })}`)
    }
    await expect(page.getByRole("img", { name: "QR Code Pix para pagamento" })).toBeVisible()
    const copyPix = page.getByRole("button", { name: "Copiar codigo Pix" })
    await expect(copyPix).toBeVisible()
    await copyPix.click()
    await expect(page.getByRole("button", { name: "Codigo copiado" })).toBeVisible()
    await page.reload()
    await expect(page.getByRole("heading", { name: "Pagamento aguardando confirmacao" })).toBeVisible({ timeout: 30000 })
    await expect(page.getByRole("img", { name: "QR Code Pix para pagamento" })).toBeVisible()

    expect(statuses.some((item) => item.path.endsWith("/customer") && item.status < 400)).toBe(true)
    expect(statuses.some((item) => item.path.includes("/prepare") && item.status === 200)).toBe(true)
    expect(statuses.filter((item) => item.path.includes("/payment-sessions") && item.status < 400)).toHaveLength(1)
    expect(statuses.filter((item) => item.path.includes("/prepare") && item.status >= 500)).toEqual([])
  })
})
