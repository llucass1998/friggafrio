import { Link, useLoaderData } from "@tanstack/react-router"
import { HttpTypes } from "@medusajs/types"
import { ChevronRight } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { ImageGallery } from "@/components/ui/image-gallery"
import { ProductImagePlaceholder } from "@/components/product/ProductImagePlaceholder"
import ProductActions, { ProductTrustArguments } from "@/components/product-actions"
import ProductRating from "@/components/product-rating"
import { getProductPurchaseState } from "@/lib/utils/product-state"
import { isVariantInStock } from "@/lib/utils/product"
import { decodeProductText } from "@/lib/utils/product-text"
import {
  getPublicProductDocuments,
  getPublicProductSpecs,
  getPublicProductApplication,
  getPublicProductCompatibility,
  getPublicProductPackageContents,
} from "@/lib/utils/public-product-specs"
import { ProductOverview } from "@/components/product/technical/ProductOverview"
import { ProductSpecificationsTable } from "@/components/product/technical/ProductSpecificationsTable"
import { ProductApplication } from "@/components/product/technical/ProductApplication"
import { ProductPackageContents } from "@/components/product/technical/ProductPackageContents"
import { ProductDocuments } from "@/components/product/technical/ProductDocuments"
import { ShippingEstimate } from "@/components/shipping-estimate"
import { FavoriteButton } from "@/components/favorite-button"
import ProductReviews from "@/components/product-reviews"
import RelatedProducts from "@/components/related-products"
import { resolveMediaUrl } from "@/lib/media-url"

interface ProductPageData {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
  reviewSummary?: { average: number | null; total: number } | null
}

export function ProductPage() {
  const loaderData = useLoaderData({ strict: false }) as ProductPageData | undefined
  const { product, region, countryCode = "br", reviewSummary } = loaderData || {}
  const [activeDetail, setActiveDetail] = useState("overview")
  const [selectedVariant, setSelectedVariant] = useState<HttpTypes.StoreProductVariant | undefined>(undefined)
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  useEffect(() => {
    setActiveDetail("overview")
    setSelectedVariant(undefined)
  }, [product?.id])

  const handleVariantChange = useCallback((variant: HttpTypes.StoreProductVariant | undefined) => {
    setSelectedVariant(variant)
  }, [])

  if (!product) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--color-background)] p-4">
        <div className="w-full max-w-md rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-[var(--color-navy)]">Produto não encontrado</h1>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">O item que você tentou acessar não existe ou foi removido.</p>
          <Link to={"/$countryCode/store" as string} params={{ countryCode }} className="mt-6 inline-flex w-full justify-center rounded-[var(--radius-button)] bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]">
            Voltar ao Catálogo
          </Link>
        </div>
      </main>
    )
  }

  const productImages = (product.images || []).filter((image) =>
    typeof image.url === "string" && Boolean(resolveMediaUrl(image.url)),
  )
  const images = productImages.length > 0
    ? productImages.filter((image, index, list) => list.findIndex((candidate) => candidate.url === image.url) === index)
    : resolveMediaUrl(product.thumbnail)
      ? [{ id: "thumbnail", url: product.thumbnail, rank: 0 } as HttpTypes.StoreProductImage]
      : []
  const publicSpecs = getPublicProductSpecs(product)
  const documents = getPublicProductDocuments(product)
  const application = getPublicProductApplication(product)
  const compatibility = getPublicProductCompatibility(product)
  const packageContents = getPublicProductPackageContents(product)
  const category = product.categories?.[0]?.name || null
  const productTitle = decodeProductText(product.title)
  const productDescription = decodeProductText(product.description || product.subtitle || "")
  const sku = selectedVariant?.sku || product.variants?.[0]?.sku || null
  const purchaseState = getProductPurchaseState(product)
  const hasSelectableVariants = (product.variants?.length ?? 0) > 1 && Boolean(product.options?.length)
  const technicalSummary = publicSpecs.filter(({ label }) => label !== "Marca").slice(0, 3)
  const hasDescription = Boolean(productDescription.trim())
  const hasOverview = Boolean(hasDescription || publicSpecs.length > 0 || application || compatibility || packageContents || documents.length > 0)
  const detailSections = [
    hasOverview ? { id: "overview", label: "Visão geral" } : null,
    publicSpecs.length > 0 ? { id: "specifications", label: "Especificação" } : null,
    application || compatibility ? { id: "application-compatibility", label: "Aplicação e compatibilidade" } : null,
    packageContents ? { id: "package", label: "O que acompanha" } : null,
    { id: "documents", label: "Documentos" },
  ].filter((section): section is { id: string; label: string } => Boolean(section))
  const firstDetailId = detailSections[0]?.id
  const selectedDetailId = detailSections.some((section) => section.id === activeDetail) ? activeDetail : firstDetailId

  const detailContent = (id: string) => {
    if (id === "overview") {
      return (
        <ProductOverview
          // Sobre o produto e Especificações técnicas
          description={productDescription}
          specs={publicSpecs}
          application={application}
          packageContents={packageContents}
          documents={documents}
          onNavigateTab={(tabId) => setActiveDetail(tabId)}
        />
      )
    }
    if (id === "specifications" && publicSpecs.length > 0) {
      return (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-[var(--color-navy)] sm:text-xl">Especificações técnicas</h2>
          <ProductSpecificationsTable specs={publicSpecs} />
        </div>
      )
    }
    if (id === "application-compatibility" && (application || compatibility)) {
      return (
        <ProductApplication
          application={application}
          compatibility={compatibility}
        />
      )
    }
    if (id === "package" && packageContents) {
      return (
        <ProductPackageContents
          contents={packageContents}
        />
      )
    }
    if (id === "documents") {
      return (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-[var(--color-navy)] sm:text-xl">Documentos e Manuais</h2>
          <ProductDocuments documents={documents} />
        </div>
      )
    }
    return null
  }
  const available = selectedVariant ? isVariantInStock(selectedVariant) : purchaseState.status === "purchasable" || purchaseState.status === "select_variant"
  const outOfStock = selectedVariant ? !isVariantInStock(selectedVariant) : purchaseState.status === "out_of_stock"
  const availabilityTone = available ? "positive" : outOfStock ? "negative" : "neutral"
  const availabilityLabel = outOfStock
    ? "Sem estoque"
    : purchaseState.status === "quote_only"
    ? "Somente sob cotação"
    : purchaseState.status === "price_pending"
      ? "Preço em configuração"
      : purchaseState.status === "out_of_stock"
        ? "Sem estoque"
        : purchaseState.status === "unavailable"
          ? "Indisponível"
          : "Em estoque"

  return (
    <main className="ff-product-page min-h-screen bg-[var(--color-background)] pb-20 md:pb-10" data-testid="product-page">
      <nav aria-label="Caminho de navegação" className="bg-transparent" data-testid="product-breadcrumbs">
        <div className="mx-auto flex w-[calc(100%-32px)] max-w-[1520px] items-center gap-2 overflow-x-auto py-5 text-xs text-[var(--color-text-muted)] sm:w-[calc(100%-48px)] sm:text-sm lg:w-[calc(100%-64px)]">
          <Link to={"/$countryCode" as string} params={{ countryCode }} className="shrink-0 hover:text-[var(--color-primary)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]">Home</Link>
          <ChevronRight className="h-4 w-4 shrink-0" aria-hidden="true" />
          <Link to={"/$countryCode/store" as string} params={{ countryCode }} className="shrink-0 hover:text-[var(--color-primary)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]">Catálogo</Link>
          {category && <><ChevronRight className="h-4 w-4 shrink-0" aria-hidden="true" /><span className="shrink-0">{category}</span></>}
          <ChevronRight className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="truncate font-medium text-[var(--color-navy)]" aria-current="page">{productTitle}</span>
        </div>
      </nav>

      <div className="mx-auto w-[calc(100%-32px)] max-w-[1520px] py-2 sm:w-[calc(100%-48px)] md:py-4 lg:w-[calc(100%-64px)]" data-testid="product-top-layout">
        <div className="product-top-columns grid grid-cols-1 items-start gap-4" data-testid="product-columns">
          <section aria-label="Galeria do produto">
            <div className="product-gallery-card relative rounded-[14px] border border-[var(--color-border)] bg-white p-4 shadow-[0_6px_22px_rgba(13,67,105,0.07)] sm:p-5">
              {images.length > 0 ? <ImageGallery images={images} /> : (
                <div className="aspect-square overflow-hidden rounded-lg bg-[var(--color-surface-soft)]">
                  <ProductImagePlaceholder productName={productTitle} />
                </div>
              )}
            </div>
          </section>

          <section className="product-info-column min-w-0" aria-labelledby="product-title">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h1 id="product-title" className="text-[1.75rem] font-bold leading-[1.2] text-[var(--color-navy)] sm:text-[2rem]">{productTitle}</h1>
                <div className={`mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold ${availabilityTone === "positive" ? "border-[#ceead6] bg-[#e6f4ea] text-[#137333]" : availabilityTone === "negative" ? "border-[#f3c7cd] bg-[#fff0f1] text-[#c93b45]" : "border-[#d7e2ea] bg-[#f4f8fb] text-[var(--color-text-muted)]"}`}>
                  <span className="h-2 w-2 rounded-full bg-current" aria-hidden="true" />{availabilityLabel}
                </div>
              </div>
              <div className="shrink-0 pt-1">
                <FavoriteButton productId={product.id} productTitle={productTitle} />
              </div>
            </div>
            {sku && <p className="mt-2 font-mono text-sm text-[var(--color-text-muted)]">Ref.: {sku}</p>}
            {category && <p className="mt-3 text-sm text-[var(--color-text-muted)]">Categoria: <strong className="font-semibold text-[var(--color-navy)]">{category}</strong></p>}
            {hasDescription && <div className="mt-4 max-w-prose">
              <p className="line-clamp-3 text-sm leading-6 text-[var(--color-text)]">{productDescription}</p>
              {productDescription.length > 180 && <button type="button" onClick={() => { setActiveDetail("overview"); window.requestAnimationFrame(() => document.getElementById("product-detail-panels")?.scrollIntoView({ behavior: "smooth", block: "start" })) }} className="mt-2 text-sm font-semibold text-[var(--color-primary)] underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]">Ver descrição completa</button>}
            </div>}
            {technicalSummary.length > 0 && <div className="mt-5">
              <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">Resumo técnico</h2>
              <div className="mt-2 flex flex-wrap gap-2">{technicalSummary.map(({ label, value }) => <span key={label} className="rounded-md border border-[#cde1f0] bg-[#eef7fd] px-3 py-1.5 text-xs font-semibold text-[var(--color-primary)]">{label}: {value}</span>)}</div>
            </div>}
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
              {reviewSummary?.total ? <ProductRating productId={product.id} summary={reviewSummary} /> : null}
            </div>
          </section>

          <aside className="product-purchase-column min-w-0 rounded-[14px] border border-[var(--color-border)] bg-white p-5 shadow-[0_6px_22px_rgba(13,67,105,0.07)] sm:p-6" data-testid="purchase-panel" data-product-info-panel="true" data-has-selectable-variants={hasSelectableVariants} aria-label="Compra do produto" aria-labelledby="product-title">
            <ProductActions
              product={product}
              region={region!}
              onVariantChange={handleVariantChange}
              afterActions={<>
                <ShippingEstimate />
                <ProductTrustArguments />
              </>}
            />
          </aside>
        </div>

        {detailSections.length > 0 && <div id="product-detail-panels" className="mt-8 rounded-[14px] border border-[var(--color-border)] bg-white p-4 shadow-[0_6px_22px_rgba(13,67,105,0.07)] sm:p-6" data-testid="product-detail-panels">
          <nav aria-label="Informações do produto" role="tablist" className="mb-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-[var(--color-border)] pb-2">
            {detailSections.map((section) => <button
              key={section.id}
              ref={(node) => { tabRefs.current[section.id] = node }}
              type="button"
              role="tab"
              id={`product-tab-${section.id}`}
              aria-controls={`product-panel-${section.id}`}
              aria-selected={selectedDetailId === section.id}
              tabIndex={selectedDetailId === section.id ? 0 : -1}
              onClick={() => setActiveDetail(section.id)}
              onKeyDown={(event) => {
                if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return
                event.preventDefault()
                const current = detailSections.findIndex((item) => item.id === section.id)
                const next = event.key === "Home" ? 0 : event.key === "End" ? detailSections.length - 1 : (current + (event.key === "ArrowRight" ? 1 : -1) + detailSections.length) % detailSections.length
                const nextId = detailSections[next]?.id
                if (nextId) { setActiveDetail(nextId); tabRefs.current[nextId]?.focus() }
              }}
              className={`border-b-2 px-1 pb-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] ${selectedDetailId === section.id ? "border-[var(--color-primary)] text-[var(--color-primary)]" : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"}`}
            >{section.label}</button>)}
          </nav>
          {selectedDetailId && <div id={`product-panel-${selectedDetailId}`} role="tabpanel" aria-labelledby={`product-tab-${selectedDetailId}`} tabIndex={0} className="motion-tab-content min-w-0">{detailContent(selectedDetailId)}</div>}
        </div>}
      </div>
      {region && <RelatedProducts product={product} regionId={region.id} />}
      <ProductReviews productId={product.id} productTitle={productTitle} />
    </main>
  )
}

export default ProductPage
