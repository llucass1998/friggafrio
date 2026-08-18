import { Link, useLoaderData } from "@tanstack/react-router"
import { HttpTypes } from "@medusajs/types"
import { ImageGallery } from "@/components/ui/image-gallery"
import { ChevronRight } from "@medusajs/icons"
import ProductActions from "@/components/product-actions"
import { useState } from "react"
import { storeConfig } from "@/config/store"
import { getProductPurchaseState } from "@/lib/utils/product-state"
import { decodeProductText } from "@/lib/utils/product-text"
import { getPublicProductDocuments, getPublicProductSpecs } from "@/lib/utils/public-product-specs"
import { Share2 } from "lucide-react"
import { toast } from "sonner"
import { ShippingEstimate } from "@/components/shipping-estimate"
import { FavoriteButton } from "@/components/favorite-button"

interface ProductPageData {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
}

export function ProductPage() {
  const loaderData = useLoaderData({ strict: false }) as ProductPageData | undefined
  const { product, region, countryCode = "br" } = loaderData || {}

  // Local state for tabs
  const [activeTab, setActiveTab] = useState("description")

  if (!product) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center p-4">
        <div className="text-center bg-white p-8 rounded-[var(--radius-card)] border border-[var(--color-border)] shadow-sm max-w-md w-full">
          <div className="w-16 h-16 bg-[var(--color-surface-soft)] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/w3.org/2000/svg" className="w-8 h-8 text-[var(--color-primary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
          </div>
          <h1 className="text-xl font-bold text-[var(--color-navy)] mb-2">Produto não encontrado</h1>
          <p className="text-[var(--color-text-muted)] mb-6 text-sm">O item que você tentou acessar não existe ou foi removido.</p>
          <Link
            to={"/$countryCode/store" as string} params={{ countryCode }}
            className="inline-flex justify-center w-full px-5 py-2.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-sm font-semibold rounded-[var(--radius-button)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-primary)]"
          >
            Voltar ao Catálogo
          </Link>
        </div>
      </div>
    )
  }

  // Fallback to real or mock images
  const productImages = product.images || []
  const images = productImages.length > 0
    ? productImages
    : product.thumbnail
      ? [{ id: "thumbnail", url: product.thumbnail, rank: 0 } as HttpTypes.StoreProductImage]
      : []

  // Extract metadata
  const publicSpecs = getPublicProductSpecs(product)
  const brand = product.collection?.title || publicSpecs.find((spec) => spec.label === "Marca")?.value || "FriggaFrio"
  const productTitle = decodeProductText(product.title)
  const sku = product.variants?.[0]?.sku || "N/A"
  const category = product.categories?.[0]?.name || product.type?.value || null
  const purchaseState = getProductPurchaseState(product)
  const availabilityLabel = purchaseState.status === "quote_only"
    ? "Somente sob cotação"
    : purchaseState.status === "price_pending"
      ? "Preço em configuração"
      : purchaseState.status === "out_of_stock"
        ? "Sem estoque"
        : purchaseState.status === "unavailable"
          ? "Indisponível"
          : "Em estoque"
  const availabilityClass = purchaseState.status === "purchasable" || purchaseState.status === "select_variant"
    ? "bg-[#e6f4ea] text-[#137333] border-[#ceead6]"
    : "bg-amber-50 text-amber-800 border-amber-200"

  const specs = publicSpecs
  const documents = getPublicProductDocuments(product)
  const tabs = [
    "description",
    ...(specs.length > 0 ? ["specs"] : []),
    ...(documents.length > 0 ? ["documents"] : []),
  ]

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-[var(--color-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-xs md:text-sm text-[var(--color-text-muted)] overflow-x-auto whitespace-nowrap scrollbar-hide">
            <Link to={"/$countryCode" as string} params={{ countryCode }} className="hover:text-[var(--color-primary)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] rounded-sm">
              Home
            </Link>
            <ChevronRight className="w-4 h-4 shrink-0" />
            <Link to={"/$countryCode/store" as string} params={{ countryCode }} className="hover:text-[var(--color-primary)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] rounded-sm">
              Catálogo
            </Link>
            <ChevronRight className="w-4 h-4 shrink-0" />
            <span className="text-[var(--color-navy)] font-medium truncate">{productTitle}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] xl:gap-12">

          {/* Left: Image Gallery */}
          <div className="space-y-6">
            <div className="overflow-hidden rounded-[var(--radius-card-lg)] border border-[var(--color-border)] bg-white shadow-sm">
              {images.length > 0 ? (
                <ImageGallery images={images} />
              ) : (
                <div className="flex aspect-[4/3] items-center justify-center bg-[var(--color-surface-soft)]">
                  <div className="text-center text-[var(--color-text-muted)] flex flex-col items-center">
                    <svg xmlns="http://www.w3.org/w3.org/2000/svg" className="w-16 h-16 mb-4 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                    <span className="text-sm font-medium">Imagem indisponível</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Product Info */}
          <div className="flex flex-col">
            <div className="mb-5">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className="px-2 py-1 bg-[var(--color-surface-soft)] text-[var(--color-primary)] text-xs font-bold uppercase tracking-wider rounded">
                    {brand}
                  </span>
                  <span className="px-2 py-1 bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-muted)] text-xs font-mono rounded">
                    Ref: {sku}
                  </span>
                </div>
                <FavoriteButton productId={product.id} productTitle={productTitle} className="shrink-0" />
              </div>

              <h1 className="mb-3 text-2xl font-bold leading-tight text-[var(--color-navy)] md:text-3xl lg:text-4xl">
                {productTitle}
              </h1>

              <div className="flex flex-wrap items-center gap-3">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-full border ${availabilityClass}`}>
                  <span className="w-2 h-2 rounded-full bg-current"></span>
                  {availabilityLabel}
                </span>
                {category && (
                  <span className="text-sm text-[var(--color-text-muted)]">
                    Categoria: <strong className="text-[var(--color-text)] font-medium">{category}</strong>
                  </span>
                )}
              </div>
            </div>

            {/* Price & Actions Box */}
            <div className="mb-6 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white p-5 shadow-sm md:p-6">
              <ProductActions product={product} region={region!} />
              <ShippingEstimate />

              {purchaseState.status === "quote_only" && (
                <div className="flex flex-col gap-3 mt-4">
                                    <a
                    href={`https://wa.me/${storeConfig.whatsappNumber}?text=${encodeURIComponent(`Olá, gostaria de solicitar um orçamento para: ${productTitle}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-button)] border border-[var(--color-primary)] bg-white px-6 py-3.5 text-base font-semibold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-surface-soft)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
                  >
                    Solicitar orçamento
                  </a>
                </div>
              )}

              <div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-sm text-[var(--color-text-muted)]">
                                   <button
                    type="button"
                    onClick={async () => {
                      const shareData = { title: productTitle, url: window.location.href }
                      if (navigator.share) {
                        await navigator.share(shareData).catch(() => undefined)
                        return
                      }
                      await navigator.clipboard?.writeText(window.location.href)
                      toast.success("Link do produto copiado")
                    }}
                    className="flex items-center gap-1.5 rounded-sm transition-colors hover:text-[var(--color-primary)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
                  >
                    <Share2 className="h-4 w-4" aria-hidden="true" />
                    Compartilhar
                  </button>
                <a href={`https://wa.me/${storeConfig.whatsappNumber}?text=${encodeURIComponent(`Olá, quero saber mais sobre o produto: ${productTitle}`)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[#25D366] font-medium hover:underline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] rounded-sm">
                   <svg xmlns="http://www.w3.org/w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                   Dúvidas? Fale conosco
                 </a>
              </div>
            </div>

            {/* Aviso Técnico Discreto se necessário */}
            <div className="mb-6 rounded-r-md border-l-4 border-[var(--color-primary)] bg-[var(--color-surface-soft)] p-4 text-sm text-[var(--color-navy)]">
              A seleção, aplicação, armazenamento e manuseio de fluidos refrigerantes e equipamentos devem seguir as especificações do fabricante e as normas de segurança aplicáveis.
            </div>

            {/* Tabs Content */}
            <div className="mt-auto">
              <div className="flex gap-6 overflow-x-auto border-b border-[var(--color-border)]" role="tablist" aria-label="Informações do produto">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    role="tab"
                    aria-selected={activeTab === tab}
                    aria-controls={`product-tabpanel-${tab}`}
                    id={`product-tab-${tab}`}
                    className={`pb-3 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] ${
                      activeTab === tab
                        ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                        : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-navy)]"
                    }`}
                  >
                    {tab === "description" ? "Descrição" : tab === "specs" ? "Especificações" : "Documentos"}
                  </button>
                ))}
              </div>

              <div className="min-h-[120px] py-5">
                {activeTab === "description" && (
                  <div id="product-tabpanel-description" role="tabpanel" aria-labelledby="product-tab-description" className="prose prose-sm max-w-none text-[var(--color-text)]">
                    {product.description ? (
                      <p className="leading-relaxed whitespace-pre-line">{decodeProductText(product.description)}</p>
                    ) : (
                      <p className="text-[var(--color-text-muted)] italic">Nenhuma descrição detalhada disponível para este produto.</p>
                    )}
                  </div>
                )}

                {activeTab === "specs" && (
                  <div id="product-tabpanel-specs" role="tabpanel" aria-labelledby="product-tab-specs" className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {specs.length > 0 ? (
                      specs.map(({ label, value }) => (
                        <div key={label} className="bg-[var(--color-surface-soft)] p-3 rounded-md border border-[var(--color-border)]">
                          <span className="block text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-1">{label}</span>
                          <span className="block text-sm text-[var(--color-navy)]">{value}</span>
                        </div>
                      ))
                    ) : (
                       <p className="text-[var(--color-text-muted)] italic text-sm">Ficha técnica não disponível no momento.</p>
                    )}
                  </div>
                )}

                {activeTab === "documents" && documents.length > 0 && (
                  <div id="product-tabpanel-documents" role="tabpanel" aria-labelledby="product-tab-documents" className="flex flex-col gap-3">
                    <p className="text-sm text-[var(--color-text-muted)] mb-2">Manuais, FISPQ e documentações técnicas:</p>
                    <div className="p-4 bg-white border border-[var(--color-border)] rounded-md flex items-center justify-between group hover:border-[var(--color-primary)] transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-[#ffeceb] text-[#d93025] flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                        </div>
                        <div>
                          <span className="block text-sm font-semibold text-[var(--color-navy)] group-hover:text-[var(--color-primary)] transition-colors">Manual do Fabricante</span>
                          <span className="block text-xs text-[var(--color-text-muted)]">PDF • 2.4 MB</span>
                        </div>
                      </div>
                      <a href={documents[0]?.url} target="_blank" rel="noopener noreferrer" aria-label="Abrir documento técnico" className="text-[var(--color-primary)] p-2 rounded-full hover:bg-[var(--color-surface-soft)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]">
                        <svg xmlns="http://www.w3.org/w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductPage
