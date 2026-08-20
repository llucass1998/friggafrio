import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { WISHLIST_MODULE } from "../../../modules/wishlist"
import { GET } from "./route"
import { POST as addItem } from "./items/route"
import { DELETE as removeItem } from "./items/[product_id]/route"
import { POST as mergeWishlist } from "./merge/route"

type Wishlist = { id: string; customer_id: string; is_primary: boolean }
type WishlistItem = { id: string; wishlist_id: string; product_id: string }

const response = () => {
  const result: {
    statusCode?: number
    body?: unknown
    status: jest.Mock
    json: jest.Mock
    send: jest.Mock
  } = {
    status: jest.fn((statusCode: number) => {
      result.statusCode = statusCode
      return result
    }),
    json: jest.fn((body: unknown) => {
      result.body = body
      return result
    }),
    send: jest.fn(),
  }
  return result
}

const fixture = (productIds = ["prod_1", "prod_2", "prod_3"]) => {
  const wishlists: Wishlist[] = []
  const items: WishlistItem[] = []
  let nextId = 1

  const service = {
    listWishlists: jest.fn(async (filters: Partial<Wishlist>) =>
      wishlists.filter((wishlist) =>
        Object.entries(filters).every(([key, value]) => wishlist[key as keyof Wishlist] === value),
      ),
    ),
    createWishlists: jest.fn(async (input: Omit<Wishlist, "id">) => {
      const wishlist = { id: `wishlist_${nextId++}`, ...input }
      wishlists.push(wishlist)
      return wishlist
    }),
    listWishlistItems: jest.fn(async (filters: Partial<WishlistItem>) =>
      items.filter((item) =>
        Object.entries(filters).every(([key, value]) => item[key as keyof WishlistItem] === value),
      ),
    ),
    createWishlistItems: jest.fn(async (input: Omit<WishlistItem, "id">) => {
      const item = { id: `item_${nextId++}`, ...input }
      items.push(item)
      return item
    }),
    deleteWishlistItems: jest.fn(async (ids: string[]) => {
      for (const id of ids) {
        const index = items.findIndex((item) => item.id === id)
        if (index >= 0) items.splice(index, 1)
      }
    }),
  }

  const query = {
    graph: jest.fn(async ({ filters }: { filters: { id: string } }) => ({
      data: productIds.includes(filters.id) ? [{ id: filters.id }] : [],
    })),
  }

  const request = ({
    actorId,
    body,
    productId,
  }: {
    actorId?: string
    body?: unknown
    productId?: string
  } = {}) => ({
    body,
    params: productId ? { product_id: productId } : {},
    auth_context: actorId ? { actor_id: actorId } : undefined,
    scope: {
      resolve: (key: unknown) => {
        if (key === WISHLIST_MODULE) return service
        if (key === ContainerRegistrationKeys.QUERY) return query
        return undefined
      },
    },
  })

  return { wishlists, items, service, request }
}

describe("authenticated customer wishlist routes", () => {
  it("rejects unauthenticated requests before resolving customer data", async () => {
    const { request } = fixture()
    await expect(GET(request() as never, response() as never))
      .rejects.toMatchObject({ type: "unauthorized" })
    await expect(addItem(request({ body: { product_id: "prod_1" } }) as never, response() as never))
      .rejects.toMatchObject({ type: "unauthorized" })
  })

  it("uses only auth context for the wishlist owner", async () => {
    const { wishlists, request } = fixture()
    const res = response()

    await addItem(request({
      actorId: "customer_a",
      body: { product_id: "prod_1" },
    }) as never, res as never)

    expect(wishlists).toEqual([
      expect.objectContaining({ customer_id: "customer_a", is_primary: true }),
    ])
  })

  it("lists only the authenticated customer's primary wishlist", async () => {
    const { wishlists, items, request } = fixture()
    wishlists.push(
      { id: "wishlist_a", customer_id: "customer_a", is_primary: true },
      { id: "wishlist_b", customer_id: "customer_b", is_primary: true },
    )
    items.push(
      { id: "item_a", wishlist_id: "wishlist_a", product_id: "prod_1" },
      { id: "item_b", wishlist_id: "wishlist_b", product_id: "prod_2" },
    )
    const res = response()

    await GET(request({ actorId: "customer_a" }) as never, res as never)

    expect(res.body).toEqual({
      wishlist: { id: "wishlist_a", product_ids: ["prod_1"] },
    })
  })

  it("adds a product idempotently without duplicate wishlist items", async () => {
    const { items, request } = fixture()

    await addItem(request({ actorId: "customer_a", body: { product_id: "prod_1" } }) as never, response() as never)
    await addItem(request({ actorId: "customer_a", body: { product_id: "prod_1" } }) as never, response() as never)

    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({ product_id: "prod_1" })
  })

  it("never removes an item from another customer's wishlist", async () => {
    const { wishlists, items, request } = fixture()
    wishlists.push({ id: "wishlist_b", customer_id: "customer_b", is_primary: true })
    items.push({ id: "item_b", wishlist_id: "wishlist_b", product_id: "prod_1" })
    const res = response()

    await removeItem(request({ actorId: "customer_a", productId: "prod_1" }) as never, res as never)

    expect(res.statusCode).toBe(204)
    expect(items).toEqual([
      expect.objectContaining({ wishlist_id: "wishlist_b", product_id: "prod_1" }),
    ])
  })

  it("removes the caller's item and returns the same non-enumerating response when absent", async () => {
    const { wishlists, items, request } = fixture()
    wishlists.push({ id: "wishlist_a", customer_id: "customer_a", is_primary: true })
    items.push({ id: "item_a", wishlist_id: "wishlist_a", product_id: "prod_1" })

    const removed = response()
    await removeItem(request({ actorId: "customer_a", productId: "prod_1" }) as never, removed as never)
    const absent = response()
    await removeItem(request({ actorId: "customer_a", productId: "prod_1" }) as never, absent as never)

    expect(items).toEqual([])
    expect(removed.statusCode).toBe(204)
    expect(absent.statusCode).toBe(204)
  })

  it("merges deduplicated guest products idempotently into the authenticated wishlist", async () => {
    const { items, request } = fixture()
    const first = response()

    await mergeWishlist(request({
      actorId: "customer_a",
      body: { product_ids: ["prod_1", "prod_2", "prod_1"] },
    }) as never, first as never)
    await mergeWishlist(request({
      actorId: "customer_a",
      body: { product_ids: ["prod_2", "prod_1"] },
    }) as never, response() as never)

    expect(items.map((item) => item.product_id).sort()).toEqual(["prod_1", "prod_2"])
    expect(first.body).toMatchObject({
      wishlist: { product_ids: expect.arrayContaining(["prod_1", "prod_2"]) },
    })
  })

  it("rejects invalid products before creating or changing a wishlist", async () => {
    const { wishlists, items, request } = fixture(["prod_1"])

    await expect(addItem(request({
      actorId: "customer_a",
      body: { product_id: "missing_product" },
    }) as never, response() as never)).rejects.toMatchObject({ type: "not_found" })
    await expect(mergeWishlist(request({
      actorId: "customer_a",
      body: { product_ids: ["prod_1", "missing_product"] },
    }) as never, response() as never)).rejects.toMatchObject({ type: "not_found" })

    expect(wishlists).toEqual([])
    expect(items).toEqual([])
  })
})
