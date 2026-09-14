import { storeBrands } from "@/config/brands"
import { BrandLogoCard } from "@/components/home/store-brands-carousel/BrandLogoCard"
import { CarouselSectionHeader, useInfiniteCarousel } from "@/components/carousel/InfiniteCarousel"
import { useEffect } from "react"

export function StoreBrandsCarousel() {
  const activeBrands = storeBrands.filter((brand) => brand.active).sort((a, b) => a.order - b.order)
  const { viewportRef, emblaApi, hasOverflow, onKeyDown } = useInfiniteCarousel([], true)

  useEffect(() => {
    if (!emblaApi || !hasOverflow) return
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
      if (interval === undefined) interval = window.setInterval(() => { if (!paused && visible.current && !document.hidden) emblaApi.scrollNext() }, 1500)
      if (delay > 0) { stop(); resumeTimer = window.setTimeout(() => schedule(), delay) }
    }
    const onPointerEnter = () => stop()
    const onPointerLeave = () => schedule(1500)
    const onPointerDown = () => stop()
    const onPointerUp = () => schedule(3000)
    const onFocusIn = () => stop()
    const onFocusOut = () => { if (!root.contains(document.activeElement)) schedule(1500) }
    const onVisibility = () => { if (document.hidden) stop(); else schedule() }
    const observer = new IntersectionObserver(([entry]) => { visible.current = Boolean(entry?.isIntersecting); if (visible.current) schedule(); else stop() }, { threshold: 0.1 })
    observer.observe(root)
    root.addEventListener("pointerenter", onPointerEnter)
    root.addEventListener("pointerleave", onPointerLeave)
    root.addEventListener("pointerdown", onPointerDown)
    root.addEventListener("pointerup", onPointerUp)
    root.addEventListener("focusin", onFocusIn)
    root.addEventListener("focusout", onFocusOut)
    document.addEventListener("visibilitychange", onVisibility)
    schedule()
    return () => {
      stop(); clearResume(); observer.disconnect()
      root.removeEventListener("pointerenter", onPointerEnter)
      root.removeEventListener("pointerleave", onPointerLeave)
      root.removeEventListener("pointerdown", onPointerDown)
      root.removeEventListener("pointerup", onPointerUp)
      root.removeEventListener("focusin", onFocusIn)
      root.removeEventListener("focusout", onFocusOut)
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [emblaApi, hasOverflow])

  if (activeBrands.length === 0) return null

  return (
    <section className="ff-brands-carousel bg-white py-12 md:py-16" aria-label="Marcas parceiras da FriggaFrio">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <CarouselSectionHeader
          title="Marcas que você encontra na FriggaFrio"
          description="Trabalhamos com produtos de marcas reconhecidas no setor de refrigeração, climatização e controle, conforme a disponibilidade do nosso catálogo."
          hasOverflow={hasOverflow}
          showControlsInHeader={false}
          onPrevious={() => emblaApi?.scrollPrev()}
          onNext={() => emblaApi?.scrollNext()}
          previousLabel="Marca anterior"
          nextLabel="Próxima marca"
        />

        <div className="w-full overflow-hidden">
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
        </div>
      </div>
    </section>
  )
}
