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
