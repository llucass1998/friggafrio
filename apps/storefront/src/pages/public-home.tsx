import { HeroSection } from "../components/home/HeroSection"
import { BenefitsSection } from "../components/home/BenefitsSection"
import { FeaturedCategories } from "../components/home/FeaturedCategories"
import { FeaturedProducts } from "../components/home/FeaturedProducts"
import { ServicesSection } from "../components/home/ServicesSection"
import { ContactBanner } from "../components/home/ContactBanner"

export function PublicHomePage() {
  return (
    <div className="flex flex-col w-full">
      <HeroSection />
      <BenefitsSection />
      <FeaturedCategories />
      <FeaturedProducts />
      <ServicesSection />
    </div>
  )
}
