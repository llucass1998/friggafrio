import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Button, Container, Heading, Input, StatusBadge, Text, Copy, toast, Badge } from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useParams } from "react-router-dom"
import { useState, useEffect } from "react"
import { sdk } from "../lib/client"

type Link = { id: string; code_display: string; variant_id?: string | null; source?: string }
type Response = { links: Link[] }

const CODE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._/-]{0,99}$/

const OmieProductCode = () => {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const [code, setCode] = useState("")
  const [editing, setEditing] = useState(false)

  const links = useQuery({
    queryKey: ["frigga-omie-links", id],
    enabled: Boolean(id),
    queryFn: () => sdk.client.fetch<Response>(`/admin/omie/products/${id}/code`),
  })

  const current = links.data?.links?.[0]

  useEffect(() => {
    if (current && !editing) {
      setCode(current.code_display)
    }
  }, [current, editing])

  const save = useMutation({
    mutationFn: () => {
      const normalized = code.trim().toUpperCase()
      if (!normalized || !CODE_PATTERN.test(normalized)) {
        throw new Error("Código FriggaFrio / Omie inválido. Use letras, números e traço.")
      }
      return sdk.client.fetch(`/admin/omie/products/${id}/code`, {
        method: links.data?.links.length ? "PATCH" : "POST",
        body: links.data?.links.length
          ? { link_id: links.data.links[0].id, code: normalized }
          : { code: normalized },
      })
    },
    onSuccess: () => {
      toast.success("Código FriggaFrio / Omie salvo com sucesso.")
      setEditing(false)
      queryClient.invalidateQueries({ queryKey: ["frigga-omie-links", id] })
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar o código. Tente novamente.")
    },
  })

  const remove = useMutation({
    mutationFn: () =>
      sdk.client.fetch(`/admin/omie/products/${id}/code?link_id=${links.data?.links[0]?.id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      toast.success("Código removido com sucesso.")
      setCode("")
      setEditing(false)
      queryClient.invalidateQueries({ queryKey: ["frigga-omie-links", id] })
    },
    onError: () => toast.error("Não foi possível remover o código."),
  })

  if (!id) return null

  return (
    <Container className="my-4 border border-ui-border-base" data-testid="frigga-omie-product-code">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-ui-border-base">
        <div>
          <Heading level="h2" className="text-base font-semibold text-ui-fg-base">
            Integração FriggaFrio / Omie
          </Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Código administrativo privado vinculado a este produto no ERP.
          </Text>
        </div>
        <div className="flex items-center gap-2">
          {current && (
            <Badge color="blue" size="small" className="font-mono">
              {current.code_display}
            </Badge>
          )}
          <StatusBadge color={current ? "green" : "grey"}>
            {current ? "Vinculado" : "Não vinculado"}
          </StatusBadge>
        </div>
      </div>

      <div className="mt-4 flex flex-col sm:flex-row gap-2 max-w-xl">
        <Input
          aria-label="Código FriggaFrio / Omie"
          value={code}
          onChange={(event) => {
            setCode(event.target.value.toUpperCase())
            setEditing(true)
          }}
          placeholder="Ex.: DPGS1347"
          disabled={save.isPending || remove.isPending}
          className="font-mono"
        />
        <div className="flex items-center gap-2">
          <Button
            onClick={() => save.mutate()}
            disabled={save.isPending || remove.isPending || !code.trim()}
            isLoading={save.isPending}
          >
            Salvar
          </Button>
          {current && (
            <>
              <Copy content={current.code_display} className="text-ui-fg-muted" />
              <Button
                variant="secondary"
                onClick={() => remove.mutate()}
                disabled={save.isPending || remove.isPending}
                isLoading={remove.isPending}
              >
                Remover
              </Button>
            </>
          )}
        </div>
      </div>

      {current && (
        <div className="mt-3 flex items-center gap-3 text-ui-fg-muted text-xs">
          <span>Origem: {current.source ?? "manual"}</span>
          {current.variant_id && <span>Variante: {current.variant_id}</span>}
        </div>
      )}
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details",
  id: "friggafrio.omie-product-code",
})

export default OmieProductCode
