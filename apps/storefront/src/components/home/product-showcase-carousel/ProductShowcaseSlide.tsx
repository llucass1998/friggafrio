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
  const promoBg = "bg-[#031c47]"
  const defaultBg = "bg-[var(--color-surface)]"

  const desktopImage = slide.imageDesktop || (slide.imageFilename ? `/images/carousel/${slide.imageFilename}` : "")
  const mobileImage = slide.imageMobile
  const targetHref = slide.href || slide.ctaLink
  const imageAlt = slide.alt || slide.title

  return (
    <div
      className="carousel-slide flex-none w-full min-w-0"
      role="group"
      aria-roledescription="slide"
      aria-label={imageAlt}
      data-active={isActive ? "true" : "false"}
      data-direction={direction}
      data-promotional={isPromotional ? "true" : "false"}
    >
      <div
        className={`ff-hero-slide-stage group relative w-full overflow-hidden ${isPromotional ? promoBg : defaultBg}`}
        data-slide-id={slide.id}
      >
        {/* Artwork - visible on all devices with picture and fallback */}
        <div className="relative z-10 w-full h-full flex items-center justify-center">
          <picture className={`block w-full h-full ${isPromotional ? "" : "bg-slate-900"}`}>
            {mobileImage ? (
              <source media="(max-width: 767px)" srcSet={mobileImage} />
            ) : null}
            <img
              src={desktopImage}
              alt={imageAlt}
              style={
                {
                  "--slide-obj-pos-mobile": slide.objectPositionMobile || slide.objectPosition || "center",
                  "--slide-obj-pos-desktop": slide.objectPosition || "center",
                } as React.CSSProperties
              }
              className={`carousel-slide-img z-10 block h-full w-full ${imageFitClass}`}
              loading={isPromotional || isActive ? "eager" : "lazy"}
            />
          </picture>
        </div>

        {/* Overlay typography view when not hidden */}
        {!hideOverlay && (
          <div className="absolute inset-0 z-20 pointer-events-none flex items-center">
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(90deg, rgba(3, 32, 63, 0.86) 0%, rgba(3, 32, 63, 0.64) 30%, rgba(3, 32, 63, 0.18) 58%, transparent 76%)",
              }}
            />
            <div className="relative z-30 p-4 sm:p-10 lg:p-16 text-left w-full max-w-[620px]">
              <span className="carousel-category text-xs sm:text-sm lg:text-base font-bold text-[var(--color-primary)] uppercase tracking-wider mb-1 sm:mb-2 lg:mb-4 block">
                DESTAQUE
              </span>
              <h3 className="carousel-title text-xl sm:text-2xl lg:text-[36px] leading-tight font-bold text-white mb-2 sm:mb-4">
                {slide.title}
              </h3>
              <p className="carousel-desc text-white/90 text-xs sm:text-sm md:text-base lg:text-lg mb-4 sm:mb-8 line-clamp-2 lg:line-clamp-3">
                {slide.description}
              </p>
              <Link
                to={targetHref as string}
                tabIndex={isActive ? 0 : -1}
                className="carousel-cta pointer-events-auto inline-flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-3 min-h-[40px] sm:min-h-[44px] bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-xs sm:text-sm lg:text-base font-bold rounded-md transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                {slide.ctaText || "Ver produtos"}
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        )}

        {/* Full-slide clickable link when promotional */}
        {isPromotional && (
          <Link
            to={targetHref as string}
            tabIndex={isActive ? 0 : -1}
            className="block absolute inset-0 z-30 focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-blue-500"
            aria-label={imageAlt}
          />
        )}
      </div>
    </div>
  )
}
