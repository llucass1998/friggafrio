import { forceBrazilCheckoutCountry } from "./force-brazil-checkout-country"

describe("forceBrazilCheckoutCountry", () => {
  it("overwrites selectable country values on checkout addresses", () => {
    const req = {
      body: {
        shipping_address: { country_code: "us" },
        billing_address: { country_code: "ar" },
      },
    }
    const next = jest.fn()

    forceBrazilCheckoutCountry(req as never, {} as never, next)

    expect(req.body.shipping_address.country_code).toBe("br")
    expect(req.body.billing_address.country_code).toBe("br")
    expect(next).toHaveBeenCalledTimes(1)
  })
})
