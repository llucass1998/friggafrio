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

      expect(measurement.percentage).toBeGreaterThanOrEqual(0.9)
      expect(measurement.percentage).toBeLessThanOrEqual(0.97)

      if (vp.width === 1665) {
        expect(measurement.width).toBeGreaterThanOrEqual(1498)
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
    let activeIndex = await page.evaluate(() => {
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
    
    // Esperar um tempinho para a transição inicializar
    await page.waitForTimeout(200)
    
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
