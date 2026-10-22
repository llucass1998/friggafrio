import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text, Badge } from "@medusajs/ui"
import { CheckCircle, ExclamationCircle, Sparkles } from "@medusajs/icons"
import { useQuery } from "@tanstack/react-query"
import { useParams } from "react-router-dom"
import { sdk } from "../lib/client"

type ProductData = {
  id: string
  title: string
  description?: string | null
  thumbnail?: string | null
  images?: Array<{ url: string }>
  categories?: Array<{ id: string; name: string }>
  variants?: Array<{
    id: string
    sku?: string | null
    inventory_quantity?: number | null
    prices?: Array<{ amount?: number | null }>
  }>
}

type OmieLinksResponse = {
  links: Array<{ id: string; code_display: string }>
}

const ProductQualityChecklist = () => {
  const { id } = useParams<{ id: string }>()

  const productQuery = useQuery({
    queryKey: ["admin-product-quality", id],
    enabled: Boolean(id),
    queryFn: () =>
      sdk.client.fetch<{ product: ProductData }>(`/admin/products/${id}`, {
        query: {
          fields: "id,title,description,thumbnail,images.url,categories.id,categories.name,variants.id,variants.sku,variants.inventory_quantity,variants.prices.amount",
        },
      }),
  })

  const omieQuery = useQuery({
    queryKey: ["frigga-omie-links", id],
    enabled: Boolean(id),
    queryFn: () => sdk.client.fetch<OmieLinksResponse>(`/admin/omie/products/${id}/code`),
  })

  if (!id) return null

  const product = productQuery.data?.product
  const hasOmie = Boolean(omieQuery.data?.links && omieQuery.data.links.length > 0)

  if (productQuery.isLoading) {
    return (
      <Container className="my-4 p-4 animate-pulse">
        <div className="h-4 w-32 bg-ui-bg-subtle-hover rounded mb-2" />
        <div className="h-2 w-full bg-ui-bg-subtle-hover rounded" />
      </Container>
    )
  }

  if (!product) return null

  const hasImage = Boolean(product.thumbnail || (product.images && product.images.length > 0))
  const hasDescription = Boolean(product.description && product.description.trim().length > 10)
  const variants = product.variants || []
  const hasSku = variants.some((v) => Boolean(v.sku && v.sku.trim().length > 0))
  const hasPrice = variants.some((v) =>
    (v.prices || []).some((p) => typeof p.amount === "number" && p.amount > 0),
  )
  const hasCategory = Boolean(product.categories && product.categories.length > 0)
  const totalStock = variants.reduce((sum, v) => sum + (v.inventory_quantity || 0), 0)
  const hasStock = totalStock > 0

  const items = [
    { label: "Imagem principal", ok: hasImage, hint: "Aumenta a conversão na vitrine" },
    { label: "Descrição detalhada", ok: hasDescription, hint: "Mínimo de 10 caracteres" },
    { label: "SKU da variante", ok: hasSku, hint: "Identificador de estoque" },
    { label: "Preço configurado", ok: hasPrice, hint: "Necessário para venda direta" },
    { label: "Categoria atribuída", ok: hasCategory, hint: "Organização do catálogo" },
    { label: "Código FriggaFrio / Omie", ok: hasOmie, hint: "Sincronização com o ERP" },
    { label: "Estoque disponível", ok: hasStock, hint: totalStock > 0 ? `${totalStock} unid.` : "Esgotado" },
  ]

  const completedCount = items.filter((item) => item.ok).length
  const score = Math.round((completedCount / items.length) * 100)

  const scoreBadgeColor = score >= 80 ? "green" : score >= 50 ? "orange" : "red"

  return (
    <Container className="my-4 border border-ui-border-base p-4" data-testid="product-quality-checklist">
      <div className="flex items-center justify-between pb-3 border-b border-ui-border-base">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-ui-fg-interactive" />
          <Heading level="h3" className="text-sm font-semibold text-ui-fg-base">
            Qualidade do Cadastro
          </Heading>
        </div>
        <Badge color={scoreBadgeColor} size="small">
          {score}% Completo
        </Badge>
      </div>

      {/* Progress Bar */}
      <div className="mt-3 w-full bg-ui-bg-subtle rounded-full h-2 overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${
            score >= 80 ? "bg-ui-tag-green-icon" : score >= 50 ? "bg-ui-tag-orange-icon" : "bg-ui-tag-red-icon"
          }`}
          style={{ width: `${score}%` }}
        />
      </div>

      <Text size="xsmall" className="text-ui-fg-muted mt-2">
        {completedCount} de {items.length} itens recomendados preenchidos.
      </Text>

      {/* Items list */}
      <div className="mt-4 space-y-2.5">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-start justify-between text-xs gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {item.ok ? (
                <CheckCircle className="h-4 w-4 text-ui-tag-green-icon shrink-0" />
              ) : (
                <ExclamationCircle className="h-4 w-4 text-ui-fg-muted shrink-0" />
              )}
              <span className={`break-words ${item.ok ? "text-ui-fg-base font-medium" : "text-ui-fg-subtle"}`}>
                {item.label}
              </span>
            </div>
            <span className="text-ui-fg-muted text-[11px] shrink-0 text-right">
              {item.hint}
            </span>
          </div>
        ))}
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.side",
  id: "friggafrio.product-quality-checklist",
})

export default ProductQualityChecklist
