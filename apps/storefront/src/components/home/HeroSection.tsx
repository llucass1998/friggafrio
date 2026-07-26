import { ProductShowcaseCarousel } from "@/components/home/product-showcase-carousel"

export function HeroSection() {
  return (
    <section
      aria-label="Destaques da FriggaFrio"
      className="relative bg-[var(--color-surface)] border-b border-[var(--color-border)] w-full overflow-hidden"
    >
      <div
        data-testid="home-hero-carousel"
        className="w-full relative z-10 mx-auto"
      >
        <ProductShowcaseCarousel />
      </div>
    </section>
  )
}
