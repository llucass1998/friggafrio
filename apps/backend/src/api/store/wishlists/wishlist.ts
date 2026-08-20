import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import type { AuthenticatedMedusaRequest } from "@medusajs/framework/http"
import { WISHLIST_MODULE } from "../../../modules/wishlist"
import WishlistService from "../../../modules/wishlist/service"

type WishlistRecord = {
  id: string
  customer_id: string
  is_primary: boolean
}

type WishlistItemRecord = {
  id: string
  wishlist_id: string
  product_id: string
}

type ProductQuery = {
  graph: (input: {
    entity: string
    fields: string[]
    filters: Record<string, unknown>
  }) => Promise<{ data: Array<{ id: string }> }>
}

export const requireCustomerId = (req: AuthenticatedMedusaRequest): string => {
  const customerId = req.auth_context?.actor_id
  if (!customerId) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Unauthorized")
  }
  return customerId
}

export const normalizeProductIds = (productIds: readonly string[]): string[] =>
  Array.from(new Set(productIds.map((productId) => productId.trim()).filter(Boolean)))

const serviceFor = (req: AuthenticatedMedusaRequest): WishlistService =>
  req.scope.resolve(WISHLIST_MODULE)

export const findPrimaryWishlist = async (
  service: WishlistService,
  customerId: string,
): Promise<WishlistRecord | undefined> => {
  const wishlists = await service.listWishlists({
    customer_id: customerId,
    is_primary: true,
  })
  return wishlists[0] as WishlistRecord | undefined
}

export const getOrCreatePrimaryWishlist = async (
  service: WishlistService,
  customerId: string,
): Promise<WishlistRecord> => {
  const existing = await findPrimaryWishlist(service, customerId)
  if (existing) return existing

  try {
    return await service.createWishlists({
      customer_id: customerId,
      is_primary: true,
    }) as WishlistRecord
  } catch (error) {
    // The database index serializes first-use races from concurrent requests.
    const concurrentWishlist = await findPrimaryWishlist(service, customerId)
    if (concurrentWishlist) return concurrentWishlist
    throw error
  }
}

export const listWishlistItems = async (
  service: WishlistService,
  wishlistId: string,
): Promise<WishlistItemRecord[]> =>
  (await service.listWishlistItems({ wishlist_id: wishlistId })) as WishlistItemRecord[]

export const addWishlistProduct = async (
  service: WishlistService,
  wishlistId: string,
  productId: string,
): Promise<void> => {
  const existing = await service.listWishlistItems({
    wishlist_id: wishlistId,
    product_id: productId,
  })
  if (existing.length) return

  try {
    await service.createWishlistItems({
      wishlist_id: wishlistId,
      product_id: productId,
    })
  } catch (error) {
    // A simultaneous add is successful if the competing request created it.
    const concurrentItem = await service.listWishlistItems({
      wishlist_id: wishlistId,
      product_id: productId,
    })
    if (concurrentItem.length) return
    throw error
  }
}

export const assertProductsExist = async (
  req: AuthenticatedMedusaRequest,
  productIds: readonly string[],
): Promise<void> => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY) as ProductQuery
  const products = await Promise.all(productIds.map(async (productId) => {
    const { data } = await query.graph({
      entity: "product",
      fields: ["id"],
      filters: { id: productId },
    })
    return data[0]
  }))

  if (products.some((product) => !product)) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Product not found")
  }
}

export const serializeWishlist = async (
  service: WishlistService,
  wishlist: WishlistRecord | undefined,
) => {
  const items = wishlist ? await listWishlistItems(service, wishlist.id) : []
  return {
    wishlist: wishlist
      ? {
          id: wishlist.id,
          product_ids: items.map((item) => item.product_id),
        }
      : null,
  }
}

export const wishlistServiceFor = serviceFor
