import { test, expect } from "@playwright/test"

test.describe("real customer card checkout", () => {
  test.setTimeout(120000)

  test("mounts the official Card Payment Brick inside checkout", async ({ page }) => {
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"], { origin: "http://127.0.0.1:5173" })
    // The commercial Customer is local-only; the provider injects the
    // method-specific Orders API sandbox payer e-mail in its backend payload.
    const email = process.env.E2E_CUSTOMER_EMAIL || `e2e.card.${Date.now()}@example.test`
    const password = process.env.E2E_CUSTOMER_PASSWORD || "Password123!"
    const sdkFailures: string[] = []
    const sdkConsoleErrors: string[] = []
    page.on("requestfailed", (request) => {
      const url = new URL(request.url())
      if (url.hostname === "sdk.mercadopago.com") sdkFailures.push(request.failure()?.errorText || "unknown")
    })
    page.on("console", (message) => {
      if (message.type() === "error" && /mercadopago|card|brick/i.test(message.text())) {
        sdkConsoleErrors.push(message.text().slice(0, 180))
      }
    })

    await page.goto("/br/products/omie-1988730838-57a3f2702fe2")
    await page.getByRole("button", { name: /Comprar agora/i }).click()
    await expect(page).toHaveURL(/\/br\/checkout/)
    await page.goto("/br/account/register")
    await page.waitForLoadState("networkidle")
    await page.locator("#pf_firstName").fill("Checkout")
    await page.locator("#pf_lastName").fill("Sandbox")
    await page.locator("#pf_email").fill(email)
    await page.locator("#pf_phone").fill("11999999999")
    await page.locator("#pf_password").fill(password)
    await page.locator("#pf_confirmPassword").fill(password)
    await page.locator("#pf_firstName").locator("xpath=ancestor::form").getByRole("checkbox").first().check()
    const registrationResponse = page.waitForResponse((response) => {
      const request = response.request()
      return request.method() === "POST" && new URL(response.url()).pathname === "/store/customers/register"
    })
    await page.getByRole("button", { name: "Criar conta" }).click()
    const registrationFailure = page.getByRole("alert")
    await Promise.race([
      page.waitForURL(/\/br\/?$/, { timeout: 15000 }),
      registrationFailure.waitFor({ state: "visible", timeout: 15000 }),
    ])
    if (await registrationFailure.isVisible()) {
      const response = await registrationResponse
      throw new Error(`Sandbox customer registration failed with HTTP ${response.status()}`)
    }
    await page.goto("/br/checkout")
    await expect(page).toHaveURL(/\/br\/checkout/)

    await expect(page.locator("#checkout-first-name")).toBeVisible()
    await page.locator("#checkout-document").fill("52998224725")
    await page.getByRole("button", { name: "Continuar para recebimento" }).click()
    const pickup = page.getByRole("radio", { name: /^Retirada na Loja 1/i })
    await expect(pickup).toBeEnabled({ timeout: 15000 })
    // The radio is intentionally visually hidden inside a label. Use the
    // native keyboard contract so decorative card content cannot intercept it.
    await pickup.focus()
    await pickup.press("Space")
    await expect(pickup).toBeChecked()
    await page.getByRole("button", { name: /Pr.o?ximo/i }).last().click()
    await expect(page.getByText(/Total confirmado pelo servidor/i)).toBeVisible({ timeout: 30000 })

    await page.getByRole("radio", { name: /Cart.o de cr.dito/i }).click()
    await expect(page.locator("#mercado-pago-secure-card-mount")).toBeVisible()
    const brickFailure = page.getByRole("alert").filter({ hasText: "Nao foi possivel carregar o formulario seguro do Mercado Pago." })
    const iframe = page.locator("#mercado-pago-secure-card-mount iframe").first()
    await Promise.race([
      iframe.waitFor({ state: "visible", timeout: 30000 }),
      brickFailure.waitFor({ state: "visible", timeout: 30000 }),
    ])
    if (await brickFailure.isVisible()) throw new Error(`Mercado Pago SDK load failure: ${JSON.stringify({ message: await brickFailure.textContent(), sdkFailures, sdkConsoleErrors })}`)
    await expect(page.locator("#mercado-pago-secure-card-mount iframe").first()).toBeVisible({ timeout: 30000 })
    await expect(page.locator('iframe[name="cardNumber"]')).toBeVisible()
    const cardNumber = process.env.E2E_CARD_NUMBER
    const expirationDate = process.env.E2E_CARD_EXPIRATION
    const securityCode = process.env.E2E_CARD_SECURITY_CODE
    const documentNumber = process.env.E2E_CARD_DOCUMENT
    const scenario = process.env.E2E_CARD_SCENARIO
    test.skip(!cardNumber || !expirationDate || !securityCode || !scenario, "Requires official Mercado Pago test card data via ephemeral environment")
    const numberField = page.frameLocator('iframe[name="cardNumber"]').locator('input[name="cardNumber"]')
    const expirationField = page.frameLocator('iframe[name="expirationDate"]').locator('input[name="expirationDate"]')
    const securityField = page.frameLocator('iframe[name="securityCode"]').locator('input[name="securityCode"]')
    // Secure fields synchronize through keyboard events across origins; use the
    // same user interaction as the real cardholder instead of programmatic value assignment.
    await numberField.pressSequentially(cardNumber as string)
    await numberField.press("Tab")
    await expect(numberField).toHaveAttribute("aria-invalid", "false")
    await expirationField.pressSequentially(expirationDate)
    await expirationField.press("Tab")
    await expect(expirationField).toHaveAttribute("aria-invalid", "false")
    await securityField.pressSequentially(securityCode)
    await securityField.press("Tab")
    await expect(securityField).toHaveAttribute("aria-invalid", "false")
    await page.locator('#mercado-pago-secure-card-mount input[name="HOLDER_NAME"]').fill(scenario as string)
    if (documentNumber) {
      await page.locator('#mercado-pago-secure-card-mount input[name="DOCUMENT"]').fill(documentNumber)
    }
    const invalid = await page.locator('#mercado-pago-secure-card-mount iframe').evaluateAll((elements) => elements.filter((element) => ["cardNumber", "expirationDate", "securityCode"].includes(element.getAttribute("name") || "")).map((element) => ({ name: element.getAttribute("name"), loaded: Boolean(element.contentWindow) })))
    if (invalid.length === 0) throw new Error("CARD_SECURE_FIELDS_NOT_MOUNTED")
    await page.locator("#mercado-pago-secure-card-mount").getByRole("button", { name: "Pagar" }).click()
    await expect(page.getByTestId("checkout-payment-next")).toBeEnabled({ timeout: 15000 })
    await page.getByTestId("checkout-payment-next").click()
    await expect(page.getByRole("heading", { name: /Revis.o/i })).toBeVisible({ timeout: 15000 })
    await page.getByRole("checkbox", { name: /Confirmo que revisei/i }).check()
    await page.getByRole("button", { name: /Confirmar e pagar/i }).click()
    const expected = scenario === "APRO" ? "Pagamento aprovado" : "Pagamento recusado"
    await expect(page.getByRole("heading", { name: expected })).toBeVisible({ timeout: 45000 })
  })
})
