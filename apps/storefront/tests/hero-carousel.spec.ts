import { test, expect } from "@playwright/test"

// Three full autoplay cycles need more than Playwright's default 30 seconds.
test.setTimeout(60_000)

const viewports = [
  { width: 390, height: 844, minHeight: 240, maxHeight: 300 },
  { width: 768, height: 1024, minHeight: 320, maxHeight: 380 },
  { width: 1024, height: 900, minHeight: 340, maxHeight: 420 },
  { width: 1440, height: 900, minHeight: 400, maxHeight: 460 },
  { width: 1920, height: 1080, minHeight: 400, maxHeight: 460 },
]

test.describe("Hero promocional", () => {
  test.beforeEach(async ({ request }) => {
    // Fail closed before navigation when the local API is unavailable; a blank
    // storefront must not be reported as a visual regression.
    try {
      const health = await request.get("http://127.0.0.1:9000/health", { timeout: 5_000 })
      test.skip(!health.ok(), "Local backend health check unavailable")
    } catch {
      test.skip(true, "Local backend health check unavailable")
    }
  })

  for (const viewport of viewports) {
    test(`preserva a arte e usa altura controlada em ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await page.goto("/br", { waitUntil: "networkidle" })

      const hero = page.getByTestId("home-hero-carousel")
      const measurement = await hero.evaluate((element) => {
        const stage = element.querySelector<HTMLElement>(".ff-hero-controls-stage")
        const images = [...element.querySelectorAll<HTMLImageElement>(".carousel-slide-img")]
        const slideControls = [...element.querySelectorAll<HTMLButtonElement>('button[aria-label*="slide"]')]
        const previous = slideControls[0]?.getBoundingClientRect()
        const next = slideControls[slideControls.length - 1]?.getBoundingClientRect()
        const stageRect = stage?.getBoundingClientRect()
        const indicator = element.querySelector<HTMLElement>(".carousel-indicator-bar")?.parentElement?.parentElement?.getBoundingClientRect()
        const documentOverflow = document.documentElement.scrollWidth - document.documentElement.clientWidth
        return {
          heroWidth: element.getBoundingClientRect().width,
          heroHeight: stageRect?.height ?? 0,
          imageCount: images.length,
          loadedImages: images.filter((image) => image.complete && image.naturalWidth > 0).length,
          objectFit: images[0] ? getComputedStyle(images[0]).objectFit : "",
          overlayTitles: element.querySelectorAll(".carousel-title, .carousel-desc, .carousel-cta").length,
          dots: element.querySelectorAll(".carousel-indicator-bar").length,
          arrowsInsideStage: Boolean(
            stageRect &&
              previous &&
              next &&
              previous.left >= stageRect.left &&
              next.right <= stageRect.right &&
              previous.top >= stageRect.top &&
              next.bottom <= stageRect.bottom,
          ),
          arrowsClearIndicators: Boolean(
            previous &&
              next &&
              indicator &&
              (previous.bottom <= indicator.top || previous.top >= indicator.bottom) &&
              (next.bottom <= indicator.top || next.top >= indicator.bottom),
          ),
          documentOverflow,
        }
      })

      expect(measurement.heroWidth / viewport.width).toBeGreaterThanOrEqual(0.98)
      expect(measurement.heroHeight).toBeGreaterThanOrEqual(viewport.minHeight)
      expect(measurement.heroHeight).toBeLessThanOrEqual(viewport.maxHeight)
      expect(measurement.imageCount).toBe(3)
      expect(measurement.loadedImages).toBe(3)
      expect(measurement.objectFit).toBe("contain")
      expect(measurement.overlayTitles).toBe(0)
      expect(measurement.dots).toBe(3)
      expect(measurement.arrowsInsideStage).toBe(true)
      expect(measurement.arrowsClearIndicators).toBe(true)
      expect(measurement.documentOverflow).toBe(0)
    })
  }

  test("setas e dots navegam pelos três slides", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto("/br", { waitUntil: "networkidle" })

    const slides = page.locator(".carousel-slide")
    const dots = page.locator(".carousel-indicator-bar")
    await expect(slides).toHaveCount(3)
    await expect(dots).toHaveCount(3)

    // Autoplay may advance while other parallel pages finish loading; controls must
    // still move relative to the currently selected slide rather than assuming zero.
    const initialIndex = await page.locator('.carousel-slide[data-active="true"]').evaluate((slide) =>
      [...document.querySelectorAll(".carousel-slide")].indexOf(slide),
    )
    const next = page.locator('button[aria-label*="slide"]').last()
    await next.click()
    await expect(slides.nth((initialIndex + 1) % 3)).toHaveAttribute("data-active", "true")

    await dots.nth(2).click()
    await expect(slides.nth(2)).toHaveAttribute("data-active", "true")

    const previous = page.locator('button[aria-label*="slide"]').first()
    await previous.click()
    await expect(slides.nth(1)).toHaveAttribute("data-active", "true")
  })

  test("mantem semantica acessivel e transicao ao trocar slide", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto("/br", { waitUntil: "networkidle" })

    const carousel = page.getByTestId("home-hero-carousel")
    await expect(carousel).toHaveAttribute("aria-roledescription", "carousel")
    await expect(carousel).toHaveAttribute("aria-label", /Destaques/)

    const controls = page.locator('button[aria-label*="slide"]')
    await expect(controls).toHaveCount(2)
    await expect(controls.first()).toHaveAttribute("type", "button")
    await expect(controls.last()).toHaveAttribute("type", "button")

    const initialIndex = await page.locator('.carousel-slide[data-active="true"]').evaluate((slide) =>
      [...document.querySelectorAll(".carousel-slide")].indexOf(slide),
    )
    await controls.last().click()
    await page.waitForTimeout(700)

    const nextIndex = await page.locator('.carousel-slide[data-active="true"]').evaluate((slide) =>
      [...document.querySelectorAll(".carousel-slide")].indexOf(slide),
    )
    expect(nextIndex).not.toBe(initialIndex)

    const transition = await page.locator('.carousel-slide[data-active="true"]').evaluate((slide) => ({
      slideTransition: getComputedStyle(slide).transitionDuration,
      progressAnimation: getComputedStyle(slide.closest("[aria-roledescription=carousel]")?.querySelector(".carousel-indicator-active .carousel-indicator-progress") as HTMLElement).animationName,
    }))
    expect(transition.slideTransition).not.toBe("0s")
    expect(transition.progressAnimation).not.toBe("none")
  })

  test("autoplay percorre o loop sem slide vazio", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto("/br", { waitUntil: "networkidle" })

    const activeIndexes: number[] = []
    for (let index = 0; index < 7; index += 1) {
      activeIndexes.push(await page.locator('.carousel-slide[data-active="true"]').evaluate((slide) => {
        const slides = [...document.querySelectorAll(".carousel-slide")]
        return slides.indexOf(slide)
      }))
      await page.waitForTimeout(5000)
    }

    expect(activeIndexes).toEqual(expect.arrayContaining([0, 1, 2]))
    const activeImageWidth = await page
      .locator('.carousel-slide[data-active="true"] .carousel-slide-img')
      .evaluate((image: HTMLImageElement) => image.naturalWidth)
    expect(activeImageWidth).toBeGreaterThan(0)
  })
})
