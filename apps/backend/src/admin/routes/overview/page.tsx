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
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto">
      {/* Brand Header */}
      <BrandHeader
        title="Visão Geral FriggaFrio"
        subtitle="Painel de controle operacional, métricas de catálogo e alertas do sistema."
        badgeText="Dashboard Operacional"
      >
        <Link to="/catalog">
          <Button size="small" variant="secondary" className="gap-2">
            <BuildingStorefront className="h-4 w-4" />
            Ir para Catálogo
          </Button>
        </Link>
      </BrandHeader>

      {/* Bloco de Ações Rápidas */}
      <div>
        <Heading level="h2" className="text-sm font-semibold text-ui-fg-base uppercase tracking-wider mb-3">
          Ações Rápidas
        </Heading>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <Link to="/products" className="group">
            <Container className="p-4 flex flex-col justify-between h-28 hover:border-ui-border-interactive hover:shadow-sm transition-all">
              <div className="flex items-center justify-between">
                <div className="h-8 w-8 rounded-lg bg-ui-bg-base border border-ui-border-base flex items-center justify-center text-ui-fg-subtle group-hover:text-ui-fg-interactive">
                  <Plus className="h-4 w-4" />
                </div>
                <ArrowUpRightOnBox className="h-3.5 w-3.5 text-ui-fg-muted" />
              </div>
              <div>
                <Text size="small" weight="plus" className="text-ui-fg-base group-hover:text-ui-fg-interactive">
                  Cadastrar Produto
                </Text>
                <Text size="xsmall" className="text-ui-fg-muted">
                  Painel nativo Medusa
                </Text>
              </div>
            </Container>
          </Link>

          <Link to="/catalog" className="group">
            <Container className="p-4 flex flex-col justify-between h-28 hover:border-ui-border-interactive hover:shadow-sm transition-all">
              <div className="flex items-center justify-between">
                <div className="h-8 w-8 rounded-lg bg-ui-bg-base border border-ui-border-base flex items-center justify-center text-ui-fg-subtle group-hover:text-ui-fg-interactive">
                  <BuildingStorefront className="h-4 w-4" />
                </div>
                <ArrowUpRightOnBox className="h-3.5 w-3.5 text-ui-fg-muted" />
              </div>
              <div>
                <Text size="small" weight="plus" className="text-ui-fg-base group-hover:text-ui-fg-interactive">
                  Gestão de Catálogo
                </Text>
                <Text size="xsmall" className="text-ui-fg-muted">
                  Auditoria e filtros rápidos
                </Text>
              </div>
            </Container>
          </Link>

          <Link to="/omie-products" className="group">
            <Container className="p-4 flex flex-col justify-between h-28 hover:border-ui-border-interactive hover:shadow-sm transition-all">
              <div className="flex items-center justify-between">
                <div className="h-8 w-8 rounded-lg bg-ui-bg-base border border-ui-border-base flex items-center justify-center text-ui-fg-subtle group-hover:text-ui-fg-interactive">
                  <MagnifyingGlass className="h-4 w-4" />
                </div>
                <ArrowUpRightOnBox className="h-3.5 w-3.5 text-ui-fg-muted" />
              </div>
              <div>
                <Text size="small" weight="plus" className="text-ui-fg-base group-hover:text-ui-fg-interactive">
                  Buscar Código Omie
                </Text>
                <Text size="xsmall" className="text-ui-fg-muted">
                  Consulta local e remota
                </Text>
              </div>
            </Container>
          </Link>

          <Link to="/quotes" className="group">
            <Container className="p-4 flex flex-col justify-between h-28 hover:border-ui-border-interactive hover:shadow-sm transition-all">
              <div className="flex items-center justify-between">
                <div className="h-8 w-8 rounded-lg bg-ui-bg-base border border-ui-border-base flex items-center justify-center text-ui-fg-subtle group-hover:text-ui-fg-interactive">
                  <DocumentText className="h-4 w-4" />
                </div>
                {metrics && metrics.pending_quotes > 0 && (
                  <Badge size="2xsmall" color="orange">
                    {metrics.pending_quotes} pendente(s)
                  </Badge>
                )}
              </div>
              <div>
                <Text size="small" weight="plus" className="text-ui-fg-base group-hover:text-ui-fg-interactive">
                  Cotações
                </Text>
                <Text size="xsmall" className="text-ui-fg-muted">
                  Orçamentos de clientes
                </Text>
              </div>
            </Container>
          </Link>

          <Link to="/product-reviews" className="group">
            <Container className="p-4 flex flex-col justify-between h-28 hover:border-ui-border-interactive hover:shadow-sm transition-all">
              <div className="flex items-center justify-between">
                <div className="h-8 w-8 rounded-lg bg-ui-bg-base border border-ui-border-base flex items-center justify-center text-ui-fg-subtle group-hover:text-ui-fg-interactive">
                  <Star className="h-4 w-4" />
                </div>
                {metrics && metrics.pending_reviews > 0 && (
                  <Badge size="2xsmall" color="orange">
                    {metrics.pending_reviews} nova(s)
                  </Badge>
                )}
              </div>
              <div>
                <Text size="small" weight="plus" className="text-ui-fg-base group-hover:text-ui-fg-interactive">
                  Avaliações
                </Text>
                <Text size="xsmall" className="text-ui-fg-muted">
                  Moderação de reviews
                </Text>
              </div>
            </Container>
          </Link>
        </div>
      </div>

      {/* Indicadores Principais */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <Heading level="h2" className="text-sm font-semibold text-ui-fg-base uppercase tracking-wider">
            Métricas Comerciais Reais
          </Heading>
          {metrics?.last_updated && (
            <Text size="xsmall" className="text-ui-fg-muted">
              Última sincronização: {new Date(metrics.last_updated).toLocaleTimeString("pt-BR")}
            </Text>
          )}
        </div>

        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Container key={i} className="p-5 animate-pulse">
                <div className="h-4 w-24 bg-ui-bg-subtle-hover rounded mb-3" />
                <div className="h-8 w-16 bg-ui-bg-subtle-hover rounded" />
              </Container>
            ))}
          </div>
        )}

        {metrics && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Link to="/catalog?filter=all" className="group block">
              <Container className="p-5 transition-all hover:border-ui-border-interactive hover:shadow-sm">
                <Text size="xsmall" className="text-ui-fg-subtle uppercase tracking-wider font-medium">
                  Catálogo Total
                </Text>
                <div className="flex items-baseline justify-between mt-2">
                  <Text size="xlarge" weight="plus" className="text-ui-fg-base text-2xl sm:text-3xl group-hover:text-ui-fg-interactive">
                    {metrics.total.toLocaleString("pt-BR")}
                  </Text>
                  <Badge size="small" color="blue">
                    {metrics.published} ativos
                  </Badge>
                </div>
                <Text size="xsmall" className="text-ui-fg-muted mt-2">
                  Produtos cadastrados na base Medusa
                </Text>
              </Container>
            </Link>

            <Link to="/catalog?filter=has_omie" className="group block">
              <Container className="p-5 transition-all hover:border-ui-border-interactive hover:shadow-sm">
                <Text size="xsmall" className="text-ui-fg-subtle uppercase tracking-wider font-medium">
                  Integração Omie
                </Text>
                <div className="flex items-baseline justify-between mt-2">
                  <Text size="xlarge" weight="plus" className="text-ui-fg-base text-2xl sm:text-3xl group-hover:text-ui-fg-interactive">
                    {metrics.omie_linked.toLocaleString("pt-BR")}
                  </Text>
                  <Badge size="small" color="green">
                    {Math.round((metrics.omie_linked / Math.max(1, metrics.total)) * 100)}%
                  </Badge>
                </div>
                <Text size="xsmall" className="text-ui-fg-muted mt-2">
                  Produtos com código Omie vinculado
                </Text>
              </Container>
            </Link>

            <Link to="/catalog?filter=quote_only" className="group block">
              <Container className="p-5 transition-all hover:border-ui-border-interactive hover:shadow-sm">
                <Text size="xsmall" className="text-ui-fg-subtle uppercase tracking-wider font-medium">
                  Sob Consulta / Cotação
                </Text>
                <div className="flex items-baseline justify-between mt-2">
                  <Text size="xlarge" weight="plus" className="text-ui-fg-base text-2xl sm:text-3xl group-hover:text-ui-fg-interactive">
                    {metrics.quote_only.toLocaleString("pt-BR")}
                  </Text>
                  <Badge size="small" color="orange">
                    WhatsApp
                  </Badge>
                </div>
                <Text size="xsmall" className="text-ui-fg-muted mt-2">
                  Atendimento consultivo direto
                </Text>
              </Container>
            </Link>

            <Link to="/catalog?filter=has_stock" className="group block">
              <Container className="p-5 transition-all hover:border-ui-border-interactive hover:shadow-sm">
                <Text size="xsmall" className="text-ui-fg-subtle uppercase tracking-wider font-medium">
                  Disponibilidade
                </Text>
                <div className="flex items-baseline justify-between mt-2">
                  <Text size="xlarge" weight="plus" className="text-ui-fg-base text-2xl sm:text-3xl group-hover:text-ui-fg-interactive">
                    {(metrics.total - metrics.no_stock).toLocaleString("pt-BR")}
                  </Text>
                  <Badge size="small" color="green">
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
      <div>
        <Heading level="h2" className="text-sm font-semibold text-ui-fg-base uppercase tracking-wider mb-3">
          Alertas e Qualidade Cadastral
        </Heading>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card Alertas de Imagem e Preço */}
          <Container className="p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ExclamationCircle className="h-5 w-5 text-ui-fg-warning" />
                <Heading level="h3" className="text-base font-semibold text-ui-fg-base">
                  Cadastros com Pendências no Catálogo
                </Heading>
              </div>
              <Text size="small" className="text-ui-fg-subtle mb-4">
                Identificação imediata de produtos que precisam de atenção visual ou comercial antes de publicação.
              </Text>

              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-ui-border-base">
                  <Text size="small" className="text-ui-fg-base">
                    Produtos sem imagem cadastrada
                  </Text>
                  <div className="flex items-center gap-2">
                    <Text size="small" weight="plus" className={metrics && metrics.no_image > 0 ? "text-ui-fg-warning" : "text-ui-fg-base"}>
                      {metrics ? metrics.no_image : "..."}
                    </Text>
                    <Link to="/catalog?filter=no_image">
                      <Button size="small" variant="secondary">Filtrar</Button>
                    </Link>
                  </div>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-ui-border-base">
                  <Text size="small" className="text-ui-fg-base">
                    Produtos sem preço configurado
                  </Text>
                  <div className="flex items-center gap-2">
                    <Text size="small" weight="plus" className={metrics && metrics.no_price > 0 ? "text-ui-fg-warning" : "text-ui-fg-base"}>
                      {metrics ? metrics.no_price : "..."}
                    </Text>
                    <Link to="/catalog?filter=no_price">
                      <Button size="small" variant="secondary">Filtrar</Button>
                    </Link>
                  </div>
                </div>

                <div className="flex items-center justify-between py-2">
                  <Text size="small" className="text-ui-fg-base">
                    Produtos sem vínculo Omie
                  </Text>
                  <div className="flex items-center gap-2">
                    <Text size="small" weight="plus" className={metrics && metrics.omie_pending > 0 ? "text-ui-fg-warning" : "text-ui-fg-base"}>
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
                <Button size="small" variant="transparent" className="text-ui-fg-interactive">
                  Abrir Gestão de Catálogo completa →
                </Button>
              </Link>
            </div>
          </Container>

          {/* Card Atendimento Comercial */}
          <Container className="p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="h-5 w-5 text-ui-fg-interactive" />
                <Heading level="h3" className="text-base font-semibold text-ui-fg-base">
                  Fila de Atendimento e Clientes
                </Heading>
              </div>
              <Text size="small" className="text-ui-fg-subtle mb-4">
                Monitoramento do fluxo comercial via orçamentos, cotações e empresas cadastradas.
              </Text>

              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-ui-border-base">
                  <Text size="small" className="text-ui-fg-base">
                    Cotações em aberto
                  </Text>
                  <div className="flex items-center gap-2">
                    <Badge color={metrics && metrics.pending_quotes > 0 ? "orange" : "green"}>
                      {metrics ? metrics.pending_quotes : 0} pendente(s)
                    </Badge>
                    <Link to="/quotes">
                      <Button size="small" variant="secondary">Abrir</Button>
                    </Link>
                  </div>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-ui-border-base">
                  <Text size="small" className="text-ui-fg-base">
                    Avaliações aguardando moderação
                  </Text>
                  <div className="flex items-center gap-2">
                    <Badge color={metrics && metrics.pending_reviews > 0 ? "orange" : "green"}>
                      {metrics ? metrics.pending_reviews : 0} pendente(s)
                    </Badge>
                    <Link to="/product-reviews">
                      <Button size="small" variant="secondary">Moderar</Button>
                    </Link>
                  </div>
                </div>

                <div className="flex items-center justify-between py-2">
                  <Text size="small" className="text-ui-fg-base">
                    Modo operacional da loja
                  </Text>
                  <Badge color="blue">Catálogo + WhatsApp</Badge>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-ui-border-base flex justify-end">
              <Link to="/quotes">
                <Button size="small" variant="transparent" className="text-ui-fg-interactive">
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
