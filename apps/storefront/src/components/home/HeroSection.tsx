import { ProductShowcaseCarousel } from "./product-showcase-carousel"

export function HeroSection() {
  return (
    <section className="relative bg-[var(--color-surface)] border-b border-[var(--color-border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full pt-8 pb-12">
        <div className="w-full">
          <ProductShowcaseCarousel />
        </div>
      </div>
    </section>
  )
}
