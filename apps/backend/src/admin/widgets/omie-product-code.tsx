import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Button, Container, Heading, Input, StatusBadge, Text, toast } from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useParams } from "react-router-dom"
import { useState } from "react"
import { sdk } from "../lib/client"

type Link = { id: string; code_display: string; variant_id?: string | null; source?: string }
type Response = { links: Link[] }

const OmieProductCode = () => {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const [code, setCode] = useState("")
  const [editing, setEditing] = useState(false)
  const links = useQuery({ queryKey: ["frigga-omie-links", id], enabled: Boolean(id), queryFn: () => sdk.client.fetch<Response>(`/admin/omie/products/${id}/code`) })
  const save = useMutation({ mutationFn: () => sdk.client.fetch(`/admin/omie/products/${id}/code`, { method: links.data?.links.length ? "PATCH" : "POST", body: links.data?.links.length ? { link_id: links.data.links[0].id, code } : { code } }), onSuccess: () => { toast.success("Codigo FriggaFrio / Omie salvo com sucesso."); setEditing(false); queryClient.invalidateQueries({ queryKey: ["frigga-omie-links", id] }) }, onError: (error) => toast.error(error instanceof Error ? error.message : "Nao foi possivel salvar o codigo. Tente novamente.") })
  const remove = useMutation({ mutationFn: () => sdk.client.fetch(`/admin/omie/products/${id}/code?link_id=${links.data?.links[0]?.id}`, { method: "DELETE" }), onSuccess: () => { toast.success("Codigo removido."); setCode(""); queryClient.invalidateQueries({ queryKey: ["frigga-omie-links", id] }) }, onError: () => toast.error("Nao foi possivel remover o codigo.") })
  const current = links.data?.links[0]
  if (!id) return null
  return <Container className="my-4" data-testid="frigga-omie-product-code"><div className="flex items-center justify-between"><div><Heading level="h2">Integracao FriggaFrio / Omie</Heading><Text size="small" className="text-ui-fg-subtle">Codigo administrativo privado, visivel apenas no Admin.</Text></div><StatusBadge color={current ? "green" : "grey"}>{current ? "Vinculado" : "Nao vinculado"}</StatusBadge></div><div className="mt-3 flex max-w-xl gap-2"><Input aria-label="Codigo FriggaFrio / Omie" value={editing || !current ? code : current.code_display} onChange={(event) => { setCode(event.target.value); setEditing(true) }} placeholder="Ex.: DPGS1347" disabled={save.isPending || remove.isPending} /><Button onClick={() => save.mutate()} disabled={save.isPending || remove.isPending || !code.trim()} isLoading={save.isPending}>Salvar</Button>{current && <Button variant="secondary" onClick={() => remove.mutate()} disabled={save.isPending || remove.isPending} isLoading={remove.isPending}>Remover</Button>}</div>{current && <Text size="small" className="mt-2">Origem: {current.source ?? "manual"}{current.variant_id ? ` | Variante: ${current.variant_id}` : ""}</Text>}</Container>
}

export const config = defineWidgetConfig({ zone: "product.details.before", id: "friggafrio.omie-product-code" })
export default OmieProductCode
