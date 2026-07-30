export const isRecoverableStaleCartError = (error: unknown): boolean => {
  if (!error) return false;

  const err = error as Record<string, unknown>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const errData = err.response as any;
  const status = err.status || errData?.status;
  const type = err.type || errData?.data?.type;
  const message = (err.message || errData?.data?.message || "") as string;

  // Timeout ou erro de rede não recupera
  if (!status && !type && !message) return false;
  
  // Qualquer HTTP 500 não recupera
  if (status >= 500) return false;

  // variante inválida, stock
  const isInvalidData = type === "invalid_data" || message.toLowerCase().includes("invalid");
  const isInventoryError = type === "not_allowed" && message.toLowerCase().includes("inventory");
  const isStockError = message.toLowerCase().includes("stock");
  
  // mensagem calculated_amount sem validação prévia do carrinho;
  const isCalculatedAmount = message.toLowerCase().includes("calculated_amount");
  
  // erro de Sales Channel;
  const isSalesChannel = message.toLowerCase().includes("sales channel");

  if (isInvalidData || isInventoryError || isStockError || isCalculatedAmount || isSalesChannel) {
    return false;
  }

  // Falha real de cart sumido (404, not_found)
  const isNotFound = status === 404 || type === "not_found" || message.toLowerCase().includes("not found");
  
  // E também carrinhos já finalizados podem dar not_allowed mas sem inventory error ou algo similar
  const isCompleted = type === "not_allowed" && !isInventoryError;

  return isNotFound || isCompleted;
}
