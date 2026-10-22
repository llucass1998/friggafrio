import { defineRouteConfig } from "@medusajs/admin-sdk"
import { BuildingStorefront, ArrowUpRightOnBox, MagnifyingGlass, XMark } from "@medusajs/icons"
import {
  Container,
  Heading,
  Text,
  Badge,
  Button,
  Input,
  Select,
  StatusBadge,
  Copy,
  Table,
  Tooltip,
} from "@medusajs/ui"
import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { Link, useSearchParams } from "react-router-dom"
import { sdk } from "../../lib/client"
import { BrandHeader } from "../../components/brand-header"

type CatalogMetrics = {
  total: number
  published: number
  draft: number
  no_image: number
  no_price: number
  quote_only: number
  no_collection: number
  no_sales_channel: number
  omie_linked: number
  omie_pending: number
  no_stock: number
  pending_quotes: number
  pending_reviews: number
  last_updated: string
}

type OmieLink = {
  id: string
  code_display: string
  code_normalized: string
  product_id: string
  variant_id?: string | null
  source?: string | null
}

type ProductVariant = {
  id: string
  title: string
  sku?: string | null
  inventory_quantity?: number | null
  prices?: Array<{ amount?: number | null; currency_code?: string }>
}

type CatalogProduct = {
  id: string
  title: string
  handle?: string
  status: "published" | "draft" | "proposed" | "rejected"
  thumbnail?: string | null
  images?: Array<{ url: string }>
  collection?: { id: string; title: string } | null
  categories?: Array<{ id: string; name: string }>
  metadata?: Record<string, unknown> | null
  variants?: ProductVariant[]
  created_at?: string
  omie_link?: OmieLink | null
}

type CatalogItemsResponse = {
  products: CatalogProduct[]
  count: number
  limit: number
  offset: number
  filter: string
  q?: string
}

const PAGE_SIZE = 20

const CatalogManagementPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  const urlFilter = searchParams.get("filter") || "all"
  const urlSearch = searchParams.get("q") || ""
  const urlPage = Math.max(0, parseInt(searchParams.get("page") || "1", 10) - 1)

  const [activeFilter, setActiveFilter] = useState<string>(urlFilter)
  const [searchTerm, setSearchTerm] = useState<string>(urlSearch)
  const [debouncedSearch, setDebouncedSearch] = useState<string>(urlSearch)
  const [currentPage, setCurrentPage] = useState<number>(urlPage)

  // Sync internal state when URL parameters change externally
  useEffect(() => {
    if (urlFilter !== activeFilter) {
      setActiveFilter(urlFilter)
    }
  }, [urlFilter])

  useEffect(() => {
    if (urlSearch !== searchTerm) {
      setSearchTerm(urlSearch)
      setDebouncedSearch(urlSearch)
    }
  }, [urlSearch])

  // Debounce search input by 300ms and sync with URL
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = searchTerm.trim()
      setDebouncedSearch(trimmed)
      setCurrentPage(0)
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        if (trimmed) {
          next.set("q", trimmed)
        } else {
          next.delete("q")
        }
        next.set("page", "1")
        return next
      })
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm, setSearchParams])

  // Handle filter changes and sync with URL
  const handleFilterChange = (newFilter: string) => {
    setActiveFilter(newFilter)
    setCurrentPage(0)
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (newFilter && newFilter !== "all") {
        next.set("filter", newFilter)
      } else {
        next.delete("filter")
      }
      next.set("page", "1")
      return next
    })
  }

  // Handle page changes and sync with URL
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set("page", String(newPage + 1))
      return next
    })
  }

  // Query real operational catalog metrics (aggregated over entire database)
  const { data: metricsData, isLoading: metricsLoading, error: metricsError } = useQuery({
    queryKey: ["admin-catalog-metrics"],
    queryFn: () => sdk.client.fetch<{ metrics: CatalogMetrics }>("/admin/catalog/metrics"),
    refetchInterval: 60_000,
  })

  const metrics = metricsData?.metrics

  // Query server-side filtered and paginated catalog items
  const {
    data: itemsData,
    isLoading: productsLoading,
    error: productsError,
  } = useQuery({
    queryKey: ["admin-catalog-items", currentPage, debouncedSearch, activeFilter],
    queryFn: () =>
      sdk.client.fetch<CatalogItemsResponse>("/admin/catalog/items", {
        query: {
          limit: PAGE_SIZE,
          offset: currentPage * PAGE_SIZE,
          filter: activeFilter,
          q: debouncedSearch || undefined,
        },
      }),
  })

  const products = itemsData?.products || []
  const totalCount = itemsData?.count ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto">
      {/* Brand Header */}
      <BrandHeader
        title="Gestão de Catálogo"
        subtitle="Controle centralizado de produtos, preços, estoque e integração Omie."
        badgeText="Catálogo Comercial"
      >
        <Link to="/products">
          <Button variant="secondary" size="small" className="gap-2">
            <ArrowUpRightOnBox className="h-4 w-4" />
            Abrir Produtos Medusa
          </Button>
        </Link>
      </BrandHeader>

      {/* Indicadores Operacionais */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <Heading level="h2" className="text-sm font-semibold text-ui-fg-base uppercase tracking-wider">
            Indicadores Operacionais do Catálogo
          </Heading>
          {metrics?.last_updated && (
            <Text size="xsmall" className="text-ui-fg-muted">
              Atualizado: {new Date(metrics.last_updated).toLocaleTimeString("pt-BR")}
            </Text>
          )}
        </div>

        {metricsLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Container key={i} className="p-4 animate-pulse">
                <div className="h-4 w-20 bg-ui-bg-subtle-hover rounded mb-2" />
                <div className="h-8 w-12 bg-ui-bg-subtle-hover rounded" />
              </Container>
            ))}
          </div>
        )}

        {metricsError && (
          <Container className="p-4 border-ui-border-error bg-ui-bg-error-subtle">
            <Text className="text-ui-fg-error">
              Não foi possível carregar os indicadores automáticos no momento.
            </Text>
          </Container>
        )}

        {metrics && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* Card 1: Total de Produtos */}
            <button
              type="button"
              onClick={() => handleFilterChange("all")}
              className={`text-left transition-all rounded-lg p-4 border cursor-pointer ${
                activeFilter === "all"
                  ? "bg-ui-bg-base border-ui-border-interactive shadow-sm ring-1 ring-ui-border-interactive"
                  : "bg-ui-bg-base border-ui-border-base hover:border-ui-border-strong"
              }`}
            >
              <Text size="xsmall" className="text-ui-fg-subtle uppercase tracking-wider font-medium">
                Total de Produtos
              </Text>
              <div className="flex items-baseline justify-between mt-1">
                <Text size="xlarge" weight="plus" className="text-ui-fg-base">
                  {metrics.total.toLocaleString("pt-BR")}
                </Text>
                <Badge size="2xsmall" color="grey">Base Real</Badge>
              </div>
            </button>

            {/* Card 2: Publicados */}
            <button
              type="button"
              onClick={() => handleFilterChange("published")}
              className={`text-left transition-all rounded-lg p-4 border cursor-pointer ${
                activeFilter === "published"
                  ? "bg-ui-bg-base border-ui-border-interactive shadow-sm ring-1 ring-ui-border-interactive"
                  : "bg-ui-bg-base border-ui-border-base hover:border-ui-border-strong"
              }`}
            >
              <Text size="xsmall" className="text-ui-fg-subtle uppercase tracking-wider font-medium">
                Publicados na Loja
              </Text>
              <div className="flex items-baseline justify-between mt-1">
                <Text size="xlarge" weight="plus" className="text-ui-fg-base">
                  {metrics.published.toLocaleString("pt-BR")}
                </Text>
                <Badge size="2xsmall" color="green">Ativos</Badge>
              </div>
            </button>

            {/* Card 3: Sem Imagem */}
            <button
              type="button"
              onClick={() => handleFilterChange("no_image")}
              className={`text-left transition-all rounded-lg p-4 border cursor-pointer ${
                activeFilter === "no_image"
                  ? "bg-ui-bg-base border-ui-border-interactive shadow-sm ring-1 ring-ui-border-interactive"
                  : "bg-ui-bg-base border-ui-border-base hover:border-ui-border-strong"
              }`}
            >
              <Text size="xsmall" className="text-ui-fg-subtle uppercase tracking-wider font-medium">
                Sem Imagem
              </Text>
              <div className="flex items-baseline justify-between mt-1">
                <Text size="xlarge" weight="plus" className={metrics.no_image > 0 ? "text-ui-fg-warning" : "text-ui-fg-base"}>
                  {metrics.no_image.toLocaleString("pt-BR")}
                </Text>
                {metrics.no_image > 0 ? (
                  <Badge size="2xsmall" color="orange">Atenção</Badge>
                ) : (
                  <Badge size="2xsmall" color="green">OK</Badge>
                )}
              </div>
            </button>

            {/* Card 4: Sem Preço */}
            <button
              type="button"
              onClick={() => handleFilterChange("no_price")}
              className={`text-left transition-all rounded-lg p-4 border cursor-pointer ${
                activeFilter === "no_price"
                  ? "bg-ui-bg-base border-ui-border-interactive shadow-sm ring-1 ring-ui-border-interactive"
                  : "bg-ui-bg-base border-ui-border-base hover:border-ui-border-strong"
              }`}
            >
              <Text size="xsmall" className="text-ui-fg-subtle uppercase tracking-wider font-medium">
                Sem Preço Válido
              </Text>
              <div className="flex items-baseline justify-between mt-1">
                <Text size="xlarge" weight="plus" className={metrics.no_price > 0 ? "text-ui-fg-warning" : "text-ui-fg-base"}>
                  {metrics.no_price.toLocaleString("pt-BR")}
                </Text>
                {metrics.no_price > 0 ? (
                  <Badge size="2xsmall" color="orange">Pendente</Badge>
                ) : (
                  <Badge size="2xsmall" color="green">100%</Badge>
                )}
              </div>
            </button>

            {/* Card 5: Pendências Omie */}
            <button
              type="button"
              onClick={() => handleFilterChange("no_omie")}
              className={`text-left transition-all rounded-lg p-4 border cursor-pointer ${
                activeFilter === "no_omie"
                  ? "bg-ui-bg-base border-ui-border-interactive shadow-sm ring-1 ring-ui-border-interactive"
                  : "bg-ui-bg-base border-ui-border-base hover:border-ui-border-strong"
              }`}
            >
              <Text size="xsmall" className="text-ui-fg-subtle uppercase tracking-wider font-medium">
                Sem Vínculo Omie
              </Text>
              <div className="flex items-baseline justify-between mt-1">
                <Text size="xlarge" weight="plus" className={metrics.omie_pending > 0 ? "text-ui-fg-warning" : "text-ui-fg-base"}>
                  {metrics.omie_pending.toLocaleString("pt-BR")}
                </Text>
                <Badge size="2xsmall" color={metrics.omie_pending > 0 ? "orange" : "green"}>
                  {metrics.omie_linked} Vinculados
                </Badge>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Barra de Filtros e Busca Unificada */}
      <Container className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-ui-fg-muted h-4 w-4" />
            <Input
              type="text"
              placeholder="Buscar por Nome, SKU, Código Omie ou Marca..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
              aria-label="Buscar produtos no catálogo"
            />
          </div>

          <div className="flex items-center gap-3">
            <Text size="small" className="text-ui-fg-muted shrink-0">
              Filtro:
            </Text>
            <Select value={activeFilter} onValueChange={handleFilterChange}>
              <Select.Trigger className="w-56">
                <Select.Value />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="all">Todos os Produtos</Select.Item>
                <Select.Item value="published">Apenas Publicados</Select.Item>
                <Select.Item value="draft">Apenas Rascunhos</Select.Item>
                <Select.Item value="no_image">Sem Imagem Cadastrada</Select.Item>
                <Select.Item value="no_price">Sem Preço Configurado</Select.Item>
                <Select.Item value="has_price">Com Preço Configurado</Select.Item>
                <Select.Item value="quote_only">Sob Consulta / Cotação</Select.Item>
                <Select.Item value="no_stock">Sem Estoque Disponível</Select.Item>
                <Select.Item value="has_stock">Com Estoque Disponível</Select.Item>
                <Select.Item value="no_omie">Sem Vínculo Omie</Select.Item>
                <Select.Item value="has_omie">Com Vínculo Omie</Select.Item>
                <Select.Item value="no_collection">Sem Coleção Atribuída</Select.Item>
              </Select.Content>
            </Select>

            {(activeFilter !== "all" || searchTerm) && (
              <Button
                variant="secondary"
                size="small"
                onClick={() => {
                  setSearchTerm("")
                  handleFilterChange("all")
                }}
                className="gap-1 shrink-0"
              >
                <XMark className="h-3.5 w-3.5" /> Limpar
              </Button>
            )}
          </div>
        </div>
      </Container>

      {/* Tabela de Produtos */}
      <Container className="p-0 overflow-hidden divide-y divide-ui-border-base">
        <div className="overflow-x-auto">
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell className="w-14">Imagem</Table.HeaderCell>
                <Table.HeaderCell>Produto</Table.HeaderCell>
                <Table.HeaderCell>Cód. FriggaFrio / Omie</Table.HeaderCell>
                <Table.HeaderCell>SKU</Table.HeaderCell>
                <Table.HeaderCell>Preço</Table.HeaderCell>
                <Table.HeaderCell>Estoque</Table.HeaderCell>
                <Table.HeaderCell>Coleção / Categoria</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
                <Table.HeaderCell className="text-right">Ação</Table.HeaderCell>
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {productsLoading && (
                <Table.Row>
                  <td colSpan={9} className="text-center py-12 text-ui-fg-muted">
                    Carregando produtos do catálogo...
                  </td>
                </Table.Row>
              )}

              {productsError && (
                <Table.Row>
                  <td colSpan={9} className="text-center py-8 text-ui-fg-error">
                    Erro ao carregar dados do catálogo. Verifique sua conexão e tente novamente.
                  </td>
                </Table.Row>
              )}

              {!productsLoading && !productsError && products.length === 0 && (
                <Table.Row>
                  <td colSpan={9} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <BuildingStorefront className="h-8 w-8 text-ui-fg-muted" />
                      <Text size="base" weight="plus" className="text-ui-fg-base">
                        Nenhum produto encontrado
                      </Text>
                      <Text size="small" className="text-ui-fg-subtle">
                        Tente ajustar a busca ou limpar os filtros aplicados.
                      </Text>
                      <Button
                        size="small"
                        variant="secondary"
                        onClick={() => {
                          setSearchTerm("")
                          handleFilterChange("all")
                        }}
                        className="mt-2"
                      >
                        Limpar Filtros e Busca
                      </Button>
                    </div>
                  </td>
                </Table.Row>
              )}

              {!productsLoading &&
                !productsError &&
                products.map((product) => {
                  const omieLink = product.omie_link
                  const variants = product.variants || []
                  const primaryVariant = variants[0]
                  const mainSku = primaryVariant?.sku || "-"
                  const totalStock = variants.reduce(
                    (sum, v) => sum + (v.inventory_quantity || 0),
                    0,
                  )

                  // First valid price
                  const priceItem = variants
                    .flatMap((v) => v.prices || [])
                    .find((p) => typeof p.amount === "number" && p.amount > 0)

                  const formattedPrice = priceItem
                    ? new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: priceItem.currency_code?.toUpperCase() || "BRL",
                      }).format(priceItem.amount || 0)
                    : null

                  const isQuoteOnly =
                    product.metadata?.commercial_status === "QUOTE_ONLY" ||
                    product.metadata?.quote_only === true ||
                    !formattedPrice

                  return (
                    <Table.Row key={product.id} className="hover:bg-ui-bg-subtle-hover transition-colors">
                      {/* Imagem */}
                      <Table.Cell>
                        {product.thumbnail ? (
                          <img
                            src={product.thumbnail}
                            alt={product.title}
                            className="h-10 w-10 rounded-md object-cover border border-ui-border-base shrink-0"
                            loading="lazy"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-md bg-ui-bg-subtle border border-ui-border-base flex items-center justify-center text-ui-fg-muted text-xs">
                            Sem foto
                          </div>
                        )}
                      </Table.Cell>

                      {/* Produto */}
                      <Table.Cell className="font-medium max-w-xs">
                        <Link
                          to={`/products/${product.id}`}
                          className="text-ui-fg-base hover:text-ui-fg-interactive transition-colors line-clamp-2"
                          title={product.title}
                        >
                          {product.title}
                        </Link>
                        <Text size="xsmall" className="text-ui-fg-muted font-mono mt-0.5">
                          ID: {product.id}
                        </Text>
                      </Table.Cell>

                      {/* Código Omie */}
                      <Table.Cell>
                        {omieLink ? (
                          <div className="flex items-center gap-1.5">
                            <Badge color="blue" size="small" className="font-mono">
                              {omieLink.code_display}
                            </Badge>
                            <Copy content={omieLink.code_display} className="text-ui-fg-muted" />
                          </div>
                        ) : (
                          <Tooltip content="Clique para vincular o código na página de detalhes">
                            <Badge color="grey" size="small" className="text-ui-fg-muted">
                              Não vinculado
                            </Badge>
                          </Tooltip>
                        )}
                      </Table.Cell>

                      {/* SKU */}
                      <Table.Cell className="font-mono text-ui-fg-subtle text-xs">
                        {mainSku}
                      </Table.Cell>

                      {/* Preço */}
                      <Table.Cell>
                        {isQuoteOnly ? (
                          <Badge color="orange" size="small">
                            Sob consulta
                          </Badge>
                        ) : (
                          <Text size="small" weight="plus" className="text-ui-fg-base">
                            {formattedPrice}
                          </Text>
                        )}
                      </Table.Cell>

                      {/* Estoque */}
                      <Table.Cell>
                        {totalStock > 0 ? (
                          <Text size="small" className="text-ui-fg-base">
                            {totalStock}{" "}
                            <span className="text-ui-fg-muted text-xs">unid.</span>
                          </Text>
                        ) : (
                          <Badge color="red" size="small">
                            Esgotado
                          </Badge>
                        )}
                      </Table.Cell>

                      {/* Coleção / Categoria */}
                      <Table.Cell className="text-ui-fg-subtle text-xs max-w-[140px] truncate">
                        {product.collection?.title ||
                          (product.categories && product.categories[0]?.name) ||
                          "-"}
                      </Table.Cell>

                      {/* Status */}
                      <Table.Cell>
                        <StatusBadge color={product.status === "published" ? "green" : "grey"}>
                          {product.status === "published" ? "Publicado" : "Rascunho"}
                        </StatusBadge>
                      </Table.Cell>

                      {/* Ação */}
                      <Table.Cell className="text-right">
                        <Link to={`/products/${product.id}`}>
                          <Button size="small" variant="secondary" className="gap-1">
                            Editar <ArrowUpRightOnBox className="h-3 w-3" />
                          </Button>
                        </Link>
                      </Table.Cell>
                    </Table.Row>
                  )
                })}
            </Table.Body>
          </Table>
        </div>

        {/* Paginação */}
        <div className="flex items-center justify-between px-6 py-4 bg-ui-bg-subtle">
          <Text size="small" className="text-ui-fg-subtle">
            Exibindo{" "}
            <span className="font-medium text-ui-fg-base">
              {products.length > 0 ? currentPage * PAGE_SIZE + 1 : 0}
            </span>{" "}
            a{" "}
            <span className="font-medium text-ui-fg-base">
              {Math.min((currentPage + 1) * PAGE_SIZE, totalCount)}
            </span>{" "}
            de <span className="font-medium text-ui-fg-base">{totalCount}</span> produtos cadastrados
          </Text>

          <div className="flex items-center gap-2">
            <Button
              size="small"
              variant="secondary"
              onClick={() => handlePageChange(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0 || productsLoading}
            >
              Anterior
            </Button>
            <Text size="small" className="text-ui-fg-muted px-2">
              Página {currentPage + 1} de {totalPages}
            </Text>
            <Button
              size="small"
              variant="secondary"
              onClick={() => handlePageChange(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage >= totalPages - 1 || productsLoading}
            >
              Próxima
            </Button>
          </div>
        </div>
      </Container>
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Gestão de Catálogo",
  icon: BuildingStorefront,
  rank: 1,
})

export default CatalogManagementPage
