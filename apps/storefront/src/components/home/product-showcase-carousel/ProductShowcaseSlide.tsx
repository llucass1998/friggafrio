import { Link } from "@tanstack/react-router"
import { ShowcaseSlide } from "@/components/home/product-showcase-carousel/types"

interface ProductShowcaseSlideProps {
  slide: ShowcaseSlide;
  isActive: boolean;
}

export function ProductShowcaseSlide({ slide, isActive }: ProductShowcaseSlideProps) {
  return (
    <div className="flex-none w-full min-w-0" role="group" aria-roledescription="slide" aria-label={slide.title}>
      <div className="relative w-full aspect-video md:aspect-[21/9] lg:aspect-[2.3/1] max-h-[620px] rounded-[var(--radius-card-lg)] bg-[var(--color-surface)] overflow-hidden flex flex-col items-center justify-end group">

        {/* Placeholder / Image */}
        <div className="absolute inset-0 flex items-center justify-center transition-transform duration-500 group-hover:scale-105">
          <picture className="w-full h-full flex items-center justify-center bg-gray-50">
            {/* Imagem real (fallback via object-error se não existir) */}
            <img
              src={`/images/carousel/${slide.imageFilename}`}
              alt={slide.title}
              className="w-full h-full object-cover z-10"
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

        {/* Content Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-navy)]/90 via-[var(--color-navy)]/40 to-transparent z-20 pointer-events-none"></div>

        {/* Slide Content */}
        <div className="relative z-30 p-6 sm:p-10 text-left w-full translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
          <h3 className="text-3xl font-bold text-white mb-2">{slide.title}</h3>
          <p className="text-white/90 text-base md:text-lg mb-6 line-clamp-2 max-w-xl">
            {slide.description}
          </p>
          <Link
            to={slide.ctaLink as any}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-sm font-bold rounded-md transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
          >
            {slide.ctaText}
            <svg xmlns="http://www.w3.org/w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
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
