import { test, expect, type Locator } from "@playwright/test"
import { storeAddress, storeLocations } from "../src/config/store-locations"

async function assertContrast(locator: Locator) {
  const ratio = await locator.evaluate((element) => {
    const luminance = (color: string) => {
      const rgb = color.match(/[\d.]+/g)!.slice(0, 3).map(Number).map((value) => {
        const s = value / 255
        return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
      })
      return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722
    }
    let parent: Element | null = element
    let background = "rgb(255, 255, 255)"
    while (parent) {
      const color = getComputedStyle(parent).backgroundColor
      if (color !== "rgba(0, 0, 0, 0)" && color !== "transparent") { background = color; break }
      parent = parent.parentElement
    }
    const a = luminance(getComputedStyle(element).color)
    const b = luminance(background)
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
  })
  expect(ratio).toBeGreaterThanOrEqual(4.5)
}

for (const width of [360, 390, 768, 1280, 1440]) {
  test(`independent store cards and shared map at ${width}px`, async ({ page }, testInfo) => {
    const pageErrors: string[] = []
    page.on("pageerror", (error) => pageErrors.push(error.message))
    await page.route("https://www.google.com/maps/embed/**", (route) => route.fulfill({
      contentType: "text/html", body: "<p>Mapa externo isolado para teste</p>",
    }))
    await page.setViewportSize({ width, height: 900 })
    await page.emulateMedia({ reducedMotion: width === 390 ? "reduce" : "no-preference" })
    await page.goto("/nossa-loja")
    await expect(page.getByTestId("mobile-navigation-trigger")).toHaveAttribute("data-hydrated", "true")
    const declineCookies = page.getByRole("button", { name: "Recusar opcionais" })
    if (await declineCookies.isVisible()) await declineCookies.click()
    await expect(page).toHaveTitle("Nossas lojas | FriggaFrio")
    const cards = page.getByTestId("store-location-card")
    const map = page.locator("#store-map-section")
    const controls = map.getByRole("group", { name: "Unidade exibida no mapa" }).getByRole("button")
    await expect(cards).toHaveCount(3)
    if (width >= 768) {
      const firstCard = await cards.first().boundingBox()
      const lastCard = await cards.last().boundingBox()
      expect(firstCard!.x).toBeGreaterThanOrEqual(80)
      expect(width - lastCard!.x - lastCard!.width).toBeGreaterThanOrEqual(80)
    }
    await expect(cards.locator("img")).toHaveCount(3)
    await expect(page.locator('main img[src*="/images/store/"]')).toHaveCount(3)
    await expect(controls.nth(0)).toHaveAttribute("aria-pressed", "true")
    await expect(page.getByText("Vista da rua", { exact: true })).toHaveCount(0)
    await expect(cards.getByText("Retirada de pedidos", { exact: true })).toHaveCount(1)
    await expect(page.getByText(/A retirada de pedidos é exclusiva da Loja 1/)).toHaveCount(1)

    const actionBoxes = []
    for (const [index, location] of storeLocations.entries()) {
      const card = cards.nth(index)
      await expect(card).toContainText(location.addressLine)
      await expect(card).toContainText(`${location.city}/${location.stateCode}`)
      const photo = card.locator("img")
      await photo.scrollIntoViewIfNeeded()
      await expect(photo).toHaveAttribute("src", location.ownImageSrc!)
      await expect(photo).toHaveAttribute("alt", location.ownImageAlt!)
      await expect.poll(() => photo.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true)
      const photoBox = await photo.boundingBox()
      expect(photoBox!.width / photoBox!.height).toBeCloseTo(4 / 3, 1)
      const route = card.getByRole("link", { name: `Como chegar à ${location.shortName}` })
      expect(new URL((await route.getAttribute("href"))!).searchParams.get("destination")).toBe(storeAddress(location))
      await assertContrast(route)
      await assertContrast(card.locator("p").first())
      await expect(card.getByRole("link", { name: /WhatsApp/ })).toHaveCount(index === 0 ? 1 : 0)
      if (index === 0) await expect(card.locator('a[href^="tel:"]')).toHaveAttribute("href", "tel:+551145801227")
      else await expect(card).not.toContainText(/CEP|CNPJ|Retirada de pedidos|4580/)

      const viewMap = card.getByRole("button", { name: `Ver ${location.shortName} no mapa` })
      await route.focus()
      await page.keyboard.press("Tab")
      await expect(viewMap).toBeFocused()
      expect(await viewMap.evaluate((el) => getComputedStyle(el).outlineStyle)).not.toBe("none")
      await expect.poll(() => viewMap.evaluate((el) => {
        const box = el.getBoundingClientRect()
        return el.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2))
      })).toBe(true)
      actionBoxes.push(await route.evaluate((el) => { const box = el.getBoundingClientRect(); return { top: box.top + scrollY, height: box.height } }))
      expect(actionBoxes[index].height).toBeGreaterThanOrEqual(44)
      await page.keyboard.press("Enter")
      await expect(controls.nth(index)).toHaveAttribute("aria-pressed", "true")
      await expect.poll(() => map.evaluate((el) => Math.round(el.getBoundingClientRect().top))).toBe(width >= 1024 ? 96 : 128)
      await expect(map).toContainText(storeAddress(location))
      const iframe = page.getByTestId("store-map-iframe")
      const fallback = page.getByTestId("store-map-fallback")
      if (await iframe.count()) {
        await expect(iframe).toHaveCount(1)
        expect(new URL((await iframe.getAttribute("src"))!).searchParams.get("q")).toBe(storeAddress(location))
        await expect(iframe).toHaveAttribute("loading", "lazy")
      } else {
        expect(new URL((await fallback.getByRole("link").getAttribute("href"))!).searchParams.get("query")).toBe(storeAddress(location))
      }
      expect((await (await iframe.count() ? iframe : fallback).boundingBox())!.height).toBeCloseTo(width >= 768 ? 360 : 280, -1)
      expect(new URL((await map.getByRole("link", { name: "Como chegar", exact: true }).getAttribute("href"))!).searchParams.get("destination")).toBe(storeAddress(location))
    }
    if (width >= 1280) {
      expect(Math.max(...actionBoxes.map((box) => box.top)) - Math.min(...actionBoxes.map((box) => box.top))).toBeLessThan(2)
    }
    for (const [index, button] of (await controls.all()).entries()) {
      await button.focus()
      const beforeScroll = await page.evaluate(() => scrollY)
      await page.keyboard.press(index === 1 ? "Space" : "Enter")
      await expect(button).toHaveAttribute("aria-pressed", "true")
      await expect(button).toBeFocused()
      await expect(button).toContainText("Selecionada")
      expect(await page.evaluate(() => scrollY)).toBe(beforeScroll)
      await assertContrast(button)
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    const data = await page.locator('main script[type="application/ld+json"]').textContent()
    expect(JSON.parse(data!)["@graph"]).toHaveLength(3)
    await page.screenshot({ path: testInfo.outputPath(`${width}-map.png`), fullPage: true })
    await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }))
    await page.screenshot({ path: testInfo.outputPath(`${width}-cards.png`), fullPage: true })
    expect(pageErrors).toEqual([])
  })
}
