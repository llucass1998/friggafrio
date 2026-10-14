import { test, expect } from "@playwright/test"
import { storeAddress, storeLocations } from "../src/config/store-locations"

for (const width of [320, 390, 768, 1440]) {
  test(`three store selection, keyboard and layout at ${width}px`, async ({ page }, testInfo) => {
    const pageErrors: string[] = []
    page.on("pageerror", (error) => pageErrors.push(error.message))
    // Check our embed URL contract without depending on Google availability/quota.
    await page.route("https://www.google.com/maps/embed/**", (route) => route.fulfill({
      contentType: "text/html", body: "<p>Mapa externo isolado para teste</p>",
    }))
    await page.setViewportSize({ width, height: 900 })
    await page.goto("/nossa-loja")
    await expect(page.getByTestId("mobile-navigation-trigger")).toHaveAttribute("data-hydrated", "true")
    const declineCookies = page.getByRole("button", { name: "Recusar opcionais" })
    if (await declineCookies.isVisible()) await declineCookies.click()
    await expect(page).toHaveTitle("Nossas lojas | FriggaFrio")
    await expect(page.getByRole("heading", { name: "Nossas lojas", exact: true })).toBeVisible()
    const selectors = page.getByRole("group", { name: "Escolha uma loja" }).getByRole("button")
    const details = page.getByTestId("store-location-card")
    await expect(selectors).toHaveCount(3)
    await expect(selectors.nth(0)).toHaveAttribute("aria-pressed", "true")
    await expect(details).toHaveCount(1)
    await expect(page.getByRole("tablist", { name: "Visualização da localização" })).toHaveCount(0)
    await expect(page.getByText("Vista da rua", { exact: true })).toHaveCount(0)

    const initialSize = await details.boundingBox()
    for (const [index, location] of storeLocations.entries()) {
      const button = selectors.nth(index)
      await button.focus()
      const scrollY = await page.evaluate(() => window.scrollY)
      await page.keyboard.press(index === 1 ? "Space" : "Enter")
      await expect(button).toHaveAttribute("aria-pressed", "true")
      await expect(button).toBeFocused()
      await expect(button).toContainText("Selecionada")
      expect(await page.evaluate(() => window.scrollY)).toBe(scrollY)
      expect(await button.evaluate((element) => getComputedStyle(element).outlineStyle)).not.toBe("none")
      await expect(details.getByRole("heading", { name: location.name, exact: true })).toBeVisible()
      await expect(details).toContainText(`${location.city}/${location.stateCode}`)
      const photo = details.locator("img")
      await expect(photo).toHaveAttribute("src", location.ownImageSrc!)
      await expect(photo).toHaveAttribute("alt", location.ownImageAlt!)
      await expect.poll(() => photo.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true)
      const photoBox = await photo.boundingBox()
      expect(photoBox!.width / photoBox!.height).toBeCloseTo(4 / 3, 1)
      const mapHeading = details.getByRole("heading", { name: `Mapa da ${location.shortName}` })
      const mapBox = await mapHeading.boundingBox()
      if (width >= 1024) expect(mapBox!.x).toBeGreaterThan(photoBox!.x + photoBox!.width)
      else expect(mapBox!.y).toBeGreaterThan(photoBox!.y + photoBox!.height)
      const direction = details.getByRole("link", { name: `Traçar rota até a ${location.shortName}` })
      const destination = new URL((await direction.getAttribute("href"))!).searchParams.get("destination")
      expect(destination).toBe(storeAddress(location))
      await expect(direction).toHaveAttribute("target", "_blank")
      const iframe = details.getByTestId("store-map-iframe")
      if (await iframe.count()) {
        await expect(iframe).toHaveCount(1)
        await expect(iframe).toHaveAttribute("title", `Mapa da ${location.name}`)
        expect(new URL((await iframe.getAttribute("src"))!).searchParams.get("q")).toBe(destination)
      } else {
        const fallback = details.getByTestId("store-map-fallback")
        await expect(fallback).toContainText(storeAddress(location))
        const search = new URL((await fallback.getByRole("link").getAttribute("href"))!)
        expect(search.searchParams.get("query")).toBe(destination)
      }
      await expect(details.getByRole("link", { name: /WhatsApp/ })).toHaveCount(index === 0 ? 1 : 0)
      if (index > 0) await expect(details).not.toContainText(/CEP|CNPJ|Telefone:|Horário/)
      const size = await details.boundingBox()
      expect(Math.abs(size!.height - initialSize!.height)).toBeLessThanOrEqual(2)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
      if ([390, 1440].includes(width)) {
        await page.screenshot({ path: testInfo.outputPath(`${width}-${location.id}.png`), fullPage: true })
      }
    }
    await expect(page.getByRole("heading", { name: "Retirada gratuita na Loja 1" })).toBeVisible()
    await expect(page.getByText(/A retirada de pedidos é exclusiva da Loja 1/)).toBeVisible()
    await selectors.nth(0).focus()
    await page.keyboard.press("Tab")
    await expect(selectors.nth(1)).toBeFocused()
    await page.keyboard.press("Tab")
    await expect(selectors.nth(2)).toBeFocused()
    await page.keyboard.press("Tab")
    await expect(details.getByRole("link", { name: "Traçar rota até a Loja 3" })).toBeFocused()
    const data = await page.locator('main script[type="application/ld+json"]').textContent()
    expect(JSON.parse(data!)["@graph"]).toHaveLength(3)
    await selectors.nth(0).click()
    await expect(selectors.nth(0)).toHaveAttribute("aria-pressed", "true")
    await expect(details.getByRole("heading", { name: "FriggaFrio", exact: true })).toBeVisible()
    expect(pageErrors).toEqual([])
  })
}
