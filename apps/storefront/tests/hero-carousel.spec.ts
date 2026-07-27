import { test, expect } from "@playwright/test"

test.describe("Hero Carousel Display and Animations", () => {
  const viewports = [
    { width: 1440, height: 900 },
    { width: 1665, height: 1080 },
    { width: 1920, height: 1080 },
  ]

  for (const vp of viewports) {
    test(`hero carousel uses the approved desktop width at ${vp.width}px`, async ({ page }) => {
      await page.setViewportSize(vp)
      await page.goto("/br")

      const measurement = await page
        .getByTestId("home-hero-carousel")
        .evaluate((element) => {
          const rect = element.getBoundingClientRect()
          return {
            viewport: window.innerWidth,
            width: rect.width,
            percentage: rect.width / window.innerWidth,
            left: rect.left,
            right: rect.right,
          }
        })

      console.log(`Viewport: ${vp.width}px -> Carousel Width: ${measurement.width}px (${(measurement.percentage * 100).toFixed(2)}%)`)

      expect(measurement.percentage).toBeGreaterThanOrEqual(0.98)
      expect(measurement.percentage).toBeLessThanOrEqual(1.0)

      if (vp.width === 1665) {
        expect(measurement.width).toBeGreaterThanOrEqual(1600)
      }
    })
  }

  test("hero carousel animations function correctly", async ({ page }) => {
    // Definimos a viewport normal desktop
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto("/br")

    // Pegar todos os slides e identificar o ativo
    const slides = page.locator('.carousel-slide')
    await slides.first().waitFor({ state: 'attached' })

    // Obter index do ativo atual (esperado ser o 0 no load inicial)
    const activeIndex = await page.evaluate(() => {
      const allSlides = Array.from(document.querySelectorAll('.carousel-slide'))
      return allSlides.findIndex(el => el.getAttribute('data-active') === 'true')
    })

    // Obter elemento e avaliar transform e opacity
    const activeSlide = slides.nth(activeIndex)

    const styles = await activeSlide.evaluate((el) => {
      const img = el.querySelector('.carousel-slide-img')
      const title = el.querySelector('.carousel-title')

      return {
        imgTransform: img ? window.getComputedStyle(img).transform : null,
        titleOpacity: title ? window.getComputedStyle(title).opacity : null,
        titleTransition: title ? window.getComputedStyle(title).transitionDuration : null,
      }
    })

    expect(styles.titleTransition).not.toBe("0s")

    // Clicar para ir para o próximo slide
    const nextBtn = page.getByRole('button', { name: /Ver próximo slide/i })
    await nextBtn.click()

    // Esperar a transição de data-active do slide anterior ficar false, e o proximo ficar true
    await expect(activeSlide).toHaveAttribute('data-active', 'false', { timeout: 15000 })

    // Identificar novo ativo
    const newActiveIndex = await page.evaluate(() => {
      const allSlides = Array.from(document.querySelectorAll('.carousel-slide'))
      return allSlides.findIndex(el => el.getAttribute('data-active') === 'true')
    })

    expect(newActiveIndex).not.toBe(activeIndex)

    const newActiveSlide = slides.nth(newActiveIndex)

    // Comprovar estilos aplicados durante a animação
    const newStyles = await newActiveSlide.evaluate((el) => {
      const title = el.querySelector('.carousel-title')
      const progress = el.parentElement?.parentElement?.querySelector('.carousel-indicator-active .carousel-indicator-progress')

      return {
        titleOpacity: title ? window.getComputedStyle(title).opacity : null,
        progressAnim: progress ? window.getComputedStyle(progress).animationName : null,
      }
    })

    expect(newStyles.progressAnim).not.toBe("none")
  })
})

test("hero carousel dots click and select correctly", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto("/br")

  const slides = page.locator('.carousel-slide')
  await slides.first().waitFor({ state: 'attached' })

  // Verify first slide is active
  await expect(slides.nth(0)).toHaveAttribute('data-active', 'true', { timeout: 15000 })

  // Wait for the Carousel Embla API and React to be fully hydrated by checking the readiness of the Next button
  const nextButton = page.getByRole("button", { name: /Ver próximo slide/i })
  await expect(nextButton).toBeEnabled({ timeout: 15000 })

  // Click on the 3rd dot (index 2)
  const dot3 = page.locator('button[aria-label="Ir para o destaque 3 de 5"]')
  await expect(dot3).toBeVisible()
  await expect(dot3).toBeEnabled()
  await expect(dot3).toHaveAttribute("aria-current", "false")
  await dot3.click()

  // Wait for the slide to become active (Playwright will auto-retry)
  await expect(dot3).toHaveAttribute("aria-current", "true")
  await expect(slides.nth(2)).toHaveAttribute('data-active', 'true', { timeout: 15000 })
})

function rectanglesIntersect(
  first: { x: number; y: number; width: number; height: number },
  second: { x: number; y: number; width: number; height: number }
) {
  return !(
    first.x + first.width <= second.x ||
    second.x + second.width <= first.x ||
    first.y + first.height <= second.y ||
    second.y + second.height <= first.y
  )
}

test.describe("Hero Carousel UI Overlap Avoidance", () => {
  const overlapViewports = [
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1440, height: 900 },
    { width: 1920, height: 1080 },
  ]
  
  for (const vp of overlapViewports) {
    test(`hero controls should not overlap content text boxes at ${vp.width}x${vp.height}`, async ({ page }) => {
      await page.setViewportSize(vp)
      await page.goto("/br")
      
      // Wait for components to attach
      await page.locator('.carousel-slide[data-active="true"]').waitFor({ state: 'attached' })
      
      const prevBtn = page.getByRole('button', { name: /Ver slide anterior/i })
      const nextBtn = page.getByRole('button', { name: /Ver próximo slide/i })
      
      const activeTitle = page.locator('.carousel-slide[data-active="true"] .carousel-title')
      const activeDesc = page.locator('.carousel-slide[data-active="true"] .carousel-desc')
      const activeCta = page.locator('.carousel-slide[data-active="true"] a').filter({ hasText: 'Ver categoria' })
      
      const prevRect = await prevBtn.boundingBox()
      const nextRect = await nextBtn.boundingBox()
      
      const titleRect = await activeTitle.boundingBox()
      const descRect = await activeDesc.boundingBox()
      const ctaRect = await activeCta.boundingBox()
      
      expect(prevRect).not.toBeNull()
      expect(nextRect).not.toBeNull()
      expect(titleRect).not.toBeNull()
      expect(descRect).not.toBeNull()
      expect(ctaRect).not.toBeNull()
      
      const results = {
        VIEWPORT: `${vp.width}x${vp.height}`,
        PREVIOUS_BUTTON_RECT: prevRect,
        NEXT_BUTTON_RECT: nextRect,
        TITLE_RECT: titleRect,
        DESCRIPTION_RECT: descRect,
        CTA_RECT: ctaRect,
        INTERSECTS_TITLE_PREV: rectanglesIntersect(prevRect!, titleRect!),
        INTERSECTS_DESCRIPTION_PREV: rectanglesIntersect(prevRect!, descRect!),
        INTERSECTS_CTA_PREV: rectanglesIntersect(prevRect!, ctaRect!),
        INTERSECTS_TITLE_NEXT: rectanglesIntersect(nextRect!, titleRect!),
        INTERSECTS_DESCRIPTION_NEXT: rectanglesIntersect(nextRect!, descRect!),
        INTERSECTS_CTA_NEXT: rectanglesIntersect(nextRect!, ctaRect!)
      }
      
      console.log(JSON.stringify(results, null, 2))

      // expect strict overlap avoidance on all viewports
      expect(results.INTERSECTS_TITLE_PREV).toBe(false)
      expect(results.INTERSECTS_DESCRIPTION_PREV).toBe(false)
      expect(results.INTERSECTS_CTA_PREV).toBe(false)

      expect(results.INTERSECTS_TITLE_NEXT).toBe(false)
      expect(results.INTERSECTS_DESCRIPTION_NEXT).toBe(false)
      expect(results.INTERSECTS_CTA_NEXT).toBe(false)
    })
  }
})
