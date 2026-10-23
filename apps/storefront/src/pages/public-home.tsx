import { HeroSection } from "@/components/home/HeroSection"
import { HomeInstitutionalStory } from "@/components/home/HomeInstitutionalStory"
import { HomeStoreLocations } from "@/components/home/HomeStoreLocations"
import { HomeInstitutionalContact } from "@/components/home/HomeInstitutionalContact"
import { HomePromotionalBanners } from "@/components/home/HomePromotionalBanners"
import { HomeCommercialBenefits } from "@/components/home/HomeCommercialBenefits"
import { BenefitsSection } from "@/components/home/BenefitsSection"
import { FeaturedCategories } from "@/components/home/FeaturedCategories"
import { HomeProductSections } from "@/components/home/HomeProductSections"
import { HomePromotionSection } from "@/components/home/HomePromotionSection"
import { StoreBrandsCarousel } from "@/components/home/store-brands-carousel"
import { InstagramFeedSection } from "@/components/instagram/InstagramFeedSection"
import { NewsletterSignup } from "@/components/newsletter-signup"
import { siteFeatures } from "@/config/site-features"

export function PublicHomePage() {
  return (
    <div className="flex flex-col w-full relative">
      {/* Seção 1 — Hero Institucional: banner "Tudo para refrigeração em um só lugar" */}
      <HeroSection />

      {/* Fase Institucional: Apresentação da empresa, unidades físicas e contato */}
      {siteFeatures.institutionalHome && (
        <>
          {/* Seção 2 — Quem Somos (apresentação compacta com link para /quem-somos) */}
          <HomeInstitutionalStory />

          {/* Seção 3 — Nossas Lojas (apresentação das unidades sem mapa embutido) */}
          <HomeStoreLocations />

          {/* Seção 4 — Encerramento e contato comercial discreto */}
          <HomeInstitutionalContact />
        </>
      )}

      {/* Marketplace preservado.
          Oculto durante a fase institucional.
          Reativação: consultar siteFeatures e o guia de rollback (docs/rollbacks/HOMEPAGE-INSTITUTIONAL-ROLLBACK.md).
      */}
      {siteFeatures.showHomeBenefits && <HomePromotionalBanners />}
      {siteFeatures.showHomeBenefits && <HomeCommercialBenefits />}
      {siteFeatures.showHomeProductShowcase && <HomePromotionSection />}
      {siteFeatures.showHomeProductShowcase && <HomeProductSections />}
      {siteFeatures.showHomeCategories && <FeaturedCategories />}
      {siteFeatures.showHomeBenefits && <BenefitsSection />}
      {siteFeatures.showHomeBrandCarousel && <StoreBrandsCarousel />}

      {/* Seção Instagram FriggaFrio */}
      {siteFeatures.showInstagramFeed && <InstagramFeedSection />}

      {/* Bloco de Newsletter institucional */}
      <NewsletterSignup />
    </div>
  )
}
