import { Link } from "@tanstack/react-router"
import { ShowcaseSlide } from "@/components/home/product-showcase-carousel/types"

interface ProductShowcaseSlideProps {
  slide: ShowcaseSlide
  isActive: boolean
  direction?: "next" | "prev"
}

export function ProductShowcaseSlide({ slide, isActive, direction = "next" }: ProductShowcaseSlideProps) {
  const isPromotional = slide.isPromotionalImage === true
  const hideOverlay = slide.hideOverlayContent === true
  const imageFitClass = slide.imageFit === "contain" ? "object-contain" : "object-cover"
  const promoBg = slide.id === "promo-eos-r22" ? "bg-[#021024]" : "bg-[#edf7fd]"
  const defaultBg = "bg-[var(--color-surface)]"

  return (
    <div className="carousel-slide flex-none w-full min-w-0" role="group" aria-roledescription="slide" aria-label={slide.title} data-active={isActive ? "true" : "false"} data-direction={direction} data-promotional={isPromotional ? "true" : "false"}>
      <div className={`ff-hero-slide-stage group relative w-full overflow-hidden ${isPromotional ? promoBg : defaultBg}`} data-slide-id={slide.id}>
        <div className="ff-hero-stage-backdrop" aria-hidden="true" style={{ backgroundImage: `url(/images/carousel/${slide.imageFilename})` }} />
        <div className="relative z-10 flex h-full items-center justify-center">
          <picture className={`w-full h-full flex items-center justify-center ${isPromotional ? "" : "bg-slate-900"}`}>
            <img src={`/images/carousel/${slide.imageFilename}`} alt={slide.title} className={`carousel-slide-img z-10 h-full w-full ${imageFitClass}`} loading={isPromotional || isActive ? "eager" : "lazy"} />
          </picture>
        </div>

        {!hideOverlay && (
          <div className="absolute inset-0 z-20 pointer-events-none">
            <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(3, 32, 63, 0.86) 0%, rgba(3, 32, 63, 0.64) 30%, rgba(3, 32, 63, 0.18) 58%, transparent 76%)" }} />
            <div className="relative z-30 p-6 sm:p-10 lg:p-16 text-left w-full max-w-[620px] mb-6 sm:mb-4 lg:mb-6">
              <span className="carousel-category text-sm lg:text-base font-bold text-[var(--color-primary)] uppercase tracking-wider mb-2 lg:mb-4 block">DESTAQUE</span>
              <h3 className="carousel-title text-2xl lg:text-[36px] leading-tight font-bold text-white mb-4">{slide.title}</h3>
              <p className="carousel-desc text-white/90 text-sm sm:text-base lg:text-lg mb-8 line-clamp-2 lg:line-clamp-3">{slide.description}</p>
              <Link to={slide.ctaLink as string} tabIndex={isActive ? 0 : -1} className="carousel-cta pointer-events-auto inline-flex items-center gap-2 px-6 py-3 min-h-[44px] bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-sm lg:text-base font-bold rounded-md transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                {slide.ctaText}<span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        )}

        {isPromotional && hideOverlay && <Link to={slide.ctaLink as string} tabIndex={isActive ? 0 : -1} className="absolute inset-0 z-30 focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-blue-500" aria-label={slide.title} />}
      </div>
    </div>
  )
}
