import { Link } from "@tanstack/react-router"
import { ShowcaseSlide } from "@/components/home/product-showcase-carousel/types"

interface ProductShowcaseSlideProps {
  slide: ShowcaseSlide;
  isActive: boolean;
  direction?: 'next' | 'prev';
}

export function ProductShowcaseSlide({ slide, isActive, direction = 'next' }: ProductShowcaseSlideProps) {
  return (
    <div
      className="carousel-slide flex-none w-full min-w-0"
      role="group"
      aria-roledescription="slide"
      aria-label={slide.title}
      data-active={isActive ? "true" : "false"}
      data-direction={direction}
    >
      <div className="relative w-full rounded-[var(--radius-card-lg)] md:rounded-none bg-[var(--color-surface)] overflow-hidden flex flex-col items-start justify-end group h-[clamp(400px,110vw,500px)] sm:h-[clamp(330px,34vw,410px)] lg:h-[clamp(340px,22vw,440px)]">

        {/* Placeholder / Image */}
        <div className="absolute inset-0 flex items-center justify-center">
          <picture className="w-full h-full flex items-center justify-center bg-slate-900">
            {/* Imagem real (fallback via object-error se não existir) */}
            <img
              src={`/images/carousel/${slide.imageFilename}`}
              alt={slide.title}
              className="carousel-slide-img w-full h-full object-cover z-10"
              loading={isActive ? "eager" : "lazy"}
              onError={(e) => {
                // Se a imagem não for encontrada, esconde a tag img e mostra o SVG via css
                e.currentTarget.style.display = "none"
                e.currentTarget.parentElement?.classList.add("show-placeholder")
              }}
            />

            {/* Fallback SVG when image errors out */}
            <svg
              xmlns="http://www.w3.org/w3.org/2000/svg"
              className="w-20 h-20 text-[var(--color-primary)] opacity-20 hidden absolute"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
          </picture>
        </div>

        {/* Content Gradient Overlay - 90deg left to right fade */}
        <div
          className="absolute inset-0 z-20 pointer-events-none"
          style={{
            background: "linear-gradient(90deg, rgba(3, 32, 63, 0.86) 0%, rgba(3, 32, 63, 0.64) 30%, rgba(3, 32, 63, 0.18) 58%, transparent 76%)"
          }}
        ></div>

        {/* Slide Content */}
        <div className="relative z-30 p-6 sm:p-10 lg:p-16 text-left w-full max-w-[620px] mb-6 sm:mb-4 lg:mb-6">
          <span className="carousel-category text-sm lg:text-base font-bold text-[var(--color-primary)] uppercase tracking-wider mb-2 lg:mb-4 block">
            DESTAQUE
          </span>
          <h3 className="carousel-title text-2xl lg:text-[36px] leading-tight font-bold text-white mb-4">
            {slide.title}
          </h3>
          <p className="carousel-desc text-white/90 text-sm sm:text-base lg:text-lg mb-8 line-clamp-2 lg:line-clamp-3">
            {slide.description}
          </p>
          <Link
            to={slide.ctaLink as any}
            tabIndex={isActive ? 0 : -1}
            className="carousel-cta inline-flex items-center gap-2 px-6 py-3 min-h-[44px] bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-sm lg:text-base font-bold rounded-md transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {slide.ctaText}
            <svg xmlns="http://www.w3.org/w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </Link>
        </div>

      </div>

      {/* CSS For Placeholder Fallback */}
      <style>{`
        .show-placeholder svg {
          display: block;
        }
      `}</style>
    </div>
  )
}
