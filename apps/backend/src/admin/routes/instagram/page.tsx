import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Badge, Button, Text, toast } from "@medusajs/ui"
import { Camera, ArrowPath, Eye, EyeSlash, ArrowUpRightOnBox } from "@medusajs/icons"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { sdk } from "../../lib/client"
import { BrandHeader } from "../../components/brand-header"

interface InstagramPostItem {
  id: string
  instagram_id: string
  caption: string | null
  media_type: string
  media_url: string
  thumbnail_url: string | null
  permalink: string
  timestamp: string | null
  is_hidden: boolean
}

interface InstagramAdminResponse {
  configured: boolean
  masked_token: string | null
  sync_state: {
    last_sync_at: string | null
    last_sync_status: string
    last_error_message: string | null
    posts_count: number
  }
  posts: InstagramPostItem[]
  count: number
}

const InstagramFeedAdminPage = () => {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery<InstagramAdminResponse>({
    queryKey: ["admin-instagram-feed"],
    queryFn: () => sdk.client.fetch<InstagramAdminResponse>("/admin/instagram-feed"),
  })

  const syncMutation = useMutation({
    mutationFn: () =>
      sdk.client.fetch("/admin/instagram-feed", {
        method: "POST",
      }),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["admin-instagram-feed"] })
      if (res?.success) {
        toast.success(`Sincronização concluída! ${res.synced_count} publicações atualizadas.`)
      } else {
        toast.error(`Aviso na sincronização: ${res?.error || "Verifique as credenciais da Meta."}`)
      }
    },
    onError: (err: any) => {
      toast.error(`Falha ao sincronizar: ${err?.message || "Erro desconhecido"}`)
    },
  })

  const toggleHideMutation = useMutation({
    mutationFn: (id: string) =>
      sdk.client.fetch(`/admin/instagram-feed/posts/${id}/toggle-hide`, {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-instagram-feed"] })
      toast.success("Visibilidade da publicação atualizada.")
    },
    onError: () => {
      toast.error("Não foi possível atualizar a visibilidade.")
    },
  })

  const syncState = data?.sync_state
  const isConfigured = Boolean(data?.configured)
  const posts = data?.posts || []

  return (
    <div className="flex flex-col gap-y-4">
      <BrandHeader
        title="Instagram FriggaFrio"
        subtitle="Gerenciamento do feed oficial do Instagram (@frigga.frio) na página inicial."
        badgeText={isConfigured ? "Meta API Conectada" : "Feed Ativo via SnapWidget"}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Container className="p-4 flex flex-col gap-1">
          <Text size="small" className="text-ui-fg-muted font-medium">Status da Integração</Text>
          <div className="flex items-center gap-2">
            <Badge color={isConfigured ? "green" : "blue"}>
              {isConfigured ? "Meta Graph API" : "SnapWidget Oficial (@frigga.frio)"}
            </Badge>
            {data?.masked_token && (
              <span className="font-mono text-xs text-ui-fg-subtle">{data.masked_token}</span>
            )}
          </div>
        </Container>

        <Container className="p-4 flex flex-col gap-1">
          <Text size="small" className="text-ui-fg-muted font-medium">Última Sincronização</Text>
          <Text className="font-semibold text-ui-fg-base">
            {syncState?.last_sync_at
              ? new Date(syncState.last_sync_at).toLocaleString("pt-BR")
              : "Nenhuma ainda"}
          </Text>
        </Container>

        <Container className="p-4 flex flex-col gap-1">
          <Text size="small" className="text-ui-fg-muted font-medium">Publicações no Feed</Text>
          <Text className="font-semibold text-ui-fg-base text-xl">
            {posts.length} <span className="text-xs font-normal text-ui-fg-muted">publicações</span>
          </Text>
        </Container>

        <Container className="p-4 flex flex-col justify-center items-start">
          <Button
            variant="primary"
            size="small"
            className="w-full flex items-center justify-center gap-2"
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending || !isConfigured}
          >
            <ArrowPath className={`h-4 w-4 ${syncMutation.isPending ? "animate-spin" : ""}`} />
            {syncMutation.isPending ? "Sincronizando..." : "Atualizar agora"}
          </Button>
        </Container>
      </div>

      <Container className="p-6">
        <div className="flex items-center justify-between pb-4 border-b border-ui-border-base">
          <div>
            <Heading level="h2">Publicações Sincronizadas</Heading>
            <Text size="small" className="text-ui-fg-muted">
              Publicações ativas no feed da Home. Use o botão para ocultar ou exibir cards no site.
            </Text>
          </div>
          <a
            href="https://www.instagram.com/frigga.frio/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-ui-fg-interactive hover:underline"
          >
            Ver perfil @frigga.frio <ArrowUpRightOnBox className="h-3.5 w-3.5" />
          </a>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-ui-fg-muted">Carregando feed do Instagram...</div>
        ) : posts.length === 0 ? (
          <div className="py-12 text-center flex flex-col items-center gap-2">
            <Camera className="h-10 w-10 text-ui-fg-muted opacity-40" />
            <Text className="font-medium text-ui-fg-base">Nenhuma publicação sincronizada no momento.</Text>
            <Text size="small" className="text-ui-fg-muted max-w-md">
              {isConfigured
                ? "Clique em 'Atualizar agora' para buscar as publicações mais recentes da conta oficial."
                : "Defina INSTAGRAM_ACCESS_TOKEN nas variáveis de ambiente do backend para habilitar a sincronização automática."}
            </Text>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pt-4">
            {posts.map((post) => {
              const displayImg = post.thumbnail_url || post.media_url
              return (
                <div
                  key={post.id}
                  className={`border rounded-lg overflow-hidden flex flex-col transition-all bg-ui-bg-subtle ${
                    post.is_hidden ? "opacity-50 border-ui-border-base" : "border-ui-border-strong shadow-xs"
                  }`}
                >
                  <div className="relative aspect-square w-full bg-ui-bg-component overflow-hidden">
                    <img
                      src={displayImg}
                      alt={post.caption || "Publicação Instagram FriggaFrio"}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute top-2 left-2 flex gap-1">
                      <Badge size="xsmall" color={post.media_type === "VIDEO" ? "blue" : "grey"}>
                        {post.media_type}
                      </Badge>
                      {post.is_hidden && (
                        <Badge size="xsmall" color="red">
                          Oculta no site
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="p-3 flex flex-col flex-1 justify-between gap-3">
                    <Text size="small" className="text-ui-fg-subtle line-clamp-3">
                      {post.caption || "Sem legenda"}
                    </Text>

                    <div className="flex items-center justify-between pt-2 border-t border-ui-border-base">
                      <a
                        href={post.permalink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-ui-fg-interactive inline-flex items-center gap-1 hover:underline"
                      >
                        Abrir <ArrowUpRightOnBox className="h-3 w-3" />
                      </a>

                      <Button
                        size="small"
                        variant={post.is_hidden ? "primary" : "secondary"}
                        onClick={() => toggleHideMutation.mutate(post.id)}
                        disabled={toggleHideMutation.isPending}
                        className="flex items-center gap-1 text-xs"
                      >
                        {post.is_hidden ? (
                          <>
                            <Eye className="h-3.5 w-3.5" /> Exibir
                          </>
                        ) : (
                          <>
                            <EyeSlash className="h-3.5 w-3.5" /> Ocultar
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Container>
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Instagram FriggaFrio",
  icon: Camera,
  rank: 6,
})

export default InstagramFeedAdminPage
