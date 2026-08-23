import { ProductShowcaseCarousel } from "@/components/home/product-showcase-carousel"

export function HeroSection() {
  return (
    <section
      aria-label="Destaques da FriggaFrio"
      className="relative w-full overflow-hidden bg-[var(--color-surface)]"
    >
      <div className="w-full relative z-10 mx-auto">
        <ProductShowcaseCarousel />
      </div>
    </section>
  )
}
