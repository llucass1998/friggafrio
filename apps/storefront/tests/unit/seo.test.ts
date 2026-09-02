import assert from "node:assert/strict"
import test from "node:test"
import {
  absoluteSiteUrl,
  breadcrumbStructuredData,
  pageMeta,
  organizationStructuredData,
  websiteStructuredData,
} from "../../src/lib/seo"
import { isLoopbackMediaUrl } from "../../src/lib/media-url"

test("SEO URLs stay absolute and canonical to the public origin", () => {
  assert.equal(absoluteSiteUrl("/br/store"), "https://friggafrio.com.br/br/store")
  assert.equal(absoluteSiteUrl("https://example.test/item"), "https://example.test/item")

  const metadata = pageMeta({
    title: "Catalogo | FriggaFrio",
    description: "Produtos de refrigeracao.",
    path: "/br/store",
  })
  assert.deepEqual(metadata.links, [{ rel: "canonical", href: "https://friggafrio.com.br/br/store" }])
  assert.equal(metadata.meta.find((item) => "name" in item && item.name === "robots")?.content, "index,follow")
  assert.equal(metadata.meta.find((item) => "property" in item && item.property === "og:locale")?.content, "pt_BR")
})

test("private metadata is explicitly excluded from indexing", () => {
  const metadata = pageMeta({
    title: "Carrinho | FriggaFrio",
    description: "Carrinho privado.",
    path: "/br/cart",
    indexable: false,
  })
  assert.equal(metadata.meta.find((item) => "name" in item && item.name === "robots")?.content, "noindex,nofollow")
})

test("organization, website and breadcrumb JSON-LD contain only factual URLs", () => {
  const organization = organizationStructuredData()
  const website = websiteStructuredData()
  const breadcrumb = breadcrumbStructuredData([
    { name: "Home", path: "/br" },
    { name: "Catalogo", path: "/br/store" },
  ])

  assert.equal(organization["@type"], "Organization")
  assert.equal(website["@type"], "WebSite")
  assert.equal(website.inLanguage, "pt-BR")
  assert.equal(breadcrumb.itemListElement[1].item, "https://friggafrio.com.br/br/store")
})

test("public product metadata never emits loopback image URLs", () => {
  assert.equal(isLoopbackMediaUrl("http://localhost:9000/static/missing.jpg"), true)
  assert.equal(isLoopbackMediaUrl("https://cdn.example.com/product.jpg"), false)
})
