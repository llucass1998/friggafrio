import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { requireOwnedCheckoutCart } from "./require-owned-checkout-cart"

const requestFor = (actorId?: string, cart?: { customer_id?: string | null }) => {
  const graph = jest.fn().mockResolvedValue({ data: cart ? [cart] : [] })
  return {
    request: {
      params: { id: "cart_private" },
      auth_context: actorId ? { actor_id: actorId } : undefined,
      scope: { resolve: (key: unknown) => key === ContainerRegistrationKeys.QUERY ? { graph } : undefined },
    },
    graph,
  }
}

describe("requireOwnedCheckoutCart", () => {
  it("queries completion carts through the authenticated customer before continuing", async () => {
    const { request, graph } = requestFor("customer_owner", { customer_id: "customer_owner" })
    const next = jest.fn()

    await requireOwnedCheckoutCart(request as never, {} as never, next)

    expect(graph).toHaveBeenCalledWith({
      entity: "cart",
      fields: ["id", "customer_id"],
      filters: { id: "cart_private", customer_id: "customer_owner" },
    })
    expect(next).toHaveBeenCalledTimes(1)
  })

  it("rejects an unauthenticated or foreign completion without cart enumeration", async () => {
    const unauthenticated = requestFor()
    await expect(requireOwnedCheckoutCart(unauthenticated.request as never, {} as never, jest.fn()))
      .rejects.toMatchObject({ type: "unauthorized" })
    expect(unauthenticated.graph).not.toHaveBeenCalled()

    const foreign = requestFor("customer_other")
    await expect(requireOwnedCheckoutCart(foreign.request as never, {} as never, jest.fn()))
      .rejects.toMatchObject({ type: "not_found", message: "Cart not found" })
    expect(foreign.graph).toHaveBeenCalledWith(expect.objectContaining({
      filters: { id: "cart_private", customer_id: "customer_other" },
    }))
  })
})
