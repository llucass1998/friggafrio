import { test, expect } from "@playwright/test"

async function openMobileDrawer(page: import("@playwright/test").Page) {
  const trigger = page.getByTestId("mobile-navigation-trigger")
  await expect(trigger).toHaveAttribute("data-hydrated", "true", { timeout: 15000 })
  const drawer = page.getByTestId("mobile-navigation-drawer")
  await expect(drawer).toHaveAttribute("data-state", "closed")
  await trigger.click()
  await expect(drawer).toHaveAttribute("data-state", "open")
  return drawer
}

function translateX(transform: string) {
  const match = transform.match(/matrix\([^,]+,\s*[^,]+,\s*[^,]+,\s*[^,]+,\s*([^,]+)/)
  return match ? Number.parseFloat(match[1]) : Number.NaN
}

test.describe("storefront motion interactions", () => {
  test("mobile drawer uses a 150ms delay and 150ms slide transition", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto("/br", { waitUntil: "networkidle" })
    await page.waitForTimeout(750)
    const drawer = page.getByTestId("mobile-navigation-drawer")
    await expect(drawer).toHaveAttribute("data-state", "closed")
    const initialTransform = await drawer.evaluate((element) => getComputedStyle(element).transform)
    expect(initialTransform).toMatch(/matrix\([^,]+, [^,]+, [^,]+, [^,]+, -/)
    await page.getByTestId("mobile-navigation-trigger").click()
    await expect(drawer).toHaveAttribute("data-state", "open")
    await page.waitForTimeout(100)
    const delayedTransform = await drawer.evaluate((element) => getComputedStyle(element).transform)
    expect(delayedTransform).toMatch(/matrix\([^,]+, [^,]+, [^,]+, [^,]+, -/)
    await page.waitForTimeout(250)
    await expect(drawer).toHaveAttribute("data-state", "open")
    const transition = await drawer.evaluate((element) => getComputedStyle(element).transitionDuration)
    expect(Number.parseFloat(transition)).toBeCloseTo(0.15, 2)
    const finalTransform = await drawer.evaluate((element) => getComputedStyle(element).transform)
    expect(Math.abs(translateX(finalTransform))).toBeLessThan(0.5)

    await page.getByTestId("mobile-navigation-close").click()
    await page.waitForTimeout(100)
    const closeDelayedTransform = await drawer.evaluate((element) => getComputedStyle(element).transform)
    expect(Math.abs(translateX(closeDelayedTransform))).toBeLessThan(0.5)
    await page.waitForTimeout(120)
    const closeIntermediateTransform = await drawer.evaluate((element) => getComputedStyle(element).transform)
    expect(translateX(closeIntermediateTransform)).toBeLessThan(-0.5)
    await page.waitForTimeout(120)
    const closeFinal = await drawer.evaluate((element) => ({
      transform: getComputedStyle(element).transform,
      visibility: getComputedStyle(element).visibility,
    }))
    expect(translateX(closeFinal.transform)).toBeLessThan(-0.5)
    expect(closeFinal.visibility).toBe("hidden")
  })

  test("mobile drawer opens, closes, and navigates without blocking the page", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto("/br")
    await page.waitForTimeout(750)

    const drawer = await openMobileDrawer(page)
    await expect(drawer).toBeVisible()
    await expect(drawer.getByRole("link", { name: "Produtos", exact: true })).toBeVisible()
    await expect(drawer.getByRole("link", { name: "Nossa Loja" })).toBeVisible()

    await page.getByTestId("mobile-navigation-overlay").click({ position: { x: 380, y: 420 } })
    await expect(drawer).toHaveAttribute("data-state", "closed")
    await expect(drawer).toHaveAttribute("data-state", "closed")

    await openMobileDrawer(page)
    await drawer.getByRole("link", { name: "Nossa Loja" }).click()
    await expect(page).toHaveURL(/\/nossa-loja$/)
    await expect(drawer).toHaveAttribute("data-state", "closed")
  })

  test("mobile header stays fixed and restores page scrolling after drawer close", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto("/br", { waitUntil: "networkidle" })
    await page.waitForTimeout(750)

    const headerMetrics = await page.locator(".mobile-site-header").evaluate((element) => {
      const rect = element.getBoundingClientRect()
      return { top: rect.top, position: getComputedStyle(element).position }
    })
    expect(headerMetrics.position).toBe("fixed")
    expect(headerMetrics.top).toBe(0)

    await page.evaluate(() => window.scrollTo(0, 320))
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0)
    const scrolledHeaderTop = await page.locator(".mobile-site-header").evaluate((element) => element.getBoundingClientRect().top)
    expect(scrolledHeaderTop).toBe(0)

    const drawer = await openMobileDrawer(page)
    const lockedOverflow = await page.evaluate(() => ({
      body: document.body.style.overflow,
      html: document.documentElement.style.overflow,
    }))
    expect(lockedOverflow).toEqual({ body: "hidden", html: "hidden" })

    const drawerContent = drawer.locator(".mobile-drawer-content")
    await expect(drawerContent).toBeVisible()
    const internalScroll = await drawer.evaluate((panel) => {
      const element = panel.querySelector<HTMLElement>(".mobile-drawer-content")
      if (!element) throw new Error("drawer scroll container missing")
      element.scrollTop = 160
      const panelStyle = getComputedStyle(panel)
      const style = getComputedStyle(element)
      return {
        scrollTop: element.scrollTop,
        scrollHeight: element.scrollHeight,
        clientHeight: element.clientHeight,
        overflowY: style.overflowY,
        touchAction: style.touchAction,
        panelOverflowY: panelStyle.overflowY,
        scrollOwnerCount: [panel, element].filter((candidate) => {
          const overflow = getComputedStyle(candidate).overflowY
          return overflow === "auto" || overflow === "scroll"
        }).length,
      }
    })
    expect(internalScroll.overflowY).toBe("auto")
    expect(internalScroll.touchAction).toBe("pan-y")
    expect(internalScroll.panelOverflowY).toBe("hidden")
    expect(internalScroll.scrollOwnerCount).toBe(1)
    if (internalScroll.scrollHeight > internalScroll.clientHeight) {
      expect(internalScroll.scrollTop).toBeGreaterThan(0)
    }

    if (internalScroll.scrollHeight > internalScroll.clientHeight) {
      await drawerContent.evaluate((element) => { element.scrollTop = 0 })
      // Wait for the CSS entrance transition so the scroll target is in the viewport.
      await page.waitForTimeout(350)
      const box = await drawerContent.boundingBox()
      if (!box) throw new Error("drawer content bounds unavailable")
      const client = await page.context().newCDPSession(page)
      const x = box.x + box.width / 2
      const startY = box.y + box.height - 80
      await client.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [{ x, y: startY, id: 1 }],
      })
      for (let index = 1; index <= 12; index += 1) {
        await client.send("Input.dispatchTouchEvent", {
          type: "touchMove",
          touchPoints: [{ x, y: startY - index * 35, id: 1 }],
        })
      }
      await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] })
      await expect.poll(() => drawerContent.evaluate((element) => element.scrollTop)).toBeGreaterThan(0)
    }

    await page.getByTestId("mobile-navigation-close").click()
    await expect(drawer).toHaveAttribute("data-state", "closed")
    await expect.poll(() => page.evaluate(() => ({
      body: document.body.style.overflow,
      html: document.documentElement.style.overflow,
      scrollY: window.scrollY,
    }))).toEqual({ body: "", html: "", scrollY: 320 })

    await page.evaluate(() => window.scrollBy(0, 240))
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(320)
  })

  test("mobile header contract holds at supported compact widths", async ({ page }) => {
    for (const width of [360, 390, 430]) {
      await page.setViewportSize({ width, height: 844 })
      await page.goto("/br", { waitUntil: "domcontentloaded" })
      await page.waitForTimeout(750)

      const header = page.locator(".mobile-site-header")
      await expect(header).toBeVisible()
      await expect(page.locator(".mobile-site-header input[placeholder*='Busque por produto']:visible")).toHaveCount(0)
      const metrics = await header.evaluate((element) => {
        const rect = element.getBoundingClientRect()
        const computed = getComputedStyle(element)
        return { top: rect.top, position: computed.position, width: rect.width, viewportWidth: window.innerWidth }
      })
      expect(metrics.position).toBe("fixed")
      expect(metrics.top).toBe(0)
      expect(metrics.width).toBe(metrics.viewportWidth)
    }
  })

  test("desktop Products dropdown uses click, route, and Escape close", async ({ page, isMobile }) => {
    test.skip(isMobile, "desktop navigation is covered by the Chromium project")
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto("/br", { waitUntil: "networkidle" })
    await page.waitForTimeout(750)

    const productsTrigger = page.locator("header button[aria-controls^='products-mega-menu-']:visible").first()
    await expect(productsTrigger).toBeVisible({ timeout: 15000 })
    await productsTrigger.click()
    const productsMenu = page.locator("[id^='products-mega-menu-']:visible").first()
    await expect(productsMenu).toBeVisible()

    await productsMenu.getByRole("link", { name: "Ver todos os produtos" }).click()
    await expect(page).toHaveURL(/\/br\/store(?:\?.*)?$/)

    await page.goto("/br")
    await page.waitForTimeout(750)
    await page.locator("header button[aria-controls^='products-mega-menu-']:visible").first().click()
    await page.keyboard.press("Escape")
    await expect(page.locator("[id^='products-mega-menu-']:visible")).toHaveCount(0)
  })

  test("cart drawer opens and closes with the Radix lifecycle", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto("/br", { waitUntil: "networkidle" })
    await page.waitForTimeout(750)

    await page.getByRole("button", { name: /Abrir carrinho com/ }).click()
    await expect(page.getByRole("heading", { name: "Seu Carrinho", exact: true })).toBeVisible({ timeout: 15000 })

    await page.getByRole("button", { name: "Fechar carrinho" }).click()
    await expect(page.getByRole("heading", { name: "Seu Carrinho", exact: true })).toBeHidden()
  })

  test("reduced motion removes non-essential drawer timing", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto("/br")
    await page.waitForTimeout(750)
    await openMobileDrawer(page)

    const transitionDuration = await page.getByTestId("mobile-navigation-drawer").evaluate(
      (element) => Number.parseFloat(getComputedStyle(element).transitionDuration)
    )

    expect(transitionDuration).toBeLessThanOrEqual(0.01)
  })

  test("mobile accessibility panel returns focus to a visible trigger", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto("/br")
    await page.waitForTimeout(750)

    const drawer = await openMobileDrawer(page)
    await drawer.getByRole("button", { name: "Acessibilidade", exact: true }).click()
    await expect(page.getByRole("dialog", { name: "Recursos de Acessibilidade" })).toBeVisible()

    await page.keyboard.press("Escape")
    await expect(page.getByRole("dialog", { name: "Recursos de Acessibilidade" })).toBeHidden()
    await expect(page.getByTestId("mobile-navigation-trigger")).toBeFocused()
  })
})
