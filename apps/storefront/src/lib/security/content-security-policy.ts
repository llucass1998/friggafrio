const mercadoPagoSdkOrigin = "https://sdk.mercadopago.com"
const mercadoPagoApiOrigin = "https://api.mercadopago.com"
const mercadoPagoSecureFieldsOrigin = "https://secure-fields.mercadopago.com"
const googleFontsCssOrigin = "https://fonts.googleapis.com"
const googleFontsFilesOrigin = "https://fonts.gstatic.com"
const vlibrasOrigin = "https://vlibras.gov.br"

export const storefrontContentSecurityPolicyReportOnly = (isDevelopment: boolean): string => {
  const developmentConnections = isDevelopment
    ? " http://127.0.0.1:9000 http://localhost:9000 ws://127.0.0.1:5173 ws://localhost:5173"
    : ""

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    "object-src 'none'",
    "img-src 'self' data: blob:",
    `font-src 'self' data: ${googleFontsFilesOrigin}`,
    `style-src 'self' ${googleFontsCssOrigin}`,
    `script-src 'self' ${mercadoPagoSdkOrigin} ${vlibrasOrigin}`,
    `connect-src 'self' ${mercadoPagoApiOrigin} ${mercadoPagoSdkOrigin} ${vlibrasOrigin}${developmentConnections}`,
    `frame-src ${mercadoPagoSdkOrigin} ${mercadoPagoSecureFieldsOrigin} ${vlibrasOrigin}`,
  ].join("; ")
}
