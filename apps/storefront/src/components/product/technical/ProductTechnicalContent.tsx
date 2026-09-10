import { useState, useEffect } from "react"
import type { HttpTypes } from "@medusajs/types"
import { decodeProductText } from "@/lib/utils/product-text"
import {
  getPublicProductSpecs,
  getPublicProductApplication,
  getPublicProductCompatibility,
  getPublicProductPackageContents,
  getPublicProductDocuments,
} from "@/lib/utils/public-product-specs"
import { ProductTechnicalTabs, type TechnicalTabSection } from "@/components/product/technical/ProductTechnicalTabs"
import { ProductOverview } from "@/components/product/technical/ProductOverview"
import { ProductSpecificationsTable } from "@/components/product/technical/ProductSpecificationsTable"
import { ProductApplication } from "@/components/product/technical/ProductApplication"
import { ProductPackageContents } from "@/components/product/technical/ProductPackageContents"
import { ProductDocuments } from "@/components/product/technical/ProductDocuments"

interface ProductTechnicalContentProps {
  product: HttpTypes.StoreProduct
  className?: string
}

export function ProductTechnicalContent({ product, className = "" }: ProductTechnicalContentProps) {
  const description = decodeProductText(product.description || product.subtitle || "")
  const specs = getPublicProductSpecs(product)
  const application = getPublicProductApplication(product)
  const compatibility = getPublicProductCompatibility(product)
  const packageContents = getPublicProductPackageContents(product)
  const documents = getPublicProductDocuments(product)

  const hasDescription = Boolean(description.trim())
  const hasSpecs = specs.length > 0
  const hasAppOrComp = Boolean(application || compatibility)
  const hasPackage = Boolean(packageContents && packageContents.length > 0)
  const hasOverview = hasDescription || hasSpecs || hasAppOrComp || hasPackage || documents.length > 0

  // 1. Visão geral
  // 2. Especificações
  // 3. Aplicação e compatibilidade
  // 4. O que acompanha
  // 5. Documentos
  const sections: TechnicalTabSection[] = [
    hasOverview ? { id: "overview", label: "Visão geral" } : null,
    hasSpecs ? { id: "specifications", label: "Especificações" } : null,
    hasAppOrComp ? { id: "application-compatibility", label: "Aplicação e compatibilidade" } : null,
    hasPackage ? { id: "package", label: "O que acompanha" } : null,
    { id: "documents", label: "Documentos" },
  ].filter((section): section is TechnicalTabSection => Boolean(section))

  const initialTab = sections[0]?.id || "overview"
  const [activeTabId, setActiveTabId] = useState<string>(initialTab)

  // Reset tab when product changes to prevent state leakage
  useEffect(() => {
    setActiveTabId(sections[0]?.id || "overview")
  }, [product.id])

  // Ensure active tab is valid
  const currentTabId = sections.some((s) => s.id === activeTabId) ? activeTabId : (sections[0]?.id || "overview")

  return (
    <div
      id="product-detail-panels"
      data-testid="product-detail-panels"
      className={`mt-8 rounded-[14px] border border-[#d7e2ea] bg-white p-5 shadow-[0_6px_22px_rgba(13,67,105,0.07)] sm:p-6 lg:p-8 ${className}`}
    >
      <ProductTechnicalTabs
        sections={sections}
        activeTabId={currentTabId}
        onSelectTab={setActiveTabId}
        className="mb-6"
      />

      <div
        id={`product-panel-${currentTabId}`}
        role="tabpanel"
        aria-labelledby={`product-tab-${currentTabId}`}
        tabIndex={0}
        className="motion-tab-content min-w-0 focus-visible:outline-none"
      >
        {currentTabId === "overview" && (
          <ProductOverview
            description={description}
            specs={specs}
            application={application}
            packageContents={packageContents}
            documents={documents}
            onNavigateTab={setActiveTabId}
          />
        )}

        {currentTabId === "specifications" && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-[var(--color-navy)]">
              Especificações técnicas completas
            </h3>
            <ProductSpecificationsTable specs={specs} />
          </div>
        )}

        {currentTabId === "application-compatibility" && (
          <ProductApplication
            application={application}
            compatibility={compatibility}
          />
        )}

        {currentTabId === "package" && (
          <ProductPackageContents
            contents={packageContents}
          />
        )}

        {currentTabId === "documents" && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-[var(--color-navy)]">
              Documentos e Manuais
            </h3>
            <ProductDocuments
              documents={documents}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductTechnicalContent
