import { HeroSection } from "@/components/home/HeroSection"
import { BenefitsSection } from "@/components/home/BenefitsSection"
import { FeaturedCategories } from "@/components/home/FeaturedCategories"
import { HomeProductSections } from "@/components/home/HomeProductSections"
import { StoreBrandsCarousel } from "@/components/home/store-brands-carousel"


export function PublicHomePage() {
  return (
    <div className="flex flex-col w-full relative">
      <HeroSection />
      <BenefitsSection />
      <FeaturedCategories />
      <HomeProductSections />
      <StoreBrandsCarousel />
    </div>
  )
}
