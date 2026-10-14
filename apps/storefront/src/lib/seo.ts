import { COMPANY_INFORMATION } from "@/config/company"
import { storeConfig } from "@/config/store"
import { storeLocations, storeMapsLinks } from "@/config/store-locations"

const configuredSiteUrl = (
  import.meta as ImportMeta & { env?: Record<string, string | undefined> }
).env?.VITE_PUBLIC_SITE_URL?.trim()

/** Canonical public origin used for indexable URLs and structured data. */
export const PUBLIC_SITE_ORIGIN = (
  configuredSiteUrl || "https://friggafrio.com.br"
).replace(/\/+$/, "")

export function absoluteSiteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path
  return `${PUBLIC_SITE_ORIGIN}/${path.replace(/^\/+/, "")}`
}

type PageMetaOptions = {
  title: string
  description: string
  path: string
  indexable?: boolean
  image?: string
}

export function pageMeta({
  title,
  description,
  path,
  indexable = true,
  image,
}: PageMetaOptions) {
  const canonical = absoluteSiteUrl(path)
  const meta = [
    { title },
    { name: "description", content: description },
    { name: "robots", content: indexable ? "index,follow" : "noindex,nofollow" },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { property: "og:url", content: canonical },
    { property: "og:locale", content: "pt_BR" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    ...(image
      ? [{ property: "og:image", content: absoluteSiteUrl(image) }]
      : []),
  ]

  return {
    meta,
    links: [{ rel: "canonical", href: canonical }],
  }
}

export function organizationStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: storeConfig.name,
    legalName: COMPANY_INFORMATION.legalName,
    url: absoluteSiteUrl("/"),
    logo: absoluteSiteUrl("/images/brand/logo-friggafrio-optimized.webp"),
    email: storeConfig.email,
    telephone: storeConfig.phone,
    sameAs: [storeConfig.instagramUrl],
  }
}

export function websiteStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: storeConfig.name,
    url: absoluteSiteUrl("/"),
    inLanguage: "pt-BR",
    potentialAction: {
      "@type": "SearchAction",
      target: `${absoluteSiteUrl("/br/store")}?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  }
}

export function breadcrumbStructuredData(
  items: Array<{ name: string; path: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteSiteUrl(item.path),
    })),
  }
}

export function structuredDataScript(data: unknown) {
  return {
    type: "application/ld+json" as const,
    children: JSON.stringify(data),
  }
}

export function storeLocationsStructuredData() {
  return {
    "@context": "https://schema.org",
    "@graph": storeLocations.filter((location) => location.active).map((location) => ({
      "@type": "LocalBusiness",
      "@id": absoluteSiteUrl(`/nossa-loja#${location.id}`),
      name: `${location.shortName} — FriggaFrio`,
      url: absoluteSiteUrl("/nossa-loja"),
      image: location.ownImageSrc ? absoluteSiteUrl(location.ownImageSrc) : undefined,
      legalName: location.legalName,
      taxID: location.cnpj,
      telephone: location.phone,
      email: location.email,
      address: {
        "@type": "PostalAddress",
        streetAddress: location.addressLine,
        addressLocality: location.city,
        addressRegion: location.stateCode,
        postalCode: location.postalCode,
        addressCountry: location.countryCode,
      },
      hasMap: storeMapsLinks(location).search,
    })),
  }
}
