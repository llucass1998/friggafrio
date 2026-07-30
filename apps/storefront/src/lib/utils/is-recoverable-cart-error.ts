export const isRecoverableStaleCartError = (error: unknown): boolean => {
  if (!error) return false;

  const err = error as Record<string, unknown>;
  const status = err.status || err.response?.status;
  const type = err.type || err.response?.data?.type;
  const message = err.message || err.response?.data?.message || "";

  // Timeout ou erro de rede não recupera
  if (!status && !type && !message) return false;
  if (status >= 500) return false;

  const isInvalidData = type === "invalid_data" || message.toLowerCase().includes("invalid");
  const isInventoryError = type === "not_allowed" && message.toLowerCase().includes("inventory");
  const isStockError = message.toLowerCase().includes("stock");
  
  if (isInvalidData || isInventoryError || isStockError) {
    return false;
  }

  // Falha real de cart sumido
  const isNotFound = status === 404 || type === "not_found" || message.toLowerCase().includes("not found");
  
  return isNotFound;
}
