import { storeBrands } from "@/config/brands"
import { BrandLogoCard } from "@/components/home/store-brands-carousel/BrandLogoCard"
import { CarouselSectionHeader, CarouselSideControls, useInfiniteCarousel } from "@/components/carousel/InfiniteCarousel"
import { useEffect, useState } from "react"

export function StoreBrandsCarousel() {
  const activeBrands = storeBrands.filter((brand) => brand.active).sort((a, b) => a.order - b.order)
  const { viewportRef, emblaApi, hasOverflow, canScrollPrev, canScrollNext, scrollPrev, scrollNext, onKeyDown } = useInfiniteCarousel([], true)

  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const media = window.matchMedia("(max-width: 639px)")
    const update = () => setIsMobile(media.matches)
    update()
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [])

  useEffect(() => {
    if (!emblaApi || !isMobile || !hasOverflow) return
    const root = emblaApi.rootNode()
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
    const visible = { current: true }
    let paused = false
    let resumeTimer: number | undefined
    let interval: number | undefined
    const clearResume = () => { if (resumeTimer !== undefined) window.clearTimeout(resumeTimer); resumeTimer = undefined }
    const stop = () => { paused = true; if (interval !== undefined) window.clearInterval(interval); interval = undefined }
    const schedule = (delay = 0) => {
      clearResume()
      if (reducedMotion.matches || !visible.current || !hasOverflow) return
      paused = false
      if (interval === undefined) interval = window.setInterval(() => { if (!paused && visible.current && !document.hidden) emblaApi.scrollNext() }, 3000)
      if (delay > 0) { stop(); resumeTimer = window.setTimeout(() => schedule(), delay) }
    }
    const onPointerDown = () => stop()
    const onPointerUp = () => schedule(5000)
    const onFocusIn = () => stop()
    const onFocusOut = () => { if (!root.contains(document.activeElement)) schedule(5000) }
    const onVisibility = () => { if (document.hidden) stop(); else schedule() }
    const observer = new IntersectionObserver(([entry]) => { visible.current = Boolean(entry?.isIntersecting); if (visible.current) schedule(); else stop() }, { threshold: 0.1 })
    observer.observe(root)
    root.addEventListener("pointerdown", onPointerDown)
    root.addEventListener("pointerup", onPointerUp)
    root.addEventListener("focusin", onFocusIn)
    root.addEventListener("focusout", onFocusOut)
    document.addEventListener("visibilitychange", onVisibility)
    schedule()
    return () => {
      stop(); clearResume(); observer.disconnect()
      root.removeEventListener("pointerdown", onPointerDown)
      root.removeEventListener("pointerup", onPointerUp)
      root.removeEventListener("focusin", onFocusIn)
      root.removeEventListener("focusout", onFocusOut)
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [emblaApi, hasOverflow, isMobile])

  if (activeBrands.length === 0) return null

  return (
    <section className="ff-brands-carousel border-y border-[var(--color-border)] bg-[#f0f9ff]/30 py-8 md:py-10" aria-label="Marcas parceiras da FriggaFrio">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <CarouselSectionHeader
          title="Marcas que você encontra na FriggaFrio"
          description="Trabalhamos com produtos de marcas reconhecidas no setor de refrigeração, climatização e controle, conforme a disponibilidade do nosso catálogo."
          hasOverflow={hasOverflow}
          canScrollPrevious={canScrollPrev}
          canScrollNext={canScrollNext}
          onPrevious={scrollPrev}
          onNext={scrollNext}
          showControlsInHeader={false}
          previousLabel="Marca anterior"
          nextLabel="Próxima marca"
        />

        <div className="ff-carousel-stage">
          <CarouselSideControls side="previous" hasOverflow={hasOverflow} canScrollPrevious={canScrollPrev} canScrollNext={canScrollNext} onPrevious={scrollPrev} onNext={scrollNext} previousLabel="Marca anterior" nextLabel="Próxima marca" />
          <div ref={viewportRef} className="ff-carousel-viewport" data-carousel-viewport="true" role="region" tabIndex={0} aria-label="Marcas parceiras" onKeyDown={onKeyDown}>
          <div className="ff-carousel-track" data-carousel-track="true">
            {activeBrands.map((brand) => (
              <div key={brand.id} className="ff-carousel-slide ff-brand-slide flex min-w-0" data-carousel-slide="true">
                <BrandLogoCard
                  name={brand.name}
                  logoSrc={brand.logoSrc}
                  logoAlt={brand.logoAlt}
                  websiteUrl={(brand as { websiteUrl?: string }).websiteUrl}
                />
              </div>
            ))}
          </div>
          </div>
          <CarouselSideControls side="next" hasOverflow={hasOverflow} canScrollPrevious={canScrollPrev} canScrollNext={canScrollNext} onPrevious={scrollPrev} onNext={scrollNext} previousLabel="Marca anterior" nextLabel="Próxima marca" />
        </div>
      </div>
    </section>
  )
}
