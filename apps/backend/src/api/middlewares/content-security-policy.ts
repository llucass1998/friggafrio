import type { HelmetOptions } from "helmet"

const mercadoPagoSdkOrigin = "https://sdk.mercadopago.com"
const mercadoPagoApiOrigin = "https://api.mercadopago.com"
const mercadoPagoSecureFieldsOrigin = "https://secure-fields.mercadopago.com"
const googleFontsCssOrigin = "https://fonts.googleapis.com"
const googleFontsFilesOrigin = "https://fonts.gstatic.com"
const vlibrasOrigin = "https://vlibras.gov.br"

/**
 * Report-only is intentional until the browser verification records every
 * first-party Admin, Storefront, and Mercado Pago Brick requirement.
 */
export const contentSecurityPolicyReportOnlyOptions: HelmetOptions["contentSecurityPolicy"] = {
  // Keep local/staging report-only until browser evidence is collected; a
  // production operator can opt into enforcement without changing source.
  reportOnly: process.env.CSP_ENFORCE?.trim().toLowerCase() !== "true",
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
    "frame-src": [mercadoPagoSdkOrigin, mercadoPagoSecureFieldsOrigin, vlibrasOrigin],
  },
}
