import {
  CHECKOUT_PREPARATION_TTL_MS,
  checkoutPreparationExpiresAt,
  checkoutReadinessToken,
  isAuthenticCheckoutPreparationMarker,
  isCheckoutPreparationMarker,
  normalizeBrazilAddress,
  stableCheckoutHash,
  checkoutSnapshotFromCart,
  validateCheckoutContact,
} from "./checkout-preparation"

describe("checkout preparation contract", () => {
  it("normalizes Brazilian postal codes and rejects foreign addresses", () => {
    const normalized = normalizeBrazilAddress({
      first_name: "Ana",
      last_name: "Silva",
      address_1: "Rua A, 10",
      city: "Sao Paulo",
      postal_code: "01310-100",
      country_code: "BR",
      province: "SP",
    })
    expect(normalized.errors).toEqual([])
    expect(normalized.address).toMatchObject({ country_code: "br", postal_code: "01310-100" })

    const foreign = normalizeBrazilAddress({ country_code: "us", province: "rj", postal_code: "00000" })
    expect(foreign.errors.map((error) => error.code)).toContain("INVALID_COUNTRY")
    expect(foreign.errors.map((error) => error.code)).toContain("INVALID_PROVINCE")
    expect(foreign.errors.map((error) => error.code)).toContain("INVALID_POSTAL_CODE")
  })

  it("rejects unsafe names and malformed phone numbers server-side", () => {
    const result = normalizeBrazilAddress({
      first_name: "Ana 123",
      last_name: "Silva",
      address_1: "Rua A",
      city: "Sao Paulo",
      postal_code: "01310-100",
      province: "SP",
      country_code: "BR",
      phone: "11111111111",
    })
    expect(result.errors.map((error) => error.code)).toEqual(expect.arrayContaining(["INVALID_NAME", "INVALID_PHONE"]))
  })

  it("requires a server-side email but permits guest carts without customer_id", () => {
    expect(validateCheckoutContact({
      email: "guest@example.com",
      shipping_address: { first_name: "Guest", last_name: "Buyer" },
    })).toEqual([])
    expect(validateCheckoutContact({
      email: "not-an-email",
      shipping_address: { first_name: "Guest" },
    }).map((error) => error.code)).toEqual(["INVALID_EMAIL", "MISSING_CONTACT_NAME"])
  })

  it("keeps preparation tokens stable for an unchanged snapshot", () => {
    const first = stableCheckoutHash({ b: 2, a: 1 })
    const second = stableCheckoutHash({ a: 1, b: 2 })
    expect(first).toBe(second)
    expect(checkoutReadinessToken("cart_1", first)).toBe(checkoutReadinessToken("cart_1", second))
    expect(checkoutPreparationExpiresAt(Date.UTC(2026, 0, 1))).toBe("2026-01-01T00:15:00.000Z")
  })

  it("keeps pickup delivery-free but binds the customer billing address to the snapshot", () => {
    const base = {
      id: "cart_pickup",
      email: "buyer@example.com",
      currency_code: "brl",
      billing_address: {
        first_name: "Ana",
        last_name: "Silva",
        address_1: "Rua A, 1",
        city: "São Paulo",
        postal_code: "01310-100",
        province: "SP",
        country_code: "br",
      },
      shipping_methods: [{ shipping_option_id: "FRIGGAFRIO_PICKUP_STORE_1", amount: 0 }],
      item_subtotal: 100,
      tax_total: 0,
      discount_total: 0,
      total: 100,
    }
    const first = checkoutSnapshotFromCart({ ...base, shipping_address: undefined, allow_missing_shipping_address: true })
    const changed = checkoutSnapshotFromCart({ ...base, shipping_address: undefined, allow_missing_shipping_address: true, billing_address: { ...base.billing_address, address_1: "Rua B, 2" } })
    expect(first?.address).toBeNull()
    expect(first?.billing_address).toMatchObject({ address_1: "Rua A, 1" })
    expect(stableCheckoutHash(first)).not.toBe(stableCheckoutHash(changed))
  })

  it("recognizes only complete server-owned readiness markers", () => {
    expect(isCheckoutPreparationMarker({
      state: "READY_FOR_PAYMENT",
      snapshot_hash: "snapshot",
      token_hash: "token",
      expires_at: "2026-01-01T00:15:00.000Z",
    })).toBe(true)
    expect(isCheckoutPreparationMarker({ state: "READY_FOR_PAYMENT" })).toBe(false)
    expect(isCheckoutPreparationMarker({ state: "ORDER_CREATED" })).toBe(false)
  })

  it("rejects client-forged or out-of-window readiness markers", () => {
    const expiresAt = new Date(Date.now() + 60_000).toISOString()
    const marker = {
      state: "READY_FOR_PAYMENT" as const,
      snapshot_hash: "snapshot",
      token_hash: checkoutReadinessToken("cart_1", "snapshot", expiresAt),
      expires_at: expiresAt,
    }
    expect(isAuthenticCheckoutPreparationMarker("cart_1", marker)).toBe(true)
    expect(isAuthenticCheckoutPreparationMarker("cart_other", marker)).toBe(false)
    expect(isAuthenticCheckoutPreparationMarker("cart_1", { ...marker, token_hash: "a".repeat(64) })).toBe(false)
    expect(isAuthenticCheckoutPreparationMarker("cart_1", {
      ...marker,
      expires_at: new Date(Date.now() + CHECKOUT_PREPARATION_TTL_MS + 1).toISOString(),
    })).toBe(false)
  })
})
