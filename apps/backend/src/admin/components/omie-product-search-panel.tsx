import { useMutation } from "@tanstack/react-query"
import { Button, Heading, Input, StatusBadge, Text, toast } from "@medusajs/ui"
import { MagnifyingGlass } from "@medusajs/icons"
import { useState } from "react"
import { Link } from "react-router-dom"

import { sdk } from "../lib/client"

type OmieSearchResult = {
  query?: string
  found: boolean
  results: Array<{
    source: "Medusa" | "Omie" | "Medusa + Omie"
    code: string | null
    sku: string | null
    medusa_product_id?: string | null
    title?: string | null
    inventory_quantity?: number | null
    status?: string | null
    medusa_variant_id?: string | null
    linked?: boolean
  }>
  local?: { count: number }
  omie?: { status: string; count: number; consulted: boolean }
}

const CODE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._/-]{0,99}$/

export const OmieProductSearchPanel = () => {
  const [code, setCode] = useState("")
  const [result, setResult] = useState<OmieSearchResult | null>(null)
  const search = useMutation({
    mutationFn: (value: string) => sdk.client.fetch<OmieSearchResult>(
      "/admin/omie/products/search",
      { query: { code: value } },
    ),
    onSuccess: setResult,
    onError: (error) => {
      setResult(null)
      toast.error(error instanceof Error ? error.message : "Nao foi possivel consultar a Omie agora. Tente novamente.")
    },
  })

  const submit = () => {
    const normalized = code.trim()
    if (!normalized || !CODE_PATTERN.test(normalized)) {
      toast.error("Informe um codigo Omie valido")
      return
    }
    search.mutate(normalized)
  }

  const clear = () => {
    setCode("")
    setResult(null)
    search.reset()
  }

  return (
    <div className="flex flex-col gap-4" data-testid="omie-product-search">
      <div>
        <Heading level="h2">Buscar por codigo FriggaFrio / Omie</Heading>
        <Text size="small" className="text-ui-fg-subtle">Consulta o Medusa local e, sob demanda, o catalogo Omie somente leitura.</Text>
      </div>
      <form className="flex flex-col gap-2 sm:flex-row sm:items-end" onSubmit={(event) => { event.preventDefault(); submit() }}>
        <label className="min-w-0 flex-1">
          <Text size="small" weight="plus">Codigo FriggaFrio / Omie</Text>
          <Input value={code} onChange={(event) => setCode(event.target.value)} inputMode="text" autoComplete="off" aria-label="Codigo FriggaFrio / Omie" />
        </label>
        <div className="flex gap-2">
          <Button type="submit" isLoading={search.isPending} disabled={search.isPending}><MagnifyingGlass className="mr-2" /> Buscar</Button>
          <Button type="button" variant="secondary" onClick={clear} disabled={search.isPending}>Limpar</Button>
        </div>
      </form>
      {result && !result.found && <Text className="rounded border p-4">Nenhum resultado local ou na Omie.</Text>}
      {result?.found && result.results.map((item, index) => (
        <div key={`${item.source}-${item.code}-${index}`} className="flex flex-col gap-2 rounded border p-4" data-testid="omie-product-search-result">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <Heading level="h3">{item.title || "Produto encontrado"}</Heading>
              <Text size="small">Origem: {item.source}</Text>
              <Text size="small">Codigo FriggaFrio / Omie: {item.code || "-"}</Text>
              <Text size="small">SKU: {item.sku || "-"}</Text>
              <Text size="small">Status: {item.status || "-"}</Text>
              {item.medusa_product_id && <Text size="small">Estoque: {item.inventory_quantity ?? "Nao informado"}</Text>}
            </div>
            <StatusBadge color={item.medusa_product_id ? "green" : "grey"}>{item.medusa_product_id ? "Vinculado" : "Ainda nao vinculado"}</StatusBadge>
          </div>
          {item.medusa_product_id ? <Link className="mt-1 inline-flex w-fit text-ui-fg-interactive" to={`/products/${item.medusa_product_id}`}>Abrir produto</Link> : <Text size="small" className="text-ui-fg-subtle">Resultado somente leitura do catalogo Omie.</Text>}
        </div>
      ))}
      {result?.omie?.status === "unavailable" && <Text size="small" className="text-ui-fg-subtle">Omie indisponivel; resultados locais foram preservados.</Text>}
      {result?.omie?.status === "credentials_missing" && <Text size="small" className="text-ui-fg-subtle">Consulta Omie nao realizada: credencial ausente.</Text>}
    </div>
  )
}
