import { defineRouteConfig } from "@medusajs/admin-sdk"
import {
  ChartBar,
  BuildingStorefront,
  MagnifyingGlass,
  DocumentText,
  Star,
  Plus,
  ArrowUpRightOnBox,
  ExclamationCircle,
  CheckCircle,
} from "@medusajs/icons"
import {
  Container,
  Heading,
  Text,
  Badge,
  Button,
} from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
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

const OverviewDashboardPage = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-catalog-metrics"],
    queryFn: () => sdk.client.fetch<{ metrics: CatalogMetrics }>("/admin/catalog/metrics"),
    refetchInterval: 30_000,
  })

  const metrics = data?.metrics

  return (
    <div className="flex flex-col gap-4 sm:gap-6 p-3 sm:p-4 md:p-6 max-w-7xl mx-auto w-full min-w-0">
      {/* Brand Header */}
      <BrandHeader
        title="Visão Geral FriggaFrio"
        subtitle="Painel de controle operacional, métricas de catálogo e alertas do sistema."
        badgeText="Dashboard Operacional"
      >
        <Link to="/catalog" className="w-full sm:w-auto">
          <Button size="small" variant="secondary" className="gap-2 w-full sm:w-auto justify-center">
            <BuildingStorefront className="h-4 w-4" />
            Ir para Catálogo
          </Button>
        </Link>
      </BrandHeader>

      {/* Bloco de Ações Rápidas */}
      <div className="w-full min-w-0">
        <Heading level="h2" className="text-xs sm:text-sm font-semibold text-ui-fg-base uppercase tracking-wider mb-3">
          Ações Rápidas
        </Heading>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3 w-full">
          <Link to="/products" className="group block min-w-0">
            <Container className="p-3.5 sm:p-4 flex flex-col justify-between h-24 sm:h-28 hover:border-ui-border-interactive hover:shadow-sm transition-all">
              <div className="flex items-center justify-between">
                <div className="h-8 w-8 rounded-lg bg-ui-bg-base border border-ui-border-base flex items-center justify-center text-ui-fg-subtle group-hover:text-ui-fg-interactive">
                  <Plus className="h-4 w-4" />
                </div>
                <ArrowUpRightOnBox className="h-3.5 w-3.5 text-ui-fg-muted" />
              </div>
              <div>
                <Text size="small" weight="plus" className="text-ui-fg-base group-hover:text-ui-fg-interactive text-xs sm:text-sm">
                  Cadastrar Produto
                </Text>
                <Text size="xsmall" className="text-ui-fg-muted text-[11px]">
                  Painel nativo Medusa
                </Text>
              </div>
            </Container>
          </Link>

          <Link to="/catalog" className="group block min-w-0">
            <Container className="p-3.5 sm:p-4 flex flex-col justify-between h-24 sm:h-28 hover:border-ui-border-interactive hover:shadow-sm transition-all">
              <div className="flex items-center justify-between">
                <div className="h-8 w-8 rounded-lg bg-ui-bg-base border border-ui-border-base flex items-center justify-center text-ui-fg-subtle group-hover:text-ui-fg-interactive">
                  <BuildingStorefront className="h-4 w-4" />
                </div>
                <ArrowUpRightOnBox className="h-3.5 w-3.5 text-ui-fg-muted" />
              </div>
              <div>
                <Text size="small" weight="plus" className="text-ui-fg-base group-hover:text-ui-fg-interactive text-xs sm:text-sm">
                  Gestão de Catálogo
                </Text>
                <Text size="xsmall" className="text-ui-fg-muted text-[11px]">
                  Auditoria e filtros rápidos
                </Text>
              </div>
            </Container>
          </Link>

          <Link to="/omie-products" className="group block min-w-0">
            <Container className="p-3.5 sm:p-4 flex flex-col justify-between h-24 sm:h-28 hover:border-ui-border-interactive hover:shadow-sm transition-all">
              <div className="flex items-center justify-between">
                <div className="h-8 w-8 rounded-lg bg-ui-bg-base border border-ui-border-base flex items-center justify-center text-ui-fg-subtle group-hover:text-ui-fg-interactive">
                  <MagnifyingGlass className="h-4 w-4" />
                </div>
                <ArrowUpRightOnBox className="h-3.5 w-3.5 text-ui-fg-muted" />
              </div>
              <div>
                <Text size="small" weight="plus" className="text-ui-fg-base group-hover:text-ui-fg-interactive text-xs sm:text-sm">
                  Buscar Código Omie
                </Text>
                <Text size="xsmall" className="text-ui-fg-muted text-[11px]">
                  Consulta local e remota
                </Text>
              </div>
            </Container>
          </Link>

          <Link to="/quotes" className="group block min-w-0">
            <Container className="p-3.5 sm:p-4 flex flex-col justify-between h-24 sm:h-28 hover:border-ui-border-interactive hover:shadow-sm transition-all">
              <div className="flex items-center justify-between">
                <div className="h-8 w-8 rounded-lg bg-ui-bg-base border border-ui-border-base flex items-center justify-center text-ui-fg-subtle group-hover:text-ui-fg-interactive">
                  <DocumentText className="h-4 w-4" />
                </div>
                {metrics && metrics.pending_quotes > 0 && (
                  <Badge size="2xsmall" color="orange" className="shrink-0 text-[10px]">
                    {metrics.pending_quotes} pendente(s)
                  </Badge>
                )}
              </div>
              <div>
                <Text size="small" weight="plus" className="text-ui-fg-base group-hover:text-ui-fg-interactive text-xs sm:text-sm">
                  Cotações
                </Text>
                <Text size="xsmall" className="text-ui-fg-muted text-[11px]">
                  Orçamentos de clientes
                </Text>
              </div>
            </Container>
          </Link>

          <Link to="/product-reviews" className="group block min-w-0">
            <Container className="p-3.5 sm:p-4 flex flex-col justify-between h-24 sm:h-28 hover:border-ui-border-interactive hover:shadow-sm transition-all">
              <div className="flex items-center justify-between">
                <div className="h-8 w-8 rounded-lg bg-ui-bg-base border border-ui-border-base flex items-center justify-center text-ui-fg-subtle group-hover:text-ui-fg-interactive">
                  <Star className="h-4 w-4" />
                </div>
                {metrics && metrics.pending_reviews > 0 && (
                  <Badge size="2xsmall" color="orange" className="shrink-0 text-[10px]">
                    {metrics.pending_reviews} nova(s)
                  </Badge>
                )}
              </div>
              <div>
                <Text size="small" weight="plus" className="text-ui-fg-base group-hover:text-ui-fg-interactive text-xs sm:text-sm">
                  Avaliações
                </Text>
                <Text size="xsmall" className="text-ui-fg-muted text-[11px]">
                  Moderação de reviews
                </Text>
              </div>
            </Container>
          </Link>
        </div>
      </div>

      {/* Indicadores Principais */}
      <div className="w-full min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-3">
          <Heading level="h2" className="text-xs sm:text-sm font-semibold text-ui-fg-base uppercase tracking-wider">
            Métricas Comerciais Reais
          </Heading>
          {metrics?.last_updated && (
            <Text size="xsmall" className="text-ui-fg-muted">
              Última sincronização: {new Date(metrics.last_updated).toLocaleTimeString("pt-BR")}
            </Text>
          )}
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
            {Array.from({ length: 4 }).map((_, i) => (
              <Container key={i} className="p-4 sm:p-5 animate-pulse">
                <div className="h-4 w-24 bg-ui-bg-subtle-hover rounded mb-3" />
                <div className="h-8 w-16 bg-ui-bg-subtle-hover rounded" />
              </Container>
            ))}
          </div>
        )}

        {metrics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
            <Link to="/catalog?filter=all" className="group block min-w-0">
              <Container className="p-4 sm:p-5 transition-all hover:border-ui-border-interactive hover:shadow-sm">
                <Text size="xsmall" className="text-ui-fg-subtle uppercase tracking-wider font-medium">
                  Catálogo Total
                </Text>
                <div className="flex items-baseline justify-between gap-2 mt-2">
                  <Text size="xlarge" weight="plus" className="text-ui-fg-base text-2xl sm:text-3xl group-hover:text-ui-fg-interactive">
                    {metrics.total.toLocaleString("pt-BR")}
                  </Text>
                  <Badge size="small" color="blue" className="shrink-0">
                    {metrics.published} ativos
                  </Badge>
                </div>
                <Text size="xsmall" className="text-ui-fg-muted mt-2">
                  Produtos cadastrados na base Medusa
                </Text>
              </Container>
            </Link>

            <Link to="/catalog?filter=has_omie" className="group block min-w-0">
              <Container className="p-4 sm:p-5 transition-all hover:border-ui-border-interactive hover:shadow-sm">
                <Text size="xsmall" className="text-ui-fg-subtle uppercase tracking-wider font-medium">
                  Integração Omie
                </Text>
                <div className="flex items-baseline justify-between gap-2 mt-2">
                  <Text size="xlarge" weight="plus" className="text-ui-fg-base text-2xl sm:text-3xl group-hover:text-ui-fg-interactive">
                    {metrics.omie_linked.toLocaleString("pt-BR")}
                  </Text>
                  <Badge size="small" color="green" className="shrink-0">
                    {Math.round((metrics.omie_linked / Math.max(1, metrics.total)) * 100)}%
                  </Badge>
                </div>
                <Text size="xsmall" className="text-ui-fg-muted mt-2">
                  Produtos com código Omie vinculado
                </Text>
              </Container>
            </Link>

            <Link to="/catalog?filter=quote_only" className="group block min-w-0">
              <Container className="p-4 sm:p-5 transition-all hover:border-ui-border-interactive hover:shadow-sm">
                <Text size="xsmall" className="text-ui-fg-subtle uppercase tracking-wider font-medium">
                  Sob Consulta / Cotação
                </Text>
                <div className="flex items-baseline justify-between gap-2 mt-2">
                  <Text size="xlarge" weight="plus" className="text-ui-fg-base text-2xl sm:text-3xl group-hover:text-ui-fg-interactive">
                    {metrics.quote_only.toLocaleString("pt-BR")}
                  </Text>
                  <Badge size="small" color="orange" className="shrink-0">
                    WhatsApp
                  </Badge>
                </div>
                <Text size="xsmall" className="text-ui-fg-muted mt-2">
                  Atendimento consultivo direto
                </Text>
              </Container>
            </Link>

            <Link to="/catalog?filter=has_stock" className="group block min-w-0">
              <Container className="p-4 sm:p-5 transition-all hover:border-ui-border-interactive hover:shadow-sm">
                <Text size="xsmall" className="text-ui-fg-subtle uppercase tracking-wider font-medium">
                  Disponibilidade
                </Text>
                <div className="flex items-baseline justify-between gap-2 mt-2">
                  <Text size="xlarge" weight="plus" className="text-ui-fg-base text-2xl sm:text-3xl group-hover:text-ui-fg-interactive">
                    {(metrics.total - metrics.no_stock).toLocaleString("pt-BR")}
                  </Text>
                  <Badge size="small" color="green" className="shrink-0">
                    Com Estoque
                  </Badge>
                </div>
                <Text size="xsmall" className="text-ui-fg-muted mt-2">
                  {metrics.no_stock} itens com estoque zerado
                </Text>
              </Container>
            </Link>
          </div>
        )}
      </div>

      {/* Bloco de Alertas Operacionais */}
      <div className="w-full min-w-0">
        <Heading level="h2" className="text-xs sm:text-sm font-semibold text-ui-fg-base uppercase tracking-wider mb-3">
          Alertas e Qualidade Cadastral
        </Heading>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 w-full">
          {/* Card Alertas de Imagem e Preço */}
          <Container className="p-4 sm:p-5 flex flex-col justify-between min-w-0">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ExclamationCircle className="h-5 w-5 text-ui-fg-warning shrink-0" />
                <Heading level="h3" className="text-sm sm:text-base font-semibold text-ui-fg-base break-words">
                  Cadastros com Pendências no Catálogo
                </Heading>
              </div>
              <Text size="small" className="text-ui-fg-subtle mb-4 text-xs sm:text-sm">
                Identificação imediata de produtos que precisam de atenção visual ou comercial antes de publicação.
              </Text>

              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2 border-b border-ui-border-base">
                  <Text size="small" className="text-ui-fg-base text-xs sm:text-sm">
                    Produtos sem imagem cadastrada
                  </Text>
                  <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
                    <Text size="small" weight="plus" className={`text-xs sm:text-sm ${metrics && metrics.no_image > 0 ? "text-ui-fg-warning" : "text-ui-fg-base"}`}>
                      {metrics ? metrics.no_image : "..."}
                    </Text>
                    <Link to="/catalog?filter=no_image">
                      <Button size="small" variant="secondary">Filtrar</Button>
                    </Link>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2 border-b border-ui-border-base">
                  <Text size="small" className="text-ui-fg-base text-xs sm:text-sm">
                    Produtos sem preço configurado
                  </Text>
                  <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
                    <Text size="small" weight="plus" className={`text-xs sm:text-sm ${metrics && metrics.no_price > 0 ? "text-ui-fg-warning" : "text-ui-fg-base"}`}>
                      {metrics ? metrics.no_price : "..."}
                    </Text>
                    <Link to="/catalog?filter=no_price">
                      <Button size="small" variant="secondary">Filtrar</Button>
                    </Link>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2">
                  <Text size="small" className="text-ui-fg-base text-xs sm:text-sm">
                    Produtos sem vínculo Omie
                  </Text>
                  <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
                    <Text size="small" weight="plus" className={`text-xs sm:text-sm ${metrics && metrics.omie_pending > 0 ? "text-ui-fg-warning" : "text-ui-fg-base"}`}>
                      {metrics ? metrics.omie_pending : "..."}
                    </Text>
                    <Link to="/catalog?filter=no_omie">
                      <Button size="small" variant="secondary">Filtrar</Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-ui-border-base flex justify-end">
              <Link to="/catalog">
                <Button size="small" variant="transparent" className="text-ui-fg-interactive text-xs sm:text-sm">
                  Abrir Gestão de Catálogo completa →
                </Button>
              </Link>
            </div>
          </Container>

          {/* Card Atendimento Comercial */}
          <Container className="p-4 sm:p-5 flex flex-col justify-between min-w-0">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="h-5 w-5 text-ui-fg-interactive shrink-0" />
                <Heading level="h3" className="text-sm sm:text-base font-semibold text-ui-fg-base break-words">
                  Fila de Atendimento e Clientes
                </Heading>
              </div>
              <Text size="small" className="text-ui-fg-subtle mb-4 text-xs sm:text-sm">
                Monitoramento do fluxo comercial via orçamentos, cotações e empresas cadastradas.
              </Text>

              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2 border-b border-ui-border-base">
                  <Text size="small" className="text-ui-fg-base text-xs sm:text-sm">
                    Cotações em aberto
                  </Text>
                  <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
                    <Badge color={metrics && metrics.pending_quotes > 0 ? "orange" : "green"} className="text-xs">
                      {metrics ? metrics.pending_quotes : 0} pendente(s)
                    </Badge>
                    <Link to="/quotes">
                      <Button size="small" variant="secondary">Abrir</Button>
                    </Link>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2 border-b border-ui-border-base">
                  <Text size="small" className="text-ui-fg-base text-xs sm:text-sm">
                    Avaliações aguardando moderação
                  </Text>
                  <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
                    <Badge color={metrics && metrics.pending_reviews > 0 ? "orange" : "green"} className="text-xs">
                      {metrics ? metrics.pending_reviews : 0} pendente(s)
                    </Badge>
                    <Link to="/product-reviews">
                      <Button size="small" variant="secondary">Moderar</Button>
                    </Link>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2">
                  <Text size="small" className="text-ui-fg-base text-xs sm:text-sm">
                    Modo operacional da loja
                  </Text>
                  <Badge color="blue" className="text-xs self-start sm:self-auto">Catálogo + WhatsApp</Badge>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-ui-border-base flex justify-end">
              <Link to="/quotes">
                <Button size="small" variant="transparent" className="text-ui-fg-interactive text-xs sm:text-sm">
                  Gerenciar cotações →
                </Button>
              </Link>
            </div>
          </Container>
        </div>
      </div>
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Visão Geral FriggaFrio",
  icon: ChartBar,
  rank: 0,
})

export default OverviewDashboardPage
