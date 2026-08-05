export function getSafeReturnTo(returnTo?: string, countryCode?: string): string {
  if (!returnTo) return `/${countryCode || 'br'}`
  
  // Apenas aceita caminhos que começam com / e não têm barras duplas // (para não apontar para //google.com)
  if (returnTo.startsWith('/') && !returnTo.startsWith('//')) {
    return returnTo
  }
  
  return `/${countryCode || 'br'}`
}
