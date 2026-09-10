import { ProductShowcaseCarousel } from "@/components/home/product-showcase-carousel"

export function HeroSection() {
  return (
    <section
      aria-label="Destaques da FriggaFrio"
      className="relative w-full bg-[var(--color-surface)]"
    >
      <div className="relative z-10 w-full">
        <ProductShowcaseCarousel />
      </div>
    </section>
  )
}
