import { HeroSection } from "@/components/home/HeroSection"
import { BenefitsSection } from "@/components/home/BenefitsSection"
import { FeaturedCategories } from "@/components/home/FeaturedCategories"
import { FeaturedProducts } from "@/components/home/FeaturedProducts"
import { StoreBrandsCarousel } from "@/components/home/store-brands-carousel"
import { ContactSection } from "@/components/home/contact-section/ContactSection"

export function PublicHomePage() {
  return (
    <div className="flex flex-col w-full relative">
      <HeroSection />
      <BenefitsSection />
      <FeaturedCategories />
      <FeaturedProducts />
      <StoreBrandsCarousel />
      <ContactSection />
    </div>
  )
}
