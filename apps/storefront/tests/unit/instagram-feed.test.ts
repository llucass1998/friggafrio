import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { siteFeatures } from "../../src/config/site-features"
import { storeConfig } from "../../src/config/store"

test("Instagram feature flag is active by default and preserves existing flags", () => {
  assert.equal(siteFeatures.showInstagramFeed, true)
  assert.equal(siteFeatures.institutionalHome, true)
  assert.equal(siteFeatures.showHomeBrandCarousel, true)
  assert.equal(siteFeatures.showHomeProductShowcase, false)
  assert.equal(siteFeatures.showHomeCategories, false)
})

test("storeConfig contains canonical Instagram profile URL", () => {
  assert.equal(storeConfig.instagramUrl, "https://www.instagram.com/frigga.frio/")
})

test("PublicHomePage renders InstagramFeedSection after brands carousel and before newsletter", () => {
  const homeSource = readFileSync(new URL("../../src/pages/public-home.tsx", import.meta.url), "utf8")
  
  assert.match(homeSource, /import\s+\{\s*InstagramFeedSection\s*\}\s+from\s+["']@\/components\/instagram\/InstagramFeedSection["']/)
  assert.match(homeSource, /\{siteFeatures\.showInstagramFeed\s*&&\s*<InstagramFeedSection\s*\/>\}/)

  const carouselIdx = homeSource.indexOf("<StoreBrandsCarousel")
  const instagramIdx = homeSource.indexOf("<InstagramFeedSection")
  const newsletterIdx = homeSource.indexOf("<NewsletterSignup")

  assert.ok(carouselIdx !== -1, "StoreBrandsCarousel must be present")
  assert.ok(instagramIdx !== -1, "InstagramFeedSection must be present")
  assert.ok(newsletterIdx !== -1, "NewsletterSignup must be present")

  assert.ok(carouselIdx < instagramIdx, "Instagram section must appear after brands carousel")
  assert.ok(instagramIdx < newsletterIdx, "Instagram section must appear before newsletter signup")
})

test("InstagramFeedSection includes official indicators, title, handle, and secure CTA", () => {
  const source = readFileSync(new URL("../../src/components/instagram/InstagramFeedSection.tsx", import.meta.url), "utf8")

  assert.match(source, /NOSSO DIA A DIA/)
  assert.match(source, /Acompanhe a FriggaFrio no Instagram/)
  assert.match(source, /Novidades, bastidores e conhecimento técnico em refrigeração\./)
  assert.match(source, /@frigga\.frio/)
  assert.match(source, /Seguir no Instagram/)
  assert.match(source, /target=["']_blank["']/)
  assert.match(source, /rel=["']noopener noreferrer["']/)
})

test("InstagramPostCard includes badges, secure link, and accessible overlay", () => {
  const cardSource = readFileSync(new URL("../../src/components/instagram/InstagramPostCard.tsx", import.meta.url), "utf8")

  assert.match(cardSource, /post\.media_type === "VIDEO"/)
  assert.match(cardSource, /post\.media_type === "CAROUSEL_ALBUM"/)
  assert.match(cardSource, /badge-video/)
  assert.match(cardSource, /badge-carousel/)
  assert.match(cardSource, /target="_blank"/)
  assert.match(cardSource, /rel="noopener noreferrer"/)
  assert.match(cardSource, /Ver no Instagram/)
  assert.match(cardSource, /aria-label/)
  assert.match(cardSource, /loading="lazy"/)
})

test("InstagramFeedEmpty provides elegant fallback inviting to official profile", () => {
  const emptySource = readFileSync(new URL("../../src/components/instagram/InstagramFeedEmpty.tsx", import.meta.url), "utf8")

  assert.match(emptySource, /Conecte-se com a FriggaFrio no Instagram/)
  assert.match(emptySource, /@frigga\.frio/)
  assert.match(emptySource, /target="_blank"/)
  assert.match(emptySource, /rel="noopener noreferrer"/)
})
