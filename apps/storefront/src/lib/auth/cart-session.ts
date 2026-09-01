type CartOwnershipRecord = {
  id: string
  customer_id?: string | null
}

type CartSessionOperations = {
  retrieve: (cartId: string) => Promise<CartOwnershipRecord>
  transfer: (cartId: string) => Promise<CartOwnershipRecord>
}

/** Transfer only an anonymous cart; the backend remains the owner authority. */
export const transferGuestCartToCustomer = async (
  cartId: string | undefined,
  customerId: string,
  operations: CartSessionOperations,
): Promise<CartOwnershipRecord | null> => {
  if (!cartId || !customerId) return null

  const current = await operations.retrieve(cartId)
  if (current.customer_id === customerId) return current
  if (current.customer_id !== null) {
    throw new Error("O carrinho atual pertence a outra conta.")
  }

  const transferred = await operations.transfer(cartId)
  if (transferred.customer_id !== customerId) {
    throw new Error("Nao foi possivel associar o carrinho a sua conta.")
  }
  return transferred
}
