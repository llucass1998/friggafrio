import { expect, test } from "@playwright/test"

const backendUrl = "http://127.0.0.1:9000"
const publishableKey = process.env.VITE_MEDUSA_PUBLISHABLE_KEY?.trim()
  || "pk_99c64d5a87e0109049ed7333c05d7160483814d28b14d8a0c1c4f9aa13773cd1"
const regionId = "reg_01KZRPFF8N4VRAKJXTMX0NQGBT"

test.describe.configure({ mode: "serial" })

test("critical routes keep browser console and page errors clean", async ({ page, request }) => {
  const productsResponse = await request.get(
    `${backendUrl}/store/products?limit=100&region_id=${regionId}&fields=id,title,handle,*images`,
    { headers: { "x-publishable-api-key": publishableKey } },
  )
  expect(productsResponse.ok()).toBe(true)
  const products = (await productsResponse.json()).products as Array<{ handle: string; images?: unknown[] }>
  const singleImage = products.find((product) => (product.images?.length ?? 0) <= 1)
  const multiImage = products.find((product) => (product.images?.length ?? 0) > 1)
  expect(singleImage?.handle).toBeTruthy()

  const consoleMessages: string[] = []
  const pageErrors: string[] = []
  const serverErrors: string[] = []
  const forbiddenExternalRequests: string[] = []
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") {
      consoleMessages.push(`${message.type()} @ ${page.url()}: ${message.text()}`)
    }
  })
  page.on("pageerror", (error) => pageErrors.push(error.message))
  page.on("response", (response) => {
    if (response.status() >= 500) serverErrors.push(`${response.status()} ${response.url()}`)
  })
  page.on("request", (requestEvent) => {
    const url = new URL(requestEvent.url())
    if (url.hostname !== "127.0.0.1" && url.hostname !== "localhost") {
      // Product media may retain the canonical first-party upload URL.
      if (url.hostname === "friggafrio.istigestao.com.br" && url.pathname.startsWith("/uploads/")) {
        return
      }
      forbiddenExternalRequests.push(`${url.origin}${url.pathname}`)
    }
  })

  const routes = [
    "/br",
    "/br/store",
    "/br/cart",
    "/br/login",
    `/br/products/${singleImage!.handle}`,
    ...(multiImage ? [`/br/products/${multiImage.handle}`] : []),
  ]
  for (const route of routes) {
    await page.goto(route, { waitUntil: "networkidle" })
    await expect(page.locator("body")).not.toContainText("Application error")
  }

  await page.goto("/br", { waitUntil: "networkidle" })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByTestId("mobile-navigation-trigger").click()
  await expect(page.getByTestId("mobile-navigation-drawer")).toHaveAttribute("data-state", "open")
  await page.getByTestId("mobile-navigation-drawer").getByRole("button", { name: "Acessibilidade", exact: true }).click()
  await expect(page.getByRole("dialog", { name: "Recursos de Acessibilidade" })).toBeVisible()
  await page.keyboard.press("Escape")

  const unexpectedConsoleMessages = consoleMessages.filter((message) =>
    !message.includes("/store/customers/me")
    && !message.includes("/store/auth/session")
    && !message.includes("401 (Unauthorized)")
  )
  expect(unexpectedConsoleMessages, JSON.stringify({ consoleMessages, pageErrors, serverErrors })).toEqual([])
  expect(pageErrors, JSON.stringify({ consoleMessages, pageErrors, serverErrors })).toEqual([])
  expect(serverErrors, JSON.stringify({ consoleMessages, pageErrors, serverErrors })).toEqual([])
  expect(forbiddenExternalRequests).toEqual([])
})
