import { test, expect } from "@playwright/test"

const homeSections = [
  "home-specialized-products",
  "home-best-sellers",
  "home-maintenance-products",
]

const viewports = [
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
]

test.describe("Carrosséis da Home", () => {
  for (const viewport of viewports) {
    test(`mantém cards inteiros e alinhamento em ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await page.goto("/br", { waitUntil: "networkidle" })

      const result = await page.evaluate((sectionIds) => {
        const sections = sectionIds.map((id) => {
          const section = document.querySelector<HTMLElement>(`[data-testid="${id}"]`)
          const heading = section?.querySelector("h2")?.getBoundingClientRect()
          const viewport = section?.querySelector<HTMLElement>("[data-carousel-viewport]")
          const track = viewport?.querySelector<HTMLElement>("[data-carousel-track]")
          const viewportRect = viewport?.getBoundingClientRect()
          const cards = track
            ? [...track.querySelectorAll<HTMLElement>("[data-carousel-slide]")]
                .map((card) => card.getBoundingClientRect())
                .filter((rect) => rect.right > (viewportRect?.left ?? 0) && rect.left < (viewportRect?.right ?? 0))
            : []
          const partialCards = viewportRect
            ? cards.filter((rect) => rect.left < viewportRect.left - 1 || rect.right > viewportRect.right + 1).length
            : 0
          const overlapCount = cards.reduce((count, card, index) => (
            count + cards.slice(index + 1).filter((next) => Math.min(card.right, next.right) > Math.max(card.left, next.left) + 1).length
          ), 0)
          const widths = cards.map((card) => card.width)
          const maxWidthDelta = widths.length ? Math.max(...widths) - Math.min(...widths) : 0
          const controls = section?.querySelector<HTMLElement>("[data-carousel-controls=section-header]")?.getBoundingClientRect()

          return {
            id,
            headingLeft: heading?.left ?? null,
            viewportLeft: viewportRect?.left ?? null,
            viewportRight: viewportRect?.right ?? null,
            partialCards,
            overlapCount,
            maxWidthDelta,
            controlsAboveCards: !controls || !viewportRect || controls.bottom <= viewportRect.top + 1,
          }
        })

        return {
          documentOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          sections,
        }
      }, homeSections)

      const leftEdges = result.sections.map((section) => section.headingLeft).filter((left): left is number => left !== null)
      expect(result.documentOverflow).toBe(0)
      expect(new Set(leftEdges).size).toBe(1)
      for (const section of result.sections) {
        expect(section.partialCards).toBe(0)
        expect(section.overlapCount).toBe(0)
        expect(section.maxWidthDelta).toBeLessThanOrEqual(1)
        expect(section.controlsAboveCards).toBe(true)
      }
    })
  }

  test("a equipe usa o mesmo container e não exibe card cortado", async ({ page }) => {
    for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
      await page.setViewportSize(viewport)
      await page.goto("/quem-somos", { waitUntil: "networkidle" })

      const result = await page.locator("h2").filter({ hasText: "Quem faz a Frigga" }).evaluate((heading) => {
        const section = heading.closest("section")
        const viewport = section?.querySelector<HTMLElement>("[data-carousel-viewport]")
        const track = viewport?.querySelector<HTMLElement>("[data-carousel-track]")
        const viewportRect = viewport?.getBoundingClientRect()
        const cards = track
          ? [...track.querySelectorAll<HTMLElement>("[data-carousel-slide]")]
              .map((card) => card.getBoundingClientRect())
              .filter((rect) => rect.right > (viewportRect?.left ?? 0) && rect.left < (viewportRect?.right ?? 0))
          : []
        return {
          documentOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          sectionLeft: heading.getBoundingClientRect().left,
          viewportLeft: viewportRect?.left ?? null,
          partialCards: viewportRect ? cards.filter((rect) => rect.left < viewportRect.left - 1 || rect.right > viewportRect.right + 1).length : 0,
          overlapCount: cards.reduce((count, card, index) => count + cards.slice(index + 1).filter((next) => Math.min(card.right, next.right) > Math.max(card.left, next.left) + 1).length, 0),
        }
      })

      expect(result.documentOverflow).toBe(0)
      expect(result.viewportLeft).toBe(result.sectionLeft)
      expect(result.partialCards).toBe(0)
      expect(result.overlapCount).toBe(0)
    }
  })
})
