import { useCallback, useEffect, useSyncExternalStore } from "react"

export const FAVORITES_STORAGE_KEY = "friggafrio:favorites"

let favoriteIds: string[] = []
let initialized = false
const EMPTY_FAVORITES: string[] = []
const listeners = new Set<() => void>()

const notify = () => {
  listeners.forEach((listener) => listener())
}

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

export const toggleFavoriteId = (ids: readonly string[], id: string): string[] => {
  const normalizedId = id.trim()
  if (!normalizedId) return [...ids]

  return ids.includes(normalizedId)
    ? ids.filter((favoriteId) => favoriteId !== normalizedId)
    : [...ids, normalizedId]
}

const persistFavorites = (ids: string[]) => {
  favoriteIds = ids
  try {
    window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(ids))
  } catch {
    // Storage may be unavailable in private browsing or restricted contexts.
  }
  notify()
}

const initializeFavorites = () => {
  if (initialized || typeof window === "undefined") return
  initialized = true
  try {
    favoriteIds = parseFavoriteIds(window.localStorage.getItem(FAVORITES_STORAGE_KEY))
  } catch {
    favoriteIds = []
  }
  notify()

  window.addEventListener("storage", (event) => {
    if (event.key !== FAVORITES_STORAGE_KEY) return
    favoriteIds = parseFavoriteIds(event.newValue)
    notify()
  })
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

const getSnapshot = () => {
  return favoriteIds
}

const getServerSnapshot = () => EMPTY_FAVORITES

export function useFavorites() {
  const ids = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  useEffect(() => {
    initializeFavorites()
  }, [])

  const toggleFavorite = useCallback((id: string) => {
    initializeFavorites()
    persistFavorites(toggleFavoriteId(favoriteIds, id))
  }, [])

  const isFavorite = useCallback((id: string) => ids.includes(id), [ids])

  return {
    favoriteIds: ids,
    favoriteCount: ids.length,
    isFavorite,
    toggleFavorite,
  }
}
