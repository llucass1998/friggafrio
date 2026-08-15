import { HttpTypes } from "@medusajs/types"
import { QueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/lib/utils/query-keys"

// ============ STORED CART ============

const CART_KEY = "medusa_cart"

// Multiple shell components ask for the current cart on the same render.
// Share an in-flight lookup so a stale ID produces one 404 and one recovery,
// rather than one request per component/query-fields variant.
const inFlightCartLookups = new Map<string, Promise<{ cart: HttpTypes.StoreCart }>>()

export const getStoredCart = (): string | undefined => {
  return localStorage.getItem(CART_KEY) || undefined
}

export const setStoredCart = (cart: string): void => {
  localStorage.setItem(CART_KEY, cart)
}

export const removeStoredCart = (): void => {
  localStorage.removeItem(CART_KEY)
}

export const retrieveCartOnce = (
  cartId: string,
  request: () => Promise<{ cart: HttpTypes.StoreCart }>,
): Promise<{ cart: HttpTypes.StoreCart }> => {
  const pending = inFlightCartLookups.get(cartId)
  if (pending) {
    return pending
  }

  const current = request()
  inFlightCartLookups.set(cartId, current)
  const clear = () => {
    if (inFlightCartLookups.get(cartId) === current) {
      inFlightCartLookups.delete(cartId)
    }
  }
  void current.then(clear, clear)
  return current
}

/** Detect only a missing cart response; auth and server failures are not stale-cart recovery cases. */
export const isCartNotFoundError = (error: unknown): boolean => {
  if (!error || typeof error !== "object") {
    return false
  }

  const candidate = error as {
    status?: unknown
    statusCode?: unknown
    code?: unknown
    type?: unknown
    message?: unknown
    response?: { status?: unknown }
    cause?: { status?: unknown; statusCode?: unknown; code?: unknown; type?: unknown; message?: unknown }
  }

  const status = candidate.status ?? candidate.statusCode ?? candidate.response?.status
    ?? candidate.cause?.status ?? candidate.cause?.statusCode
  const code = candidate.code ?? candidate.cause?.code
  const type = candidate.type ?? candidate.cause?.type
  const message = String(candidate.message ?? candidate.cause?.message ?? "").toLowerCase()

  return status === 404 || code === "CART_NOT_FOUND" || type === "not_found"
    || message.includes("cart not found")
    || message.includes("cart_not_found")
    || (message.includes("cart") && message.includes("not found"))
}

// ============ SORT CART ITEMS ============

export const sortCartItems = (items: HttpTypes.StoreCartLineItem[]): HttpTypes.StoreCartLineItem[] => {
  return [...items].sort((a, b) => {
    if (!a.created_at || !b.created_at) {
      return 0
    }
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  })
}

// ============ CART HELPERS ============

export const getCartItemCount = (
  items?: ReadonlyArray<Pick<HttpTypes.StoreCartLineItem, "quantity">>
): number => {
  return items?.reduce((total, item) => {
    return Number.isSafeInteger(item.quantity) && item.quantity > 0
      ? total + item.quantity
      : total
  }, 0) || 0
}

type CartCommercialMetadata = Record<string, unknown>

type CartLineWithCommercialMetadata = HttpTypes.StoreCartLineItem & {
  metadata?: CartCommercialMetadata
  variant?: HttpTypes.StoreProductVariant & {
    metadata?: CartCommercialMetadata
    product?: { metadata?: CartCommercialMetadata }
  }
}

export type CartLineCommercialState = "standard" | "quote_only" | "price_pending" | "out_of_stock" | "invalid"

/** Resolve product commercial metadata carried by a Store API cart line. */
export const getCartLineCommercialState = (
  item: HttpTypes.StoreCartLineItem
): CartLineCommercialState => {
  const line = item as CartLineWithCommercialMetadata
  // Store responses can carry commercial flags at any of these persisted levels.
  // Merge rather than picking the first object so an empty line metadata object
  // cannot hide the product-level contract.
  const metadata = {
    ...(line.variant?.product?.metadata ?? {}),
    ...(line.variant?.metadata ?? {}),
    ...(line.metadata ?? {}),
  }

  if ((line.quantity !== undefined && (!Number.isSafeInteger(line.quantity) || line.quantity < 1)) || (line.variant_id !== undefined && !line.variant_id)) {
    return "invalid"
  }

  if (
    metadata.is_quote_only === true ||
    metadata.commercial_status === "QUOTE_ONLY"
  ) {
    return "quote_only"
  }

  if (
    metadata.price_pending === true ||
    metadata.price_approval_status === "pending" ||
    metadata.purchase_enabled === false
  ) {
    return "price_pending"
  }

  const inventoryQuantity = (line.variant as { inventory_quantity?: unknown } | undefined)?.inventory_quantity
  const managesInventory = (line.variant as { manage_inventory?: unknown } | undefined)?.manage_inventory
  const allowsBackorder = (line.variant as { allow_backorder?: unknown } | undefined)?.allow_backorder
  if (
    managesInventory === true &&
    allowsBackorder !== true &&
    (typeof inventoryQuantity !== "number" || !Number.isSafeInteger(inventoryQuantity) || inventoryQuantity < line.quantity)
  ) {
    return "out_of_stock"
  }

  // A missing amount is not a free item. A numeric zero remains distinct here
  // so the server can decide whether an explicit zero-price promotion is valid.
  if (typeof line.total !== "number" || typeof line.unit_price !== "number") {
    return "price_pending"
  }

  return "standard"
}

/** A cart is safe to advance only when every persisted line is commercially purchasable. */
export const isCartCheckoutReady = (items?: HttpTypes.StoreCartLineItem[]): boolean =>
  !!items?.length && items.every((item) => getCartLineCommercialState(item) === "standard")

export const cartCommercialStateLabel = (state: CartLineCommercialState): string => {
  switch (state) {
    case "quote_only":
      return "Somente sob cotação"
    case "price_pending":
      return "Preço em configuração"
    case "out_of_stock":
      return "Sem estoque disponível"
    case "invalid":
      return "Item indisponível"
    default:
      return ""
  }
}

/** Keep malformed quantities out of optimistic state and Store API requests. */
export const assertPositiveIntegerQuantity = (quantity: number): number => {
  if (!Number.isSafeInteger(quantity) || quantity <= 0) {
    throw new Error("Cart quantity must be a positive integer")
  }

  return quantity
}

// ============ OPTIMISTIC CART ============

export interface OptimisticCartItem {
  id: string;
  variant_id: string;
  quantity: number;
  title: string;
  thumbnail?: string | null;
  product_title?: string;
  variant_title?: string;
  product?: {
    id: string;
    title: string;
  };
  variant?: {
    id: string;
    title: string;
    product?: {
      metadata?: CartCommercialMetadata;
    };
  };
  unit_price?: number;
  total?: number;
  isOptimistic?: boolean;
}

export interface OptimisticCart extends HttpTypes.StoreCart {
  isOptimistic?: boolean;
}

export const createOptimisticCartItem = (
  variant: HttpTypes.StoreProductVariant,
  product: HttpTypes.StoreProduct,
  quantity: number = 1
): OptimisticCartItem => {
  assertPositiveIntegerQuantity(quantity)
  const calculatedAmount = variant.calculated_price?.calculated_amount
  const unitPrice = typeof calculatedAmount === "number" ? calculatedAmount : undefined

  return {
    id: `optimistic-${variant.id}-${Date.now()}`,
    variant_id: variant.id,
    quantity,
    title: product.title,
    thumbnail: product.thumbnail,
    product: {
      id: product.id,
      title: product.title,
    },
    product_title: product.title,
    variant: {
      id: variant.id,
      title: variant.title || "Default Variant",
      product: { metadata: product.metadata as CartCommercialMetadata | undefined },
    },
    variant_title: variant.title || "Default Variant",
    unit_price: unitPrice,
    total: unitPrice === undefined ? undefined : unitPrice * quantity,
    isOptimistic: true,
  }
}

export const addItemOptimistically = (
  queryClient: QueryClient,
  newItem: OptimisticCartItem,
  optimisticCart?: OptimisticCart,
  fields?: string
): HttpTypes.StoreCart | null => {
  assertPositiveIntegerQuantity(newItem.quantity)
  const currentCart = optimisticCart || queryClient.getQueryData<HttpTypes.StoreCart | null>(
    queryKeys.cart.current(fields)
  )

  if (!currentCart) {
    return null
  }

  const existingItemIndex = currentCart.items?.findIndex(
    item => item.variant_id === newItem.variant_id
  )

  let updatedItems: HttpTypes.StoreCartLineItem[]

  if (existingItemIndex !== undefined && existingItemIndex >= 0) {
    updatedItems = [...(currentCart.items || [])]
    const existingItem = updatedItems[existingItemIndex]
    updatedItems[existingItemIndex] = {
      ...existingItem,
      quantity: existingItem.quantity + newItem.quantity,
      total: (existingItem.unit_price || 0) * (existingItem.quantity + newItem.quantity),
    }
  } else {
    const optimisticLineItem = {
      ...newItem,
      cart_id: currentCart.id,
      cart: currentCart,
      item_total: newItem.total,
      item_subtotal: newItem.total,
      item_tax_total: 0,
      original_total: newItem.total,
      original_tax_total: 0,
      original_subtotal: newItem.total,
      discount_total: 0,
      discount_tax_total: 0,
      gift_card_total: 0,
      subtotal: newItem.total,
      tax_total: 0,
      total: newItem.total,
      created_at: new Date(),
      updated_at: new Date(),
      metadata: {},
      adjustments: [],
      tax_lines: [],
      unit_tax_amount: 0,
      requires_shipping: true,
      is_discountable: true,
      is_tax_inclusive: false,
    } as HttpTypes.StoreCartLineItem

    updatedItems = [...(currentCart.items || []), optimisticLineItem]
  }

  const newItemSubtotal = updatedItems.reduce((sum, item) => sum + (item.total || 0), 0)

  const newOptimisticCart: OptimisticCart = {
    ...currentCart,
    items: updatedItems,
    item_subtotal: newItemSubtotal,
    isOptimistic: true,
  }

  queryClient.setQueryData(queryKeys.cart.current(fields), newOptimisticCart)

  return newOptimisticCart
}

export const updateLineItemOptimistically = (
  queryClient: QueryClient,
  lineId: string,
  quantity: number,
  fields?: string
): HttpTypes.StoreCart | null => {
  assertPositiveIntegerQuantity(quantity)
  const currentCart = queryClient.getQueryData<HttpTypes.StoreCart | null>(
    queryKeys.cart.current(fields)
  )

  if (!currentCart) {
    return null
  }

  const updatedItems = (currentCart.items || []).map(item => {
    if (item.id === lineId) {
      return {
        ...item,
        quantity,
        total: (item.unit_price || 0) * quantity,
        original_total: (item.unit_price || 0) * quantity,
      }
    }
    return item
  })

  const optimisticCart: OptimisticCart = {
    ...currentCart,
    items: updatedItems,
    item_subtotal: updatedItems.reduce((sum, item) => sum + (item.total || 0), 0),
    isOptimistic: true,
  }

  queryClient.setQueryData(queryKeys.cart.current(fields), optimisticCart)

  return optimisticCart
}

export const removeLineItemOptimistically = (
  queryClient: QueryClient,
  lineId: string,
  fields?: string
): HttpTypes.StoreCart | null => {
  const currentCart = queryClient.getQueryData<HttpTypes.StoreCart | null>(
    queryKeys.cart.current(fields)
  )

  if (!currentCart) {
    return null
  }

  const updatedItems = (currentCart.items || []).filter(item => item.id !== lineId)

  const optimisticCart: OptimisticCart = {
    ...currentCart,
    items: updatedItems,
    item_subtotal: updatedItems.reduce((sum, item) => sum + (item.total || 0), 0),
    isOptimistic: true,
  }

  queryClient.setQueryData(queryKeys.cart.current(fields), optimisticCart)

  return optimisticCart
}

export const rollbackOptimisticCart = (
  queryClient: QueryClient,
  previousCart: HttpTypes.StoreCart | null,
  fields?: string
) => {
  queryClient.setQueryData(queryKeys.cart.current(fields), previousCart)
}

export const createOptimisticCart = (region: HttpTypes.StoreRegion): OptimisticCart => {
  const tempId = `optimistic-cart-${Date.now()}`

  return {
    id: tempId,
    region_id: region.id,
    items: [],
    item_subtotal: 0,
    item_tax_total: 0,
    item_total: 0,
    original_item_total: 0,
    original_item_tax_total: 0,
    original_item_subtotal: 0,
    original_total: 0,
    original_tax_total: 0,
    original_subtotal: 0,
    subtotal: 0,
    tax_total: 0,
    total: 0,
    discount_total: 0,
    discount_tax_total: 0,
    gift_card_total: 0,
    gift_card_tax_total: 0,
    shipping_total: 0,
    shipping_tax_total: 0,
    shipping_subtotal: 0,
    original_shipping_total: 0,
    original_shipping_subtotal: 0,
    original_shipping_tax_total: 0,
    shipping_address: undefined,
    billing_address: undefined,
    shipping_methods: [],
    payment_collection: undefined,
    region: undefined,
    customer_id: undefined,
    sales_channel_id: undefined,
    promotions: [],
    currency_code: region.currency_code,
    metadata: {},
    created_at: new Date(),
    updated_at: new Date(),
    isOptimistic: true,
  }
}

export const getCurrentCart = (queryClient: QueryClient, fields?: string): HttpTypes.StoreCart | null => {
  return queryClient.getQueryData<HttpTypes.StoreCart | null>(queryKeys.cart.current(fields)) ||
    queryClient.getQueriesData<HttpTypes.StoreCart | null>({
      predicate: queryKeys.cart.predicate
    })[0]?.[1] || null
}
