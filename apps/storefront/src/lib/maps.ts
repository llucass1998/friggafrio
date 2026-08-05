export function createGoogleMapsSearchUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function createGoogleMapsDirectionsUrl(destinationQuery: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destinationQuery)}`;
}

export function createGoogleMapsEmbedUrl(query: string, apiKey: string): string {
  return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodeURIComponent(query)}`;
}

export function formatStoreAddress(store: { address: { street: string; number: string; district: string; city: string; state: string; postalCode: string } }) {
  return `${store.address.street}, ${store.address.number}, ${store.address.district}, ${store.address.city} - ${store.address.state}, ${store.address.postalCode}`;
}
