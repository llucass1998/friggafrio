import { useCallback, useEffect, useSyncExternalStore } from "react"
import { toast } from "sonner"
import { useAuth } from "@/lib/hooks/use-auth"

// Kept as the anonymous visitor bucket for backwards compatibility.
export const FAVORITES_STORAGE_KEY = "friggafrio:favorites"

let favoriteIds: string[] = []
let activeStorageKey = FAVORITES_STORAGE_KEY
let initialized = false
const EMPTY_FAVORITES: string[] = []
const listeners = new Set<() => void>()
const mutationSequence = new Map<string, number>()
let nextMutationSequence = 0
const wishlistSyncRequests = new Map<string, Promise<WishlistResponse>>()

const notify = () => {
  listeners.forEach((listener) => listener())
}

export const customerFavoritesStorageKey = (customerId: string): string =>
  `${FAVORITES_STORAGE_KEY}:${customerId}`

export const parseFavoriteIds = (value: string | null): string[] => {
  if (!value) return []

  try {
    const parsed: unknown = JSON.parse(value)
    if (!Array.isArray(parsed)) return []

    return Array.from(new Set(
      parsed.filter((id): id is string => typeof id === "string")
        .map((id) => id.trim())
        .filter(Boolean),
    ))
  } catch {
    return []
  }
}

export const mergeFavoriteIds = (...lists: readonly (readonly string[])[]): string[] =>
  Array.from(new Set(lists.flatMap((ids) => ids.map((id) => id.trim()).filter(Boolean))))

export const toggleFavoriteId = (ids: readonly string[], id: string): string[] => {
  const normalizedId = id.trim()
  if (!normalizedId) return [...ids]

  return ids.includes(normalizedId)
    ? ids.filter((favoriteId) => favoriteId !== normalizedId)
    : [...ids, normalizedId]
}

const readFavorites = (storageKey: string): string[] => {
  try {
    return parseFavoriteIds(window.localStorage.getItem(storageKey))
  } catch {
    return []
  }
}

const writeFavorites = (storageKey: string, ids: readonly string[]) => {
  const normalizedIds = mergeFavoriteIds(ids)
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(normalizedIds))
  } catch {
    // Storage may be unavailable in private browsing or restricted contexts.
  }

  if (storageKey === activeStorageKey) {
    favoriteIds = normalizedIds
    notify()
  }
}

const selectFavoritesScope = (storageKey: string) => {
  activeStorageKey = storageKey
  favoriteIds = readFavorites(storageKey)
  notify()
}

const initializeFavorites = () => {
  if (initialized || typeof window === "undefined") return
  initialized = true
  selectFavoritesScope(activeStorageKey)

  window.addEventListener("storage", (event) => {
    if (event.key !== activeStorageKey) return
    favoriteIds = parseFavoriteIds(event.newValue)
    notify()
  })
}

// AuthProvider calls this before it clears the session so a just-unmounted
// product card cannot briefly render the previous customer's saved products.
export const resetFavoritesForLogout = () => {
  activeStorageKey = FAVORITES_STORAGE_KEY
  favoriteIds = []
  notify()
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

const getSnapshot = () => favoriteIds
const getServerSnapshot = () => EMPTY_FAVORITES

type WishlistResponse = {
  wishlist: {
    product_ids: string[]
  } | null
}

const responseProductIds = (response: WishlistResponse): string[] =>
  parseFavoriteIds(JSON.stringify(response.wishlist?.product_ids ?? []))

const getMedusaClient = async () => (await import("@/lib/medusa")).sdk

const synchronizeWishlist = (
  customerId: string,
  guestProductIds: readonly string[],
): Promise<WishlistResponse> => {
  const existing = wishlistSyncRequests.get(customerId)
  if (existing) return existing

  const request = getMedusaClient().then((sdk) => (
    guestProductIds.length
      ? sdk.client.fetch<WishlistResponse>("/store/wishlists/merge", {
          method: "POST",
          body: { product_ids: guestProductIds },
        })
      : sdk.client.fetch<WishlistResponse>("/store/wishlists", { method: "GET" })
  ))
  wishlistSyncRequests.set(customerId, request)
  const clearRequest = () => {
    if (wishlistSyncRequests.get(customerId) === request) {
      wishlistSyncRequests.delete(customerId)
    }
  }
  void request.then(clearRequest, clearRequest)
  return request
}

export function useFavorites() {
  const { isAuthenticated, customer } = useAuth()
  const ids = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const customerId = customer?.id
  const authenticated = isAuthenticated && Boolean(customerId)
  const storageKey = authenticated && customerId
    ? customerFavoritesStorageKey(customerId)
    : FAVORITES_STORAGE_KEY

  useEffect(() => {
    initializeFavorites()
    selectFavoritesScope(storageKey)
  }, [storageKey])

  useEffect(() => {
    if (!authenticated || !customerId) return

    let cancelled = false
    const synchronizeAuthenticatedWishlist = async () => {
      const guestProductIds = readFavorites(FAVORITES_STORAGE_KEY)
      const customerStorageKey = customerFavoritesStorageKey(customerId)

      try {
        const response = await synchronizeWishlist(customerId, guestProductIds)

        if (cancelled) return
        writeFavorites(customerStorageKey, responseProductIds(response))

        // Only consume the guest list we sent. A new guest action in another
        // tab must remain available for that tab's eventual sign-in.
        if (JSON.stringify(readFavorites(FAVORITES_STORAGE_KEY)) === JSON.stringify(guestProductIds)) {
          window.localStorage.removeItem(FAVORITES_STORAGE_KEY)
        }
      } catch {
        // Keep the guest list so a later authenticated request can merge it.
      }
    }

    void synchronizeAuthenticatedWishlist()
    return () => {
      cancelled = true
    }
  }, [authenticated, customerId])

  const toggleFavorite = useCallback(async (id: string) => {
    initializeFavorites()
    const normalizedId = id.trim()
    if (!normalizedId) return

    if (!authenticated) {
      writeFavorites(FAVORITES_STORAGE_KEY, toggleFavoriteId(favoriteIds, normalizedId))
      return
    }

    const previousIds = [...favoriteIds]
    const wasFavorite = previousIds.includes(normalizedId)
    const optimisticIds = toggleFavoriteId(previousIds, normalizedId)
    const mutationToken = ++nextMutationSequence
    mutationSequence.set(normalizedId, mutationToken)

    // Update every visible card immediately. The server response is reconciled
    // below, with a rollback if the mutation fails.
    writeFavorites(storageKey, optimisticIds)

    try {
      const sdk = await getMedusaClient()
      if (wasFavorite) {
        await sdk.client.fetch(`/store/wishlists/items/${encodeURIComponent(normalizedId)}`, {
          method: "DELETE",
          // The wishlist endpoint intentionally returns 204. Override the
          // SDK's JSON accept header so it does not parse an empty body.
          headers: { accept: "*/*" },
        })
        if (mutationSequence.get(normalizedId) === mutationToken) {
          writeFavorites(storageKey, favoriteIds.filter((favoriteId) => favoriteId !== normalizedId))
          mutationSequence.delete(normalizedId)
        }
        return
      }

      await sdk.client.fetch<WishlistResponse>("/store/wishlists/items", {
        method: "POST",
        body: { product_id: normalizedId },
      })
      if (mutationSequence.get(normalizedId) === mutationToken) {
        // Keep concurrent optimistic changes for other products intact. The
        // next scoped wishlist sync remains the authoritative reconciliation.
        writeFavorites(storageKey, mergeFavoriteIds(favoriteIds, [normalizedId]))
        mutationSequence.delete(normalizedId)
      }
    } catch (error) {
      if (mutationSequence.get(normalizedId) !== mutationToken) return
      mutationSequence.delete(normalizedId)
      const rollbackIds = previousIds.includes(normalizedId)
        ? mergeFavoriteIds(favoriteIds, [normalizedId])
        : favoriteIds.filter((favoriteId) => favoriteId !== normalizedId)
      writeFavorites(storageKey, rollbackIds)
      const message = error instanceof Error ? error.message : "Não foi possível atualizar os favoritos."
      toast.error(wasFavorite ? "Não foi possível remover o produto dos favoritos." : message)
    }
  }, [authenticated, storageKey])

  const isFavorite = useCallback((id: string) => ids.includes(id), [ids])

  return {
    favoriteIds: ids,
    favoriteCount: ids.length,
    isFavorite,
    toggleFavorite,
  }
}
