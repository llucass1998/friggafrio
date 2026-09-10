import { HeroSection } from "@/components/home/HeroSection"
import { HomePromotionalBanners } from "@/components/home/HomePromotionalBanners"
import { HomeCommercialBenefits } from "@/components/home/HomeCommercialBenefits"
import { BenefitsSection } from "@/components/home/BenefitsSection"
import { FeaturedCategories } from "@/components/home/FeaturedCategories"
import { HomeProductSections } from "@/components/home/HomeProductSections"
import { HomePromotionSection } from "@/components/home/HomePromotionSection"
import { StoreBrandsCarousel } from "@/components/home/store-brands-carousel"
import { NewsletterSignup } from "@/components/newsletter-signup"


export function PublicHomePage() {
  return (
    <div className="flex flex-col w-full relative">
      <HeroSection />
      <HomePromotionalBanners />
      <HomeCommercialBenefits />
      <HomePromotionSection />
      <HomeProductSections />
      <FeaturedCategories />
      <BenefitsSection />
      <StoreBrandsCarousel />
      <NewsletterSignup />
    </div>
  )
}
