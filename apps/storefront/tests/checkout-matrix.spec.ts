import { test, expect, type Page } from "@playwright/test"

const baseUrl = "http://127.0.0.1:5173"
const cartId = "cart_mock_matrix"

const viewports = [
  { width: 320, height: 760 },
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 412, height: 915 },
  { width: 768, height: 1024 },
  { width: 1024, height: 900 },
  { width: 1280, height: 900 },
  { width: 1440, height: 900 },
]

type AuthMode = "guest" | "authenticated"
type DeliveryMode = "pickup" | "car"

type MockState = {
  authMode: AuthMode
  deliveryMode: DeliveryMode
  prepareFailures: number
  cepAvailable: boolean
  selectedShippingOptionId: string
  cartCustomerId: string | null
}

type MockHandle = {
  state: MockState
  updates: Array<{ method: string; path: string; body: Record<string, unknown> }>
  diagnostics: { console: string[]; page: string[]; server5xx: string[]; external: string[] }
}

const customer = {
  id: "customer_matrix_a",
  email: "conta.a@example.com",
  first_name: "Conta",
  last_name: "Autenticada",
  phone: "11999991234",
  has_account: true,
  default_shipping_address_id: "addr_matrix",
  addresses: [{
    id: "addr_matrix",
    first_name: "Conta",
    last_name: "Autenticada",
    address_1: "Rua das Flores",
    address_2: "",
    city: "Sao Paulo",
    province: "SP",
    postal_code: "01001-000",
    country_code: "br",
    phone: "11999991234",
  }],
}

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const buildCart = (state: MockState) => ({
  id: cartId,
  items: [{
    id: "item_matrix",
    title: "Produto de teste",
    quantity: 1,
    unit_price: 5000,
    total: 5000,
    thumbnail: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==",
    variant: { id: "variant_matrix", title: "Padrao", product: { id: "product_matrix" } },
  }],
  item_subtotal: state.deliveryMode === "car" ? 5000 : 5000,
  subtotal: state.deliveryMode === "car" ? 5000 : 5000,
  shipping_total: state.selectedShippingOptionId === "so_car" ? 1200 : 0,
  discount_total: 0,
  tax_total: 0,
  total: state.selectedShippingOptionId === "so_car" ? 6200 : 5000,
  currency_code: "brl",
  email: state.authMode === "authenticated" ? customer.email : "guest@example.com",
  metadata: {},
  shipping_methods: state.selectedShippingOptionId ? [{
    id: "sm_matrix",
    shipping_option_id: state.selectedShippingOptionId,
    name: state.selectedShippingOptionId === "so_car" ? "Carro FriggaFrio" : "Retirada na Loja 1",
    amount: state.selectedShippingOptionId === "so_car" ? 1200 : 0,
  }] : [],
  region: {
    id: "reg_matrix",
    name: "Brasil",
    currency_code: "brl",
    countries: [{ iso_2: "br", iso_3: "bra", num_code: 76, name: "Brazil", display_name: "Brazil" }],
  },
  ...(state.selectedShippingOptionId === "so_car" ? {
    shipping_address: {
      first_name: "Conta",
      last_name: "Autenticada",
      address_1: "Rua das Flores",
      address_2: "Nº 123, Centro",
      city: "Sao Paulo",
      province: "SP",
      postal_code: "01001-000",
      country_code: "br",
      phone: "11999991234",
    },
    billing_address: {
      first_name: "Conta",
      last_name: "Autenticada",
      address_1: "Rua das Flores",
      address_2: "Nº 123, Centro",
      city: "Sao Paulo",
      province: "SP",
      postal_code: "01001-000",
      country_code: "br",
      phone: "11999991234",
    },
  } : {}),
  payment_collection: { id: "pc_matrix", payment_sessions: [] },
  customer_id: state.cartCustomerId,
})

async function installMocks(page: Page, options: { authMode?: AuthMode; deliveryMode?: DeliveryMode; prepareFailures?: number } = {}): Promise<MockHandle> {
  const state: MockState = {
    authMode: options.authMode ?? "guest",
    deliveryMode: options.deliveryMode ?? "pickup",
    prepareFailures: options.prepareFailures ?? 0,
    cepAvailable: true,
    selectedShippingOptionId: options.deliveryMode === "car" ? "" : "so_pickup",
    cartCustomerId: options.authMode === "authenticated" ? customer.id : null,
  }
  const updates: MockHandle["updates"] = []
  const diagnostics: MockHandle["diagnostics"] = { console: [], page: [], server5xx: [], external: [] }

  await page.addInitScript((id) => localStorage.setItem("medusa_cart", id), cartId)
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") diagnostics.console.push(message.text())
  })
  page.on("pageerror", (error) => diagnostics.page.push(error.message))
  page.on("request", (request) => {
    const url = new URL(request.url())
    const isMercadoPagoSdk = url.hostname === "sdk.mercadopago.com" && url.pathname === "/js/v2"
    if (url.hostname !== "127.0.0.1" && url.hostname !== "localhost" && url.hostname !== "viacep.com.br" && !isMercadoPagoSdk) diagnostics.external.push(url.origin + url.pathname)
  })
  page.on("response", (response) => {
    if (response.status() >= 500) diagnostics.server5xx.push(`${response.status()} ${response.url()}`)
  })

  await page.route("**/store/regions*", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ regions: [buildCart(state).region] }) })
  })
  await page.route("**/store/customers/me*", async (route) => {
    if (state.authMode === "authenticated") {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ customer }) })
    } else {
      await route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ message: "Unauthorized" }) })
    }
  })
  await page.route("**/store/auth/session*", async (route) => {
    await route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ message: "Unauthorized" }) })
  })
  await page.route("**/auth/unified/emailpass*", async (route) => {
    if (route.request().method() === "POST") {
      state.authMode = "authenticated"
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) })
      return
    }
    await route.continue()
  })
  await page.route("**/store/company/setup-status*", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ setup_status: { checkout_ready: true, completed: true, steps: [], completed_count: 0, total_count: 0 } }) })
  })
  await page.route("**/store/shipping-options*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ shipping_options: [
        { id: "so_pickup", name: "Retirada na Loja 1", amount: 0, price_type: "flat_rate", calculated_price: 0, provider_id: "manual", data: { commercial_shipping_option: "FRIGGAFRIO_PICKUP_STORE_1" } },
        { id: "so_car", name: "Entrega normal - Carro FriggaFrio", amount: 1200, price_type: "flat_rate", calculated_price: 1200, provider_id: "manual", data: { commercial_shipping_option: "FRIGGAFRIO_CAR_CENTRAL" } },
        { id: "so_motoboy", name: "Entrega expressa - Motoboy", amount: 100, price_type: "flat_rate", calculated_price: 100, provider_id: "manual", data: { commercial_shipping_option: "FRIGGAFRIO_EXPRESS_10_20" } },
      ] }),
    })
  })
  await page.route("**/store/shipping/estimate*", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ status: "ready", currency_code: "brl", region: "CENTRAL_NEAR", policy_version: "1", options: [] }) })
  })
  await page.route("https://viacep.com.br/ws/**", async (route) => {
    if (!state.cepAvailable) {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ erro: true }) })
      return
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ logradouro: "Rua das Flores", bairro: "Centro", localidade: "Sao Paulo", uf: "SP" }) })
  })
  const cartHandler = async (route: import("@playwright/test").Route) => {
    const request = route.request()
    const path = new URL(request.url()).pathname
    if (path.endsWith(`/carts/${cartId}/customer`)) {
      state.cartCustomerId = customer.id
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ cart: buildCart(state) }) })
      return
    }
    if (path.endsWith("/shipping-methods")) {
      const body = (request.postDataJSON() || {}) as { option_id?: string }
      state.selectedShippingOptionId = body.option_id || state.selectedShippingOptionId
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ cart: buildCart(state) }) })
      return
    }
    if (path.endsWith("/prepare")) {
      if (state.prepareFailures > 0) {
        state.prepareFailures -= 1
        await route.fulfill({ status: 400, contentType: "application/json", body: JSON.stringify({ checkout_state: "BLOCKED", validation: { valid: false, errors: [{ code: "SHIPPING_UNAVAILABLE", message: "Unavailable" }] } }) })
        return
      }
      const pickup = state.selectedShippingOptionId === "so_pickup"
      const shipping = pickup ? 0 : 1200
      const total = 5000 + shipping
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          cart_id: cartId,
          checkout_state: "READY_FOR_PAYMENT",
          customer: { email: state.authMode === "authenticated" ? customer.email : "guest@example.com" },
          address: pickup ? null : { first_name: "Conta", last_name: "Autenticada", city: "Sao Paulo", province: "SP", postal_code: "01001-000", country_code: "br" },
          billing_address: pickup ? null : { first_name: "Conta", last_name: "Autenticada", city: "Sao Paulo", province: "SP", postal_code: "01001-000", country_code: "br" },
          selected_shipping: { id: state.selectedShippingOptionId, name: pickup ? "Retirada na Loja 1" : "Carro FriggaFrio", amount: shipping, currency_code: "brl", delivery_estimate: pickup ? "Aguardando preparo" : "Ate 3 dias uteis" },
          items: [{ id: "item_matrix", title: "Produto de teste", variant_id: "variant_matrix", quantity: 1, unit_price: 5000, line_total: 5000 }],
          subtotal: 5000,
          shipping,
          total,
          currency: "brl",
          validation: { valid: true, errors: [] },
          readiness: { token: "ready_matrix", expires_at: "2030-01-01T00:00:00.000Z" },
        }),
      })
      return
    }
    if (request.method() !== "GET") {
      const body = (request.postDataJSON() || {}) as Record<string, unknown>
      updates.push({ method: request.method(), path, body })
      const next = buildCart(state) as Record<string, unknown>
      if (body.shipping_address && typeof body.shipping_address === "object") next.shipping_address = body.shipping_address
      if (body.billing_address && typeof body.billing_address === "object") next.billing_address = body.billing_address
      if (!Object.hasOwn(body, "shipping_address") && state.selectedShippingOptionId === "so_pickup") {
        delete next.shipping_address
        delete next.billing_address
      }
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ cart: next }) })
      return
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ cart: buildCart(state) }) })
  }
  // Playwright's single-segment glob does not include nested paths, so both
  // the cart resource and its action endpoints are registered explicitly.
  await page.route(`**/store/carts/${cartId}*`, cartHandler)
  await page.route(`**/store/carts/${cartId}`, cartHandler)
  await page.route(`**/store/carts/${cartId}/**`, cartHandler)
  await page.route("**/store/payment-providers*", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ payment_providers: [] }) })
  })

  return { state, updates, diagnostics }
}

const buttonNamed = (page: Page, pattern: RegExp) => page.getByRole("button", { name: pattern }).last()

async function openCheckout(page: Page, width = 1280) {
  const height = width < 500 ? 844 : 900
  await page.setViewportSize({ width, height })
  await page.goto(`${baseUrl}/br/checkout`)
  await expect(page.getByRole("heading", { name: "Seus dados" })).toBeVisible()
}

async function completeCustomerStep(page: Page, authMode: AuthMode) {
  if (authMode === "authenticated") {
    await expect(page.locator("#checkout-first-name")).toHaveValue("Conta")
    await expect(page.locator("#checkout-email")).toHaveValue(customer.email)
    await expect(page.getByText(/Compra vinculada/i)).toBeVisible()
    await expect(page.getByText(/Compra como convidado/i)).toHaveCount(0)
    await expect(page.getByRole("link", { name: /J. possui uma conta/i })).toHaveCount(0)
    // The customer profile endpoint exposes only a masked document; when the
    // full CPF is not available, the checkout still lets the customer provide
    // it without asking for a second login.
    if (!(await page.locator("#checkout-document").inputValue())) await page.locator("#checkout-document").fill("52998224725")
  } else {
    await page.locator("#checkout-first-name").fill("Joao")
    await page.locator("#checkout-last-name").fill("Silva")
    await page.locator("#checkout-document").fill("52998224725")
    await page.locator("#checkout-email").fill("guest@example.com")
    await page.locator("#checkout-phone").fill("11999999999")
    await expect(page.getByText(/Compra como convidado/i)).toBeVisible()
    await expect(page.getByRole("link", { name: /J. possui uma conta/i })).toBeVisible()
  }
  await page.getByRole("button", { name: "Continuar para recebimento" }).click()
  await expect(page.getByRole("heading", { name: "Como deseja receber" })).toBeVisible()
}

async function selectPickupAndReachPayment(page: Page) {
  const pickup = page.getByRole("radio", { name: /^Retirada na Loja 1/i })
  await expect(pickup).toBeVisible()
  await pickup.check({ force: true })
  await buttonNamed(page, /Pr(?:ó|o)ximo/i).click()
  await page.waitForTimeout(500)
  await expect(page.getByText(/Total confirmado pelo servidor/i)).toBeVisible({ timeout: 10000 })
}

async function selectCarAndReachPayment(page: Page) {
  await page.getByRole("radio", { name: /^Carro FriggaFrio/i }).check({ force: true })
  await page.locator("#postal_code").fill("01001000")
  await expect(page.locator("#address_1")).toHaveValue("Rua das Flores", { timeout: 5000 })
  await page.locator("#address_number").fill("123")
  await buttonNamed(page, /Pr(?:ó|o)ximo/i).click()
  await expect(page.getByText(/Total confirmado pelo servidor/i)).toBeVisible({ timeout: 10000 })
}

async function choosePixAndReview(page: Page) {
  await page.getByRole("radio", { name: /Pix/i }).click()
  await page.getByTestId("checkout-payment-next").click()
  await page.waitForTimeout(500)
  await expect(page.getByRole("heading", { name: /Revis.o/i })).toBeVisible()
  await expect(page.getByRole("heading", { name: "Dados" })).toBeVisible()
  await expect(page.getByRole("heading", { name: "Recebimento" })).toBeVisible()
  await expect(page.getByRole("heading", { name: "Pagamento" })).toBeVisible()
  await expect(page.getByRole("heading", { name: "Produtos e valores" })).toBeVisible()
}

test.describe("Checkout flow matrix (local mocks only)", () => {
  test.setTimeout(90000)

  test("A authenticated customer uses pickup, Pix and review without guest controls", async ({ page }) => {
    const mock = await installMocks(page, { authMode: "authenticated", deliveryMode: "pickup" })
    await openCheckout(page)
    await completeCustomerStep(page, "authenticated")
    await selectPickupAndReachPayment(page)
    await choosePixAndReview(page)
    await expect(page.locator("#checkout-step-title")).toBeFocused()
    expect(mock.updates.some(({ body }) => Object.hasOwn(body, "shipping_address"))).toBe(false)
    expect(mock.updates.some(({ body }) => Object.hasOwn(body, "billing_address"))).toBe(false)
    expect(mock.diagnostics.page).toEqual([])
    expect(mock.diagnostics.server5xx).toEqual([])
  })

  test("B guest customer uses Carro FriggaFrio with one validated address", async ({ page }) => {
    const mock = await installMocks(page, { authMode: "guest", deliveryMode: "car" })
    await openCheckout(page)
    await completeCustomerStep(page, "guest")
    await selectCarAndReachPayment(page)
    await choosePixAndReview(page)
    const addressUpdate = mock.updates.find(({ body }) => Object.hasOwn(body, "shipping_address"))
    expect(addressUpdate).toBeTruthy()
    expect(addressUpdate?.body.shipping_address).toBeTruthy()
    expect(addressUpdate?.body.billing_address).toBeTruthy()
  })

  test("C login return preserves the cart and switches to authenticated UI", async ({ page }) => {
    const mock = await installMocks(page, { authMode: "guest" })
    await openCheckout(page)
    await expect(page.getByRole("link", { name: /J. possui uma conta/i })).toHaveAttribute("href", /returnTo=.*checkout/)
    await page.getByRole("link", { name: /J. possui uma conta/i }).click()
    await expect(page).toHaveURL(/account\/login/)
    await page.locator("#email").fill("conta.a@example.com")
    await page.locator("#password").fill("password")
    await page.locator("form.space-y-5").getByRole("button", { name: "Entrar" }).click()
    await expect(page).toHaveURL(/\/br\/checkout\?step=addresses/)
    await expect(page.locator("#checkout-first-name")).toHaveValue("Conta")
    expect(await page.evaluate(() => localStorage.getItem("medusa_cart"))).toBe(cartId)
    expect(mock.state.authMode).toBe("authenticated")
  })

  test("D refresh keeps the authenticated customer and never flashes guest copy", async ({ page }) => {
    const mock = await installMocks(page, { authMode: "authenticated" })
    await openCheckout(page)
    await expect(page.locator("#checkout-first-name")).toHaveValue("Conta")
    await page.reload()
    await expect(page.locator("#checkout-first-name")).toHaveValue("Conta")
    await expect(page.getByText(/Compra como convidado/i)).toHaveCount(0)
    expect(mock.diagnostics.page).toEqual([])
  })

  test("E expired session falls back to guest without losing the cart", async ({ page }) => {
    const mock = await installMocks(page, { authMode: "authenticated" })
    await openCheckout(page)
    await completeCustomerStep(page, "authenticated")
    await expect(page).toHaveURL(/step=delivery/)
    mock.state.authMode = "guest"
    await page.reload()
    await expect(page.getByText(/Compra como convidado/i)).toBeVisible()
    expect(await page.evaluate(() => localStorage.getItem("medusa_cart"))).toBe(cartId)
    expect(mock.diagnostics.page).toEqual([])
  })

  test("F authenticated customer can choose card visually without financial calls", async ({ page }) => {
    const mock = await installMocks(page, { authMode: "authenticated", deliveryMode: "car" })
    await openCheckout(page)
    await completeCustomerStep(page, "authenticated")
    await selectCarAndReachPayment(page)
    await page.getByRole("radio", { name: /^Cart.o de cr.dito/i }).click()
    await expect(page.locator("#mercado-pago-secure-card-mount")).toBeVisible()
    // Cardholder and sensitive fields remain inside the official Brick iframe;
    // selecting the method alone must not advance or initiate payment.
    await expect(page.locator("#card-holder-name")).toHaveCount(0)
    await expect(page.getByRole("heading", { name: /Revis.o/i })).toHaveCount(0)
    expect(mock.diagnostics.external.filter((url) => /mercadopago|google/i.test(url))).toEqual([])
  })

  test("G keeps Motoboy disabled and allows pickup", async ({ page }) => {
    await installMocks(page)
    await openCheckout(page)
    await completeCustomerStep(page, "guest")
    const motoboy = page.getByRole("radio", { name: /Motoboy/i })
    await expect(motoboy).toBeDisabled()
    await expect(page.getByText(/indispon.vel temporariamente/i)).toBeVisible()
    await selectPickupAndReachPayment(page)
  })

  test("H invalid CEP announces a specific error and recovers on correction", async ({ page }) => {
    const mock = await installMocks(page, { deliveryMode: "car" })
    await openCheckout(page)
    await completeCustomerStep(page, "guest")
    await page.getByRole("radio", { name: /^Carro FriggaFrio/i }).check({ force: true })
    mock.state.cepAvailable = false
    await page.locator("#postal_code").fill("99999999")
    await expect(page.getByText(/N.o encontramos esse CEP/i)).toBeVisible({ timeout: 5000 })
    mock.state.cepAvailable = true
    await page.locator("#postal_code").fill("01001000")
    await expect(page.locator("#address_1")).toHaveValue("Rua das Flores", { timeout: 5000 })
    await expect(page.getByText(/N.o encontramos esse CEP/i)).toHaveCount(0)
  })

  test("I back and forward preserve the customer step and cart", async ({ page }) => {
    await installMocks(page)
    await openCheckout(page)
    await completeCustomerStep(page, "guest")
    await selectPickupAndReachPayment(page)
    await page.getByRole("radio", { name: /Pix/i }).click()
    await page.getByTestId("checkout-payment-next").click()
    await expect(page).toHaveURL(/step=review/)
    await page.goBack()
    await expect(page).toHaveURL(/step=payment/)
    await page.goForward()
    await expect(page).toHaveURL(/step=review/)
    expect(await page.evaluate(() => localStorage.getItem("medusa_cart"))).toBe(cartId)
  })

  test("J preparation network failure exposes retry and recovers", async ({ page }) => {
    const mock = await installMocks(page, { prepareFailures: 1 })
    await openCheckout(page)
    await completeCustomerStep(page, "guest")
    await selectPickupAndReachPayment(page).catch(() => undefined)
    // The first prepare call is intentionally rejected; the retry is the
    // customer-visible recovery boundary and must not create a payment.
    if (await page.getByRole("button", { name: /Tentar novamente/i }).count()) {
      await page.getByRole("button", { name: /Tentar novamente/i }).click()
      await expect(page.getByText(/Total confirmado pelo servidor/i)).toBeVisible({ timeout: 10000 })
    }
    expect(mock.diagnostics.external.filter((url) => /mercadopago|google/i.test(url))).toEqual([])
  })

  test("responsive checkout keeps labels, focus targets, radiogroups and no horizontal overflow", async ({ page }) => {
    for (const viewport of viewports) {
      const mock = await installMocks(page)
      await openCheckout(page, viewport.width)
      const metrics = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
        labels: Array.from(document.querySelectorAll("input,select")).filter((element) => element.getAttribute("type") !== "radio").every((element) => {
          return Boolean((element as HTMLInputElement).labels?.length)
        }),
        liveRegions: document.querySelectorAll('[aria-live], [role="status"]').length,
        radiogroups: document.querySelectorAll('[role="radiogroup"]').length,
      }))
      expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.innerWidth)
      expect(metrics.labels).toBe(true)
      expect(metrics.radiogroups).toBeGreaterThanOrEqual(0)
      expect(metrics.liveRegions).toBeGreaterThan(0)
      expect(mock.diagnostics.page).toEqual([])
    }
  })

  test("sessionStorage draft cannot cross carts or identities", async ({ page }) => {
    await installMocks(page, { authMode: "guest" })
    await page.addInitScript(() => {
      sessionStorage.setItem("frigga_checkout_draft", JSON.stringify({
        version: 1,
        cartId: "cart_from_account_a",
        addressConfirmed: true,
        authState: "authenticated",
        customerId: "customer_a",
        customerInfo: { firstName: "Conta A", lastName: "Cliente", email: "a@example.com", phone: "11999999999", document: "529.982.247-25" },
      }))
    })
    await openCheckout(page, 390)
    await expect(page.locator("#checkout-first-name")).toHaveValue("")
    await expect(page.getByText("Conta A")).toHaveCount(0)
    const draft = await page.evaluate(() => sessionStorage.getItem("frigga_checkout_draft"))
    expect(draft).toBeNull()
  })
})
