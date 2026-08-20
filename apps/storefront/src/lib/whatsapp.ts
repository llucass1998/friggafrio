export const WHATSAPP_DEFAULT_MESSAGE = "Olá! Vim pelo site da Friggafrio e gostaria de falar com a loja."

export function createWhatsAppUrl(rawNumber?: string): string | null {
  const configuredNumber =
    rawNumber ||
    import.meta.env.VITE_WHATSAPP_NUMBER ||
    "5511948777156"

  const normalizedNumber = configuredNumber.replace(/\D/g, "")

  if (!/^\d{12,15}$/.test(normalizedNumber)) {
    if (import.meta.env.DEV) {
      console.warn(
        "O número configurado para o WhatsApp da Friggafrio é inválido."
      )
    }
    return null
  }

  return `https://wa.me/${normalizedNumber}?text=${encodeURIComponent(
    WHATSAPP_DEFAULT_MESSAGE
  )}`
}

export function createProductWhatsAppUrl({
  title,
  reference,
  quantity = 1,
  price,
  url,
  rawNumber,
}: {
  title: string
  reference?: string
  quantity?: number
  price?: string
  url?: string
  rawNumber?: string
}): string | null {
  const baseUrl = createWhatsAppUrl(rawNumber)
  if (!baseUrl) return null

  const message = [
    "Olá! Tenho interesse neste produto da FriggaFrio:",
    `Produto: ${title}`,
    reference ? `Referência: ${reference}` : null,
    `Quantidade: ${quantity}`,
    price ? `Preço exibido: ${price}` : null,
    url ? `Link: ${url}` : null,
    "Gostaria de mais informações sobre disponibilidade e compra.",
  ].filter(Boolean).join("\n")

  return `${baseUrl.split("?")[0]}?text=${encodeURIComponent(message)}`
}
