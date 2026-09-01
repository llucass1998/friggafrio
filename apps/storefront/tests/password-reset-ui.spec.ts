import { expect, test } from "@playwright/test"

test.describe("password reset UI contract", () => {
  test("keeps the request generic, completes the form, and rejects a replay", async ({ page }) => {
    let confirmationAttempts = 0
    const requestBodies: Record<string, unknown>[] = []

    await page.route("**/store/customers/password-reset", async (route) => {
      if (route.request().method() !== "POST") {
        await route.fulfill({ status: 204, headers: {
          "Access-Control-Allow-Origin": "http://127.0.0.1:5173",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "content-type, x-publishable-api-key",
        } })
        return
      }
      requestBodies.push(route.request().postDataJSON() as Record<string, unknown>)
      await route.fulfill({ status: 202, contentType: "application/json", body: JSON.stringify({ success: true }) })
    })
    await page.route("**/store/customers/password-reset/confirm", async (route) => {
      if (route.request().method() !== "POST") {
        await route.fulfill({ status: 204, headers: {
          "Access-Control-Allow-Origin": "http://127.0.0.1:5173",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "content-type, x-publishable-api-key",
        } })
        return
      }
      confirmationAttempts += 1
      const success = confirmationAttempts === 1
      await route.fulfill({
        status: success ? 200 : 400,
        contentType: "application/json",
        body: JSON.stringify(success ? { success: true } : { code: "INVALID_PASSWORD_RESET_TOKEN" }),
      })
    })

    await page.goto("/br/account/forgot-password", { waitUntil: "domcontentloaded" })
    const emailInput = page.locator("main form input[type=email]")
    await emailInput.fill("synthetic@example.test")
    await expect(emailInput).toHaveValue("synthetic@example.test")
    await page.getByRole("button", { name: "Enviar instrucoes" }).click()
    await expect(page.getByText("Se houver uma conta com este e-mail", { exact: false })).toBeVisible()
    expect(requestBodies.length).toBeGreaterThan(0)

    await page.goto(`/br/account/reset-password?token=${"a".repeat(120)}`, { waitUntil: "domcontentloaded" })
    await page.waitForTimeout(500)
    await page.locator("#password").fill("NewPassword123!")
    await page.locator("#confirmation").fill("NewPassword123!")
    await page.getByRole("button", { name: "Salvar nova senha" }).click()
    await expect.poll(() => confirmationAttempts).toBe(1)
    await expect(page.getByText("Sua senha foi atualizada com sucesso.", { exact: false })).toBeVisible()

    await page.reload({ waitUntil: "domcontentloaded" })
    await page.waitForTimeout(500)
    await page.locator("#password").fill("NewPassword123!")
    await page.locator("#confirmation").fill("NewPassword123!")
    await page.getByRole("button", { name: "Salvar nova senha" }).click()
    await expect(page.getByRole("alert")).toContainText("Solicite um novo link")
    expect(confirmationAttempts).toBe(2)
  })
})
