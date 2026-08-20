import { FormEvent, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { MapPin, Pencil, Plus, Trash2 } from "lucide-react"
import type { HttpTypes } from "@medusajs/types"
import { sdk } from "@/lib/medusa"
import { useAuth } from "@/lib/hooks/use-auth"
import { formatCep, normalizeCep } from "@/lib/cep"

type AddressInput = HttpTypes.StoreCreateCustomerAddress

const emptyAddress = (): AddressInput => ({
  address_name: "Casa",
  first_name: "",
  last_name: "",
  address_1: "",
  address_2: "",
  city: "",
  province: "SP",
  country_code: "br",
  postal_code: "",
  phone: "",
  is_default_shipping: false,
  is_default_billing: false,
})

function labelFor(address: HttpTypes.StoreCustomerAddress): string {
  return address.address_name || address.address_1 || "Endereco salvo"
}

export default function AddressesPage() {
  const queryClient = useQueryClient()
  const { customer, refetch } = useAuth()
  const [form, setForm] = useState<AddressInput>(emptyAddress)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const queryKey = ["customer-addresses", customer?.id]

  const { data: addresses = [], isLoading, isError } = useQuery({
    queryKey,
    queryFn: async () => (await sdk.store.customer.listAddress({ limit: 50 })).addresses,
    enabled: Boolean(customer?.id),
  })

  const resetForm = () => {
    setForm(emptyAddress())
    setEditingId(null)
    setShowForm(false)
    setError(null)
  }

  const saveAddress = useMutation({
    mutationFn: async () => {
      const payload = { ...form, postal_code: formatCep(form.postal_code || ""), country_code: "br", province: "SP" }
      if (normalizeCep(payload.postal_code || "").length !== 8 || !payload.address_1?.trim() || !payload.city?.trim()) {
        throw new Error("Preencha rua, cidade e um CEP valido.")
      }
      return editingId
        ? sdk.store.customer.updateAddress(editingId, payload)
        : sdk.store.customer.createAddress(payload)
    },
    onSuccess: async () => {
      await Promise.all([queryClient.invalidateQueries({ queryKey }), refetch()])
      resetForm()
    },
    onError: (reason) => setError(reason instanceof Error ? reason.message : "Nao foi possivel salvar o endereco."),
  })

  const removeAddress = useMutation({
    mutationFn: (id: string) => sdk.store.customer.deleteAddress(id),
    onSuccess: async () => {
      await Promise.all([queryClient.invalidateQueries({ queryKey }), refetch()])
    },
  })

  const defaultAddress = useMutation({
    mutationFn: (address: HttpTypes.StoreCustomerAddress) => sdk.store.customer.updateAddress(address.id, {
      is_default_shipping: true,
      is_default_billing: true,
    }),
    onSuccess: async () => {
      await Promise.all([queryClient.invalidateQueries({ queryKey }), refetch()])
    },
  })

  const sortedAddresses = useMemo(() => [...addresses].sort((left, right) => Number(right.is_default_shipping) - Number(left.is_default_shipping)), [addresses])

  const edit = (address: HttpTypes.StoreCustomerAddress) => {
    setEditingId(address.id)
    setForm({
      address_name: address.address_name || "Casa", first_name: address.first_name || "", last_name: address.last_name || "", company: address.company || "", address_1: address.address_1 || "", address_2: address.address_2 || "", city: address.city || "", province: "SP", country_code: "br", postal_code: address.postal_code || "", phone: address.phone || "", is_default_shipping: address.is_default_shipping, is_default_billing: address.is_default_billing,
    })
    setError(null)
    setShowForm(true)
  }

  const field = (name: keyof AddressInput, value: string | boolean) => setForm((current) => ({ ...current, [name]: value }))
  const submit = (event: FormEvent) => { event.preventDefault(); setError(null); saveAddress.mutate() }

  return (
    <section className="space-y-6" aria-labelledby="addresses-title">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">Minha conta</p><h1 id="addresses-title" className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Enderecos</h1><p className="mt-2 text-sm text-slate-600">Use um endereco salvo para manter seu CEP e entrega sincronizados.</p></div>
        {!showForm && <button type="button" onClick={() => setShowForm(true)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-white hover:bg-accent/90"><Plus className="h-4 w-4" aria-hidden="true" />Adicionar endereco</button>}
      </div>

      {showForm && <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-3"><div><h2 className="text-lg font-bold text-slate-950">{editingId ? "Editar endereco" : "Novo endereco"}</h2><p className="mt-1 text-sm text-slate-600">Entregas disponiveis em Sao Paulo, SP.</p></div><button type="button" onClick={resetForm} className="text-sm font-semibold text-slate-600 hover:text-slate-950">Cancelar</button></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Identificacao" value={form.address_name || ""} onChange={(value) => field("address_name", value)} placeholder="Casa" />
          <Field label="Telefone" value={form.phone || ""} onChange={(value) => field("phone", value)} inputMode="tel" />
          <Field label="Nome" value={form.first_name || ""} onChange={(value) => field("first_name", value)} autoComplete="given-name" />
          <Field label="Sobrenome" value={form.last_name || ""} onChange={(value) => field("last_name", value)} autoComplete="family-name" />
          <Field label="CEP" value={form.postal_code || ""} onChange={(value) => field("postal_code", formatCep(value))} inputMode="numeric" autoComplete="postal-code" />
          <Field label="Cidade" value={form.city || ""} onChange={(value) => field("city", value)} autoComplete="address-level2" />
          <div className="sm:col-span-2"><Field label="Rua e numero" value={form.address_1 || ""} onChange={(value) => field("address_1", value)} autoComplete="street-address" /></div>
          <Field label="Bairro" value={form.address_2 || ""} onChange={(value) => field("address_2", value)} />
          <div><label className="mb-1 block text-sm font-semibold text-slate-700">Estado</label><input readOnly value="Sao Paulo - SP" className="min-h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600" /></div>
        </div>
        <label className="mt-5 flex items-center gap-3 text-sm text-slate-700"><input type="checkbox" checked={Boolean(form.is_default_shipping)} onChange={(event) => { field("is_default_shipping", event.target.checked); field("is_default_billing", event.target.checked) }} />Usar como endereco principal</label>
        {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800" role="alert">{error}</p>}
        <button type="submit" disabled={saveAddress.isPending} className="mt-5 min-h-11 rounded-lg bg-accent px-5 text-sm font-semibold text-white hover:bg-accent/90 disabled:opacity-60">{saveAddress.isPending ? "Salvando..." : "Salvar endereco"}</button>
      </form>}

      {isLoading ? <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Carregando enderecos...</p> : isError ? <p className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">Nao foi possivel carregar seus enderecos. Tente novamente.</p> : sortedAddresses.length ? <div className="grid gap-4 lg:grid-cols-2">{sortedAddresses.map((address) => <article key={address.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex gap-3"><MapPin className="mt-1 h-5 w-5 text-accent" aria-hidden="true" /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="font-bold text-slate-950">{labelFor(address)}</h2>{address.is_default_shipping && <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-800">Principal</span>}</div><p className="mt-3 text-sm leading-6 text-slate-700">{address.address_1}{address.address_2 ? `, ${address.address_2}` : ""}<br />{address.city}/SP - {formatCep(address.postal_code || "")}</p></div></div><div className="mt-5 flex flex-wrap gap-3 border-t border-slate-100 pt-4"><button type="button" onClick={() => edit(address)} className="inline-flex items-center gap-1 text-sm font-semibold text-accent hover:underline"><Pencil className="h-4 w-4" aria-hidden="true" />Editar</button>{!address.is_default_shipping && <button type="button" disabled={defaultAddress.isPending} onClick={() => defaultAddress.mutate(address)} className="text-sm font-semibold text-slate-700 hover:text-slate-950">Tornar principal</button>}<button type="button" disabled={removeAddress.isPending} onClick={() => removeAddress.mutate(address.id)} className="ml-auto inline-flex items-center gap-1 text-sm font-semibold text-red-700 hover:underline"><Trash2 className="h-4 w-4" aria-hidden="true" />Excluir</button></div></article>)}</div> : <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center"><MapPin className="mx-auto h-10 w-10 text-accent" aria-hidden="true" /><h2 className="mt-4 text-lg font-bold text-slate-950">Nenhum endereco salvo</h2><p className="mt-2 text-sm text-slate-600">Adicione seu endereco para agilizar o checkout.</p></div>}
    </section>
  )
}

function Field({ label, value, onChange, placeholder, autoComplete, inputMode }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; autoComplete?: string; inputMode?: "numeric" | "tel" }) {
  const id = `address-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`
  return <div><label htmlFor={id} className="mb-1 block text-sm font-semibold text-slate-700">{label}</label><input id={id} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} autoComplete={autoComplete} inputMode={inputMode} className="min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20" /></div>
}
