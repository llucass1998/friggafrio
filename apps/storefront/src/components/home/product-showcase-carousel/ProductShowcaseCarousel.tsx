import useEmblaCarousel from "embla-carousel-react"
import Autoplay from "embla-carousel-autoplay"
import { useCallback, useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { showcaseSlides } from "@/components/home/product-showcase-carousel/carousel-data"
import { ProductShowcaseSlide } from "@/components/home/product-showcase-carousel/ProductShowcaseSlide"
import "@/components/home/product-showcase-carousel/carousel.css"

export function ProductShowcaseCarousel() {
  const autoplayRef = useRef(
    Autoplay({ delay: 5000, stopOnInteraction: false, stopOnMouseEnter: true, stopOnFocusIn: true })
  )
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "center", skipSnaps: false },
    [autoplayRef.current]
  )
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)
  const [direction, setDirection] = useState<"next" | "prev">("next")
  const [isPlaying, setIsPlaying] = useState(true)

  const scrollPrev = useCallback(() => {
    if (emblaApi) {
      setDirection("prev")
      emblaApi.scrollPrev()
      emblaApi.plugins().autoplay?.reset()
    }
  }, [emblaApi])

  const scrollNext = useCallback(() => {
    if (emblaApi) {
      setDirection("next")
      emblaApi.scrollNext()
      emblaApi.plugins().autoplay?.reset()
    }
  }, [emblaApi])

  const scrollTo = useCallback(
    (index: number) => {
      if (emblaApi) {
        setDirection(index > selectedIndex ? "next" : "prev")
        emblaApi.scrollTo(index)
        emblaApi.plugins().autoplay?.reset()
      }
    },
    [emblaApi, selectedIndex]
  )

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
    setCanScrollPrev(emblaApi.canScrollPrev())
    setCanScrollNext(emblaApi.canScrollNext())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on("select", onSelect)
    emblaApi.on("reInit", onSelect)

    const autoplay = emblaApi.plugins()?.autoplay
    const handleAutoplayPlay = () => setIsPlaying(true)
    const handleAutoplayStop = () => setIsPlaying(false)
    const handleAutoplaySelect = () => {
      if (autoplay?.isPlaying()) setDirection("next")
    }

    if (autoplay) {
      emblaApi.on("autoplay:play", handleAutoplayPlay)
      emblaApi.on("autoplay:stop", handleAutoplayStop)
      emblaApi.on("select", handleAutoplaySelect)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (document.activeElement?.closest('[aria-roledescription="carousel"]')) {
        if (event.key === "ArrowLeft") scrollPrev()
        if (event.key === "ArrowRight") scrollNext()
      }
    }
    window.addEventListener("keydown", handleKeyDown)

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        autoplay?.stop()
      } else if (isPlaying) {
        autoplay?.play()
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      emblaApi.off("select", onSelect)
      emblaApi.off("reInit", onSelect)
      if (autoplay) {
        emblaApi.off("autoplay:play", handleAutoplayPlay)
        emblaApi.off("autoplay:stop", handleAutoplayStop)
        emblaApi.off("select", handleAutoplaySelect)
      }
      window.removeEventListener("keydown", handleKeyDown)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [emblaApi, isPlaying, onSelect, scrollNext, scrollPrev])

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    if (mediaQuery.matches) {
      emblaApi?.plugins()?.autoplay?.stop()
      setIsPlaying(false)
    }
  }, [emblaApi])

  return (
    <div
      className="relative w-full group"
      aria-roledescription="carousel"
      aria-label="Destaques de Equipamentos Friggafrio"
    >
      <div className="overflow-hidden md:rounded-none px-2 sm:px-4 md:px-0" ref={emblaRef}>
        <div className="flex touch-pan-y" style={{ backfaceVisibility: "hidden" }}>
          {showcaseSlides.map((slide, index) => (
            <ProductShowcaseSlide
              key={slide.id}
              slide={slide}
              isActive={index === selectedIndex}
              direction={direction}
            />
          ))}
        </div>
      </div>

      <button
        onClick={scrollPrev}
        disabled={!canScrollPrev}
        className="absolute left-2 top-4 h-11 w-11 translate-y-0 bg-black/25 hover:bg-black/45 backdrop-blur-md flex items-center justify-center text-white transition-[background-color,border-color,color,box-shadow,opacity,transform] duration-200 disabled:opacity-0 disabled:cursor-not-allowed z-40 focus-visible:outline-2 focus-visible:outline-white active:scale-95 md:left-0 md:top-1/2 md:h-24 md:w-16 md:-translate-y-1/2 md:bg-white/20 md:hover:bg-white/40"
        aria-label="Ver slide anterior"
      >
        <ChevronLeft className="h-5 w-5 md:h-8 md:w-8" />
      </button>

      <button
        onClick={scrollNext}
        disabled={!canScrollNext}
        className="absolute right-2 top-4 h-11 w-11 translate-y-0 bg-black/25 hover:bg-black/45 backdrop-blur-md flex items-center justify-center text-white transition-[background-color,border-color,color,box-shadow,opacity,transform] duration-200 disabled:opacity-0 disabled:cursor-not-allowed z-40 focus-visible:outline-2 focus-visible:outline-white active:scale-95 md:right-0 md:top-1/2 md:h-24 md:w-16 md:-translate-y-1/2 md:bg-white/20 md:hover:bg-white/40"
        aria-label="Ver próximo slide"
      >
        <ChevronRight className="h-5 w-5 md:h-8 md:w-8" />
      </button>

      <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center z-40">
        <div className="flex gap-2">
          {showcaseSlides.map((_, index) => {
            const active = index === selectedIndex
            return (
              <button
                key={index}
                onClick={() => scrollTo(index)}
                className={`carousel-indicator-bar relative h-2.5 rounded-full overflow-hidden focus-visible:outline-2 focus-visible:outline-white ${
                  active ? "carousel-indicator-active w-12 bg-white/30" : "w-2.5 bg-white/50 hover:bg-white/80"
                }`}
                aria-label={`Ir para o destaque ${index + 1} de ${showcaseSlides.length}`}
                aria-current={active ? "true" : "false"}
                data-playing={isPlaying}
              >
                {active && <div className="carousel-indicator-progress absolute inset-y-0 left-0 bg-white" />}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
