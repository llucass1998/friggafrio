import useEmblaCarousel from "embla-carousel-react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useCallback, useEffect, useState, type KeyboardEvent, type ReactNode } from "react"
import "@/components/carousel/carousel.css"

type EmblaPlugins = Parameters<typeof useEmblaCarousel>[1]
const EMPTY_PLUGINS: EmblaPlugins = []

export function useInfiniteCarousel(plugins: EmblaPlugins = EMPTY_PLUGINS, loop = true) {
  const [viewportRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    loop,
    skipSnaps: false,
    duration: 20,
  }, plugins)
  const [hasOverflow, setHasOverflow] = useState(false)
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)

  const syncOverflow = useCallback(() => {
    if (!emblaApi) return
    const viewport = emblaApi.rootNode()
    // Embla's snap list is the authoritative source for overflow. Measuring
    // scrollWidth after a trimmed end snap can transiently report no overflow
    // and unmount the controls while the user is trying to go back.
    const snapList = emblaApi.scrollSnapList()
    const overflow = snapList.length > 1 && viewport.clientWidth > 0
    const selectedSnap = emblaApi.selectedScrollSnap()
    const lastSnap = Math.max(0, snapList.length - 1)

    // canScrollPrev/Next can briefly return false while Embla is settling a
    // trimmed snap. Derive the boundary from the selected snap instead so the
    // previous control remains usable immediately after reaching the end.
    const previous = loop ? overflow : overflow && selectedSnap > 0
    const next = loop ? overflow : overflow && selectedSnap < lastSnap

    setHasOverflow(overflow)
    setCanScrollPrev(previous)
    setCanScrollNext(next)
  }, [emblaApi, loop])

  useEffect(() => {
    if (!emblaApi) return
    syncOverflow()
    emblaApi.on("reInit", syncOverflow)
    emblaApi.on("resize", syncOverflow)
    emblaApi.on("select", syncOverflow)
    window.addEventListener("resize", syncOverflow)
    return () => {
      emblaApi.off("reInit", syncOverflow)
      emblaApi.off("resize", syncOverflow)
      emblaApi.off("select", syncOverflow)
      window.removeEventListener("resize", syncOverflow)
    }
  }, [emblaApi, syncOverflow])

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])
  const scrollToStart = useCallback(() => emblaApi?.scrollTo(0), [emblaApi])
  const scrollToEnd = useCallback(() => {
    if (!emblaApi) return
    const lastSnap = Math.max(0, emblaApi.scrollSnapList().length - 1)
    emblaApi.scrollTo(lastSnap)
  }, [emblaApi])
  const onKeyDown = useCallback((event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "ArrowLeft") { event.preventDefault(); emblaApi?.scrollPrev() }
    if (event.key === "ArrowRight") { event.preventDefault(); emblaApi?.scrollNext() }
  }, [emblaApi])

  return { viewportRef, emblaApi, hasOverflow, canScrollPrev, canScrollNext, scrollPrev, scrollNext, scrollToStart, scrollToEnd, onKeyDown }
}

type CarouselSectionHeaderProps = {
  title: string
  description?: string
  action?: ReactNode
  hasOverflow: boolean
  canScrollPrevious?: boolean
  canScrollNext?: boolean
  onPrevious: () => void
  onNext: () => void
  previousLabel: string
  nextLabel: string
  showControlsInHeader?: boolean
}

export function CarouselSectionHeader({
  title,
  description,
  action,
  hasOverflow,
  canScrollPrevious = hasOverflow,
  canScrollNext = hasOverflow,
  onPrevious,
  onNext,
  previousLabel,
  nextLabel,
  showControlsInHeader = true,
}: CarouselSectionHeaderProps) {
  return (
    <header className="ff-carousel-section-header mb-6">
      <div className="min-w-0">
        <h2 className="mb-2 text-2xl font-bold text-[var(--color-navy)] md:text-3xl">{title}</h2>
        {description && <p className="text-sm text-[var(--color-text-muted)] md:text-base">{description}</p>}
      </div>
        <div className="ff-carousel-section-header__actions">
        {action}
        {showControlsInHeader && hasOverflow && (
          <div className="flex items-center gap-2" data-carousel-controls="section-header">
            <button
              type="button"
              aria-label={previousLabel}
              onClick={onPrevious}
              disabled={!canScrollPrevious}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[var(--color-border)] bg-white text-[var(--color-navy)] transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label={nextLabel}
              onClick={onNext}
              disabled={!canScrollNext}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[var(--color-border)] bg-white text-[var(--color-navy)] transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </header>
  )
}

export function CarouselSideControls({ side, hasOverflow, canScrollPrevious, canScrollNext, onPrevious, onNext, previousLabel, nextLabel }: Omit<CarouselSectionHeaderProps, "title" | "description" | "action" | "showControlsInHeader"> & { side: "previous" | "next" }) {
  if (!hasOverflow) return null
  const buttonClass = "hidden md:inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--color-border)] bg-white text-[var(--color-primary)] shadow-[0_4px_12px_rgba(15,45,75,0.12)] transition-[background-color,color,border-color,box-shadow] duration-[var(--motion-duration-interaction)] hover:border-[var(--color-primary)] hover:bg-[#F0F7FF] hover:text-[var(--color-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-40"
  return side === "previous"
    ? <button type="button" aria-label={previousLabel} onClick={onPrevious} disabled={!canScrollPrevious} className={buttonClass}><ChevronLeft className="h-5 w-5" aria-hidden="true" /></button>
    : <button type="button" aria-label={nextLabel} onClick={onNext} disabled={!canScrollNext} className={buttonClass}><ChevronRight className="h-5 w-5" aria-hidden="true" /></button>
}
