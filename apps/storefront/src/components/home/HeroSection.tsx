import { ProductShowcaseCarousel } from "@/components/home/product-showcase-carousel"

export function HeroSection() {
  return (
    <section
      aria-label="Destaques da FriggaFrio"
      className="relative bg-[var(--color-surface)] border-b border-[var(--color-border)] w-full overflow-x-clip py-6 lg:py-8"
    >
      <div
        data-testid="home-hero-carousel"
        className="
          mx-auto
          relative z-10
          w-[calc(100vw-24px)]
          sm:w-[calc(100vw-32px)]
          md:w-[calc(100vw-48px)]
          xl:w-[min(96vw,1740px)]
        "
      >
        <ProductShowcaseCarousel />
      </div>
    </section>
  )
}
