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
  assert.equal(locations[0].phone, "(11) 4580-1227")
  assert.equal(locations[0].whatsapp, "5511948777156")
  assert.equal(locations[0].ownImageAlt, "Fachada da FriggaFrio")
  for (const location of locations) {
    assert.equal(location.ownImageSrc, `/images/store/${location.id}-fachada.webp`)
    assert.ok(statSync(new URL(`../../public${location.ownImageSrc}`, import.meta.url)).size > 0)
  }
  assert.equal(locations[1].addressLine, "Alameda Glete, 926")
  assert.equal(locations[2].addressLine, "Avenida São Carlos, 827")
  assert.equal(locations[2].district, "Vila São Carlos")
  assert.equal(locations[2].city, "Mogi Guaçu")
})

test("new units never inherit unconfirmed contacts, postal codes, CNPJ or hours", () => {
  for (const location of storeLocations.slice(1)) {
    for (const key of ["phone", "whatsapp", "postalCode", "cnpj", "legalName", "openingHours", "email"] as const) {
      assert.equal(location[key], undefined, `${location.id}: ${key}`)
    }
    assert.equal(storeWhatsappLink(location), undefined)
  }
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
  assert.equal(storeAddress(storeLocations[1]), "Alameda Glete, 926, São Paulo/SP")
  assert.equal(storeAddress(storeLocations[2]), "Avenida São Carlos, 827, Vila São Carlos, Mogi Guaçu/SP")
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
      for (const key of ["telephone", "email", "taxID", "legalName", "openingHours"]) {
        assert.equal(key in business, false)
      }
      assert.equal("postalCode" in business.address, false)
    }
  }
})

test("one detail component, accessible selection, no street view and Loja 1-only pickup", () => {
  const page = readFileSync(new URL("../../src/pages/public-stores.tsx", import.meta.url), "utf8")
  const card = readFileSync(new URL("../../src/components/store-locations/StoreLocationCard.tsx", import.meta.url), "utf8")
  const map = readFileSync(new URL("../../src/components/store-locations/GoogleStoreMap.tsx", import.meta.url), "utf8")
  assert.equal((page.match(/<StoreLocationCard /g) ?? []).length, 1)
  assert.match(page, /useState\("loja-1"\)/)
  assert.match(page, /aria-pressed=\{isSelected\}/)
  assert.match(page, /focus-visible:outline/)
  assert.match(page, /Retirada gratuita na Loja 1/)
  assert.match(page, /retirada de pedidos é exclusiva da Loja 1/)
  assert.doesNotMatch(page + card, /Vista da rua|StoreStreetView|activeView|role="tab/)
  assert.doesNotMatch(page + card, /scrollIntoView|\.focus\(/)
  assert.match(map, /VITE_GOOGLE_MAPS_EMBED_API_KEY/)
  assert.match(map, /encodeURIComponent\(storeAddress\(location\)\)/)
  assert.equal(existsSync(new URL("../../src/components/store-locations/StoreStreetView.tsx", import.meta.url)), false)
})
