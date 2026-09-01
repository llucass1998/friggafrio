import type { HelmetOptions } from "helmet"

const mercadoPagoSdkOrigin = "https://sdk.mercadopago.com"
const mercadoPagoApiOrigin = "https://api.mercadopago.com"
const googleFontsCssOrigin = "https://fonts.googleapis.com"
const googleFontsFilesOrigin = "https://fonts.gstatic.com"
const vlibrasOrigin = "https://vlibras.gov.br"

/**
 * Report-only is intentional until the browser verification records every
 * first-party Admin, Storefront, and Mercado Pago Brick requirement.
 */
export const contentSecurityPolicyReportOnlyOptions: HelmetOptions["contentSecurityPolicy"] = {
  reportOnly: true,
  directives: {
    "default-src": ["'self'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'self'"],
    "object-src": ["'none'"],
    "img-src": ["'self'", "data:", "blob:"],
    "font-src": ["'self'", "data:", googleFontsFilesOrigin],
    "style-src": ["'self'", googleFontsCssOrigin],
    "script-src": ["'self'", mercadoPagoSdkOrigin, vlibrasOrigin],
    "connect-src": ["'self'", mercadoPagoApiOrigin, mercadoPagoSdkOrigin, vlibrasOrigin],
    "frame-src": [mercadoPagoSdkOrigin, vlibrasOrigin],
  },
}
