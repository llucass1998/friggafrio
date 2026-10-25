import assert from "node:assert/strict"
import { existsSync, readFileSync, statSync } from "node:fs"
import test from "node:test"
import { storeAddress, storeLocations, storeMapsLinks, storeWhatsappLink } from "../../src/config/store-locations"
import { storeLocationsStructuredData } from "../../src/lib/seo"

test("Nossas lojas exposes the three confirmed units in order and preserves Loja 1", () => {
  const locations = storeLocations.filter((location) => location.active)
  assert.deepEqual(locations.map(({ id }) => id), ["loja-1", "loja-2", "loja-3"])
  assert.equal(locations[0].name, "FriggaFrio")
  assert.equal(locations[0].addressLine, "Alameda Glete, 663")
  assert.equal(locations[0].phone, "(11) 3224-1670")
  assert.equal(locations[0].whatsapp, "5511921396007")
  assert.equal(locations[0].ownImageAlt, "Fachada da FriggaFrio")
  for (const location of locations) {
    assert.equal(location.ownImageSrc, `/images/store/${location.id}-fachada.webp`)
    assert.ok(statSync(new URL(`../../public${location.ownImageSrc}`, import.meta.url)).size > 0)
  }
  assert.equal(locations[1].addressLine, "Alameda Glete, 926")
  assert.equal(locations[1].phone, "(11) 3224-1670")
  assert.equal(locations[1].postalCode, "01215-001")
  assert.equal(locations[2].addressLine, "Avenida São Carlos, 847")
  assert.equal(locations[2].district, "Vila São Carlos")
  assert.equal(locations[2].city, "Mogi Guaçu")
  assert.equal(locations[2].postalCode, "13847-111")
  assert.equal(locations[2].phone, "(19) 9982-8481")
})

test("new units never inherit unconfirmed contacts, postal codes, CNPJ or hours", () => {
  // Loja 2 has confirmed phone and postalCode; other metadata remains unconfirmed.
  assert.equal(storeLocations[1].phone, "(11) 3224-1670")
  assert.equal(storeLocations[1].postalCode, "01215-001")
  for (const key of ["whatsapp", "cnpj", "legalName", "openingHours", "email"] as const) {
    assert.equal(storeLocations[1][key], undefined, `loja-2: ${key}`)
  }
  assert.equal(storeWhatsappLink(storeLocations[1]), undefined)

  // Loja 3 has confirmed address, postalCode and phone; remaining metadata remains unconfirmed.
  assert.equal(storeLocations[2].postalCode, "13847-111")
  assert.equal(storeLocations[2].phone, "(19) 9982-8481")
  for (const key of ["whatsapp", "cnpj", "legalName", "openingHours", "email"] as const) {
    assert.equal(storeLocations[2][key], undefined, `loja-3: ${key}`)
  }
  assert.equal(storeWhatsappLink(storeLocations[2]), undefined)

  const whatsapp = new URL(storeWhatsappLink(storeLocations[0])!)
  assert.match(whatsapp.searchParams.get("text")!, /Loja 1, Alameda Glete, 663/)
})

test("map search and directions use exactly the same full confirmed address", () => {
  for (const location of storeLocations) {
    const links = storeMapsLinks(location)
    const address = storeAddress(location)
    assert.equal(new URL(links.search).searchParams.get("query"), address)
    assert.equal(new URL(links.directions).searchParams.get("destination"), address)
    assert.doesNotMatch(address, /undefined|null/)
  }
  assert.equal(storeAddress(storeLocations[1]), "Alameda Glete, 926, Campos Elíseos, São Paulo/SP, 01215-001")
  assert.equal(storeAddress(storeLocations[2]), "Avenida São Carlos, 847, Vila São Carlos, Mogi Guaçu/SP, 13847-111")
})

test("page SEO describes all units with city locality and only confirmed metadata", () => {
  const data = JSON.parse(JSON.stringify(storeLocationsStructuredData()))
  assert.equal(data["@graph"].length, 3)
  for (const [index, location] of storeLocations.entries()) {
    const business = data["@graph"][index]
    assert.equal(business.address.streetAddress, location.addressLine)
    assert.equal(business.address.addressLocality, location.city)
    assert.equal(business.hasMap, storeMapsLinks(location).search)
    assert.ok(business["@id"].endsWith(`/nossa-loja#${location.id}`))
    if (index > 0) {
      for (const key of ["email", "taxID", "legalName", "openingHours"]) {
        assert.equal(key in business, false)
      }
    }
  }
  assert.equal(data["@graph"][1].telephone, "(11) 3224-1670")
  assert.equal(data["@graph"][1].address.postalCode, "01215-001")
  assert.equal(data["@graph"][2].address.postalCode, "13847-111")
  assert.equal(data["@graph"][2].telephone, "(19) 9982-8481")
})

test("independent cards, shared map, accessible selection and Loja 1-only pickup", () => {
  const page = readFileSync(new URL("../../src/pages/public-stores.tsx", import.meta.url), "utf8")
  const card = readFileSync(new URL("../../src/components/store-locations/StoreLocationCard.tsx", import.meta.url), "utf8")
  const map = readFileSync(new URL("../../src/components/store-locations/GoogleStoreMap.tsx", import.meta.url), "utf8")
  assert.equal((page.match(/<StoreLocationCard /g) ?? []).length, 1)
  assert.match(page, /useState\("loja-1"\)/)
  assert.match(page, /aria-pressed=\{isSelected\}/)
  assert.match(page, /focus-visible:outline/)
  assert.match(page, /Retirada gratuita somente na Loja 1/)
  assert.match(page, /retirada de pedidos é exclusiva da Loja 1/)
  assert.doesNotMatch(page + card, /Vista da rua|StoreStreetView|activeView|role="tab/)
  assert.match(page, /prefers-reduced-motion: reduce/)
  assert.match(page, /scrollIntoView\(\{ behavior: reducedMotion \? "instant" : "smooth"/)
  assert.match(page, /onClick=\{\(\) => setSelectedLocationId\(location.id\)\}/)
  assert.doesNotMatch(page + card, /\.focus\(/)
  assert.equal((page.match(/<GoogleStoreMap /g) ?? []).length, 1)
  assert.doesNotMatch(card, /GoogleStoreMap|min-h-\[/)
  assert.match(card, /location.id === "loja-1"/)
  assert.match(card, /tel:\+55/)
  assert.match(map, /VITE_GOOGLE_MAPS_EMBED_API_KEY/)
  assert.match(map, /encodeURIComponent\(storeAddress\(location\)\)/)
  assert.equal(existsSync(new URL("../../src/components/store-locations/StoreStreetView.tsx", import.meta.url)), false)
})

test("Maps usa o host autorizado pelo Google e o build não aceita chave ausente", () => {
  const map = readFileSync(new URL("../../src/components/store-locations/GoogleStoreMap.tsx", import.meta.url), "utf8")
  const embed = readFileSync(new URL("../../public/maps-embed.html", import.meta.url), "utf8")
  const config = readFileSync(new URL("../../vite.config.ts", import.meta.url), "utf8")
  assert.match(map, /https:\/\/friggafrio\.istigestao\.com\.br\/maps-embed\.html\?key=/)
  assert.doesNotMatch(map + embed, /AIza[A-Za-z0-9_-]+/)
  assert.match(config, /GOOGLE_MAPS_EMBED_KEY_REQUIRED_FOR_BUILD/)
  assert.match(config, /loadEnv\(mode, import\.meta\.dirname/)
})

test("all store navigation labels use the plural without changing the legal footer", () => {
  for (const path of ["components/header/HeaderDesktopNav.tsx", "components/header/HeaderMobileDrawer.tsx", "components/public-footer.tsx", "config/footer-navigation.ts"]) {
    const source = readFileSync(new URL(`../../src/${path}`, import.meta.url), "utf8")
    assert.match(source, /Nossas lojas/)
    assert.doesNotMatch(source, /Nossa Loja/)
  }
  const footer = readFileSync(new URL("../../src/components/public-footer.tsx", import.meta.url), "utf8")
  assert.match(footer, /COMPANY_INFORMATION/)
})
