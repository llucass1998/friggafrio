import { Link, useLoaderData } from "@tanstack/react-router"
import { HttpTypes } from "@medusajs/types"
import { ChevronRight, FileText, PackageCheck, Share2 } from "lucide-react"
import type { ReactNode } from "react"
import { ImageGallery } from "@/components/ui/image-gallery"
import ProductActions from "@/components/product-actions"
import ProductRating from "@/components/product-rating"
import { getProductPurchaseState } from "@/lib/utils/product-state"
import { decodeProductText } from "@/lib/utils/product-text"
import { getPublicProductDocuments, getPublicProductSpecs } from "@/lib/utils/public-product-specs"
import { toast } from "sonner"
import { ShippingEstimate } from "@/components/shipping-estimate"
import { FavoriteButton } from "@/components/favorite-button"
import ProductReviews from "@/components/product-reviews"
import RelatedProducts from "@/components/related-products"
import { resolveMediaUrl } from "@/lib/media-url"

interface ProductPageData {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
}

function DetailPanel({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-[var(--radius-card-lg)] border border-[var(--color-border)] bg-white p-5 shadow-[0_8px_24px_rgba(8,59,102,0.06)] sm:p-7 ${className}`}>
      <h2 className="text-xl font-bold text-[var(--color-navy)] sm:text-2xl">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  )
}

export function ProductPage() {
  const loaderData = useLoaderData({ strict: false }) as ProductPageData | undefined
  const { product, region, countryCode = "br" } = loaderData || {}

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
  const brand = product.collection?.title || publicSpecs.find((spec) => spec.label === "Marca")?.value || "FriggaFrio"
  const productTitle = decodeProductText(product.title)
  const sku = product.variants?.[0]?.sku || null
  const category = product.categories?.[0]?.name || product.type?.value || null
  const purchaseState = getProductPurchaseState(product)
  const available = purchaseState.status === "purchasable" || purchaseState.status === "select_variant"
  const availabilityLabel = purchaseState.status === "quote_only"
    ? "Somente sob cotação"
    : purchaseState.status === "price_pending"
      ? "Preço em configuração"
      : purchaseState.status === "out_of_stock"
        ? "Sem estoque"
        : purchaseState.status === "unavailable"
          ? "Indisponível"
          : "Em estoque"

  return (
    <main className="min-h-screen bg-[var(--color-background)] pb-20 md:pb-10" data-testid="product-page">
      <nav aria-label="Caminho de navegação" className="border-b border-[var(--color-border)] bg-white" data-testid="product-breadcrumbs">
        <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-4 py-4 text-xs text-[var(--color-text-muted)] sm:px-6 md:text-sm lg:px-8">
          <Link to={"/$countryCode" as string} params={{ countryCode }} className="shrink-0 hover:text-[var(--color-primary)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]">Home</Link>
          <ChevronRight className="h-4 w-4 shrink-0" aria-hidden="true" />
          <Link to={"/$countryCode/store" as string} params={{ countryCode }} className="shrink-0 hover:text-[var(--color-primary)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]">Catálogo</Link>
          {category && <><ChevronRight className="h-4 w-4 shrink-0" aria-hidden="true" /><span className="shrink-0">{category}</span></>}
          <ChevronRight className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="truncate font-medium text-[var(--color-navy)]" aria-current="page">{productTitle}</span>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 md:py-10 lg:px-8" data-testid="product-top-layout">
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12 lg:gap-7 xl:gap-8">
          <section className="lg:col-span-5" aria-label="Galeria do produto">
            <div className="rounded-[var(--radius-card-lg)] border border-[var(--color-border)] bg-white p-3 shadow-[0_8px_24px_rgba(8,59,102,0.06)] sm:p-4">
              {images.length > 0 ? <ImageGallery images={images} /> : (
                <div className="flex aspect-[4/3] items-center justify-center rounded-lg bg-[var(--color-surface-soft)] text-sm font-medium text-[var(--color-text-muted)]">Imagem indisponível</div>
              )}
            </div>
          </section>

          <section className="min-w-0 lg:col-span-4" aria-labelledby="product-title">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-[var(--color-surface-soft)] px-2 py-1 text-xs font-bold uppercase tracking-wider text-[var(--color-primary)]">{brand}</span>
                {sku && <span className="rounded border border-[var(--color-border)] bg-white px-2 py-1 font-mono text-xs text-[var(--color-text-muted)]">Ref: {sku}</span>}
              </div>
              <FavoriteButton productId={product.id} productTitle={productTitle} className="shrink-0" />
            </div>
            <h1 id="product-title" className="mt-4 text-3xl font-bold leading-tight text-[var(--color-navy)] sm:text-4xl">{productTitle}</h1>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
              <ProductRating productId={product.id} />
              <a href="#reviews-title" className="text-sm font-semibold text-[var(--color-primary)] underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]">Ver avaliações</a>
              {category && <span className="text-sm text-[var(--color-text-muted)]">Categoria: <strong className="font-medium text-[var(--color-text)]">{category}</strong></span>}
            </div>
            <div className={`mt-4 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold ${available ? "border-[#ceead6] bg-[#e6f4ea] text-[#137333]" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
              <span className="h-2 w-2 rounded-full bg-current" aria-hidden="true" />{availabilityLabel}
            </div>
            {product.options?.length ? (
              <div className="mt-7 border-t border-[var(--color-border)] pt-5">
                <h2 className="text-sm font-bold text-[var(--color-navy)]">Escolha as opções do produto</h2>
                <p className="mt-1 text-sm leading-6 text-[var(--color-text-muted)]">Preço e disponibilidade são atualizados conforme a variante selecionada.</p>
              </div>
            ) : null}
          </section>

          <aside className="min-w-0 lg:col-span-3 lg:sticky lg:top-24" aria-label="Compra do produto" data-testid="purchase-panel">
            <div className="min-w-0 rounded-[var(--radius-card-lg)] border border-[var(--color-border)] bg-white p-5 shadow-[0_12px_30px_rgba(8,59,102,0.1)]">
              <ProductActions product={product} region={region!} />
              <ShippingEstimate />
              <div className="mt-5 flex items-center justify-between border-t border-[var(--color-border)] pt-4 text-sm text-[var(--color-text-muted)]">
                <span>Atendimento especializado</span>
                <button type="button" onClick={async () => {
                  const shareData = { title: productTitle, url: window.location.href }
                  if (navigator.share) { await navigator.share(shareData).catch(() => undefined); return }
                  await navigator.clipboard?.writeText(window.location.href)
                  toast.success("Link do produto copiado")
                }} className="inline-flex min-h-11 items-center gap-1.5 rounded px-2 font-semibold text-[var(--color-primary)] hover:bg-[var(--color-surface-soft)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]">
                  <Share2 className="h-4 w-4" aria-hidden="true" />Compartilhar
                </button>
              </div>
            </div>
          </aside>
        </div>

        <div className="mt-8 grid gap-6" data-testid="product-detail-panels">
          {publicSpecs.length > 0 && <DetailPanel title="Principais características">
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {publicSpecs.slice(0, 6).map(({ label, value }) => <li key={label} className="rounded-lg bg-[var(--color-surface-soft)] px-4 py-3"><span className="block text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">{label}</span><span className="mt-1 block text-sm font-medium text-[var(--color-navy)]">{value}</span></li>)}
            </ul>
          </DetailPanel>}
          <DetailPanel title="Descrição">
            {product.description ? <p className="max-w-5xl whitespace-pre-line text-sm leading-7 text-[var(--color-text)] sm:text-base">{decodeProductText(product.description)}</p> : <p className="text-sm italic text-[var(--color-text-muted)]">Nenhuma descrição detalhada disponível para este produto.</p>}
          </DetailPanel>
          {publicSpecs.length > 0 && <DetailPanel title="Ficha técnica">
            <div className="overflow-x-auto"><table className="w-full min-w-[360px] border-separate border-spacing-y-1 text-left text-sm"><tbody>{publicSpecs.map(({ label, value }) => <tr key={label}><th scope="row" className="w-1/3 rounded-l-md bg-[var(--color-surface-soft)] px-4 py-3 font-semibold text-[var(--color-navy)]">{label}</th><td className="rounded-r-md bg-[var(--color-background)] px-4 py-3 text-[var(--color-text)]">{value}</td></tr>)}</tbody></table></div>
          </DetailPanel>}
          {documents.length > 0 && <DetailPanel title="Documentos técnicos">
            <ul className="grid gap-3 sm:grid-cols-2">{documents.map((document) => <li key={document.url}><a href={document.url} target="_blank" rel="noopener noreferrer" className="flex min-h-12 items-center gap-3 rounded-lg border border-[var(--color-border)] px-4 py-3 text-sm font-semibold text-[var(--color-primary)] hover:bg-[var(--color-surface-soft)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"><FileText className="h-5 w-5" aria-hidden="true" />{document.name}</a></li>)}</ul>
          </DetailPanel>}
          <aside className="flex items-start gap-3 rounded-[var(--radius-card)] border border-[var(--color-primary)]/15 bg-[var(--color-surface-soft)] p-4 text-sm leading-6 text-[var(--color-navy)]">
            <PackageCheck className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-primary)]" aria-hidden="true" />
            A seleção, aplicação, armazenamento e manuseio de fluidos refrigerantes e equipamentos devem seguir as especificações do fabricante e as normas de segurança aplicáveis.
          </aside>
        </div>
      </div>
      {region && <RelatedProducts product={product} regionId={region.id} />}
      <ProductReviews productId={product.id} productTitle={productTitle} />
    </main>
  )
}

export default ProductPage
