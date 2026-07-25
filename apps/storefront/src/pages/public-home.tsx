import { HeroSection } from "../components/home/HeroSection"
import { BenefitsSection } from "../components/home/BenefitsSection"
import { FeaturedCategories } from "../components/home/FeaturedCategories"
import { FeaturedProducts } from "../components/home/FeaturedProducts"
import { ServicesSection } from "../components/home/ServicesSection"
import { StoreBrandsCarousel } from "../components/home/store-brands-carousel"


export function PublicHomePage() {
  return (
    <div className="flex flex-col w-full relative">
      <HeroSection />
      <BenefitsSection />
      <FeaturedCategories />
      <ServicesSection />
      <StoreBrandsCarousel />
      <FeaturedProducts />
    </div>
  )
}
