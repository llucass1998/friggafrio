import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useSetCartAddresses } from "@/lib/hooks/use-checkout"
import { HttpTypes } from "@medusajs/types"
import { useState } from "react"
import { Loader2 } from "lucide-react"

interface AddressStepProps {
  cart: HttpTypes.StoreCart
  onNext: () => void
}

const AddressStep = ({ cart, onNext }: AddressStepProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mutationError, setMutationError] = useState<string | null>(null)
  const setCartAddressesMutation = useSetCartAddresses()

  // Extrai as partes salvas no carrinho (caso voltem da API)
  const existingAddress1 = cart.shipping_address?.address_1 || ""
  const parts = existingAddress1.split(",")
  let exLogradouro = existingAddress1
  let exNumero = ""
  let exBairro = ""

  if (parts.length > 1) {
    exLogradouro = parts[0].trim()
    const numAndBairro = parts[1].split("-")
    exNumero = numAndBairro[0]?.trim() || ""
    exBairro = numAndBairro[1]?.trim() || ""
  }

  const [form, setForm] = useState({
    email: cart.email || "",
    first_name: cart.shipping_address?.first_name || "",
    last_name: cart.shipping_address?.last_name || "",
    phone: cart.shipping_address?.phone || "",
    postal_code: cart.shipping_address?.postal_code || "",
    logradouro: exLogradouro,
    numero: exNumero,
    complemento: cart.shipping_address?.address_2 || "",
    bairro: exBairro,
    city: cart.shipping_address?.city || "",
    province: cart.shipping_address?.province || "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }))
    if (mutationError) setMutationError(null)
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!form.first_name.trim()) newErrors.first_name = "Obrigatório"
    if (!form.last_name.trim()) newErrors.last_name = "Obrigatório"
    if (!form.email.trim() || !/^\S+@\S+\.\S+$/.test(form.email)) newErrors.email = "E-mail inválido"
    if (!form.phone.trim()) newErrors.phone = "Obrigatório"

    const cepNumber = form.postal_code.replace(/\D/g, '')
    if (cepNumber.length !== 8) newErrors.postal_code = "CEP inválido (8 dígitos)"

    if (!form.logradouro.trim()) newErrors.logradouro = "Obrigatório"
    if (!form.numero.trim()) newErrors.numero = "Obrigatório"
    if (!form.bairro.trim()) newErrors.bairro = "Obrigatório"
    if (!form.city.trim()) newErrors.city = "Obrigatória"

    if (!form.province.trim()) {
      newErrors.province = "Obrigatório"
    } else {
      const p = form.province.trim().toLowerCase()
      const allowedStates = ["sp", "são paulo", "sao paulo", "sãopaulo", "saopaulo"]
      if (!allowedStates.includes(p)) {
        newErrors.province = "No momento, realizamos entregas somente no estado de São Paulo."
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return
    if (!validate()) return

    setIsSubmitting(true)
    setMutationError(null)

    try {
      const cepNormalized = form.postal_code.replace(/\D/g, '')
      const address_1 = `${form.logradouro}, ${form.numero} - ${form.bairro}`
      const address_2 = form.complemento

      const payload = {
        email: form.email,
        shipping_address: {
          first_name: form.first_name,
          last_name: form.last_name,
          phone: form.phone,
          postal_code: cepNormalized,
          address_1,
          address_2,
          city: form.city,
          province: "SP", // Normalizando a province para sempre SP
          country_code: "br"
        }
      }

      await setCartAddressesMutation.mutateAsync(payload)
      onNext()
    } catch {
      setMutationError("Não foi possível salvar o endereço. Verifique os dados e tente novamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-semibold">Endereço de Entrega</h2>

      {mutationError && (
        <div className="p-4 text-sm text-red-800 bg-red-100 rounded-md">
          {mutationError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Nome *</label>
            <Input name="first_name" value={form.first_name} onChange={handleChange} />
            {errors.first_name && <span className="text-xs text-red-500">{errors.first_name}</span>}
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Sobrenome *</label>
            <Input name="last_name" value={form.last_name} onChange={handleChange} />
            {errors.last_name && <span className="text-xs text-red-500">{errors.last_name}</span>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">E-mail *</label>
            <Input name="email" type="email" value={form.email} onChange={handleChange} />
            {errors.email && <span className="text-xs text-red-500">{errors.email}</span>}
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Telefone *</label>
            <Input name="phone" type="tel" value={form.phone} onChange={handleChange} />
            {errors.phone && <span className="text-xs text-red-500">{errors.phone}</span>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">CEP *</label>
            <Input name="postal_code" value={form.postal_code} onChange={handleChange} placeholder="00000-000" />
            {errors.postal_code && <span className="text-xs text-red-500">{errors.postal_code}</span>}
          </div>
          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-sm font-medium">Logradouro *</label>
            <Input name="logradouro" value={form.logradouro} onChange={handleChange} />
            {errors.logradouro && <span className="text-xs text-red-500">{errors.logradouro}</span>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Número *</label>
            <Input name="numero" value={form.numero} onChange={handleChange} />
            {errors.numero && <span className="text-xs text-red-500">{errors.numero}</span>}
          </div>
          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-sm font-medium">Complemento (opcional)</label>
            <Input name="complemento" value={form.complemento} onChange={handleChange} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Bairro *</label>
            <Input name="bairro" value={form.bairro} onChange={handleChange} />
            {errors.bairro && <span className="text-xs text-red-500">{errors.bairro}</span>}
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Cidade *</label>
            <Input name="city" value={form.city} onChange={handleChange} />
            {errors.city && <span className="text-xs text-red-500">{errors.city}</span>}
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Estado *</label>
            <Input name="province" value={form.province} onChange={handleChange} placeholder="Ex: SP" />
            <span className="text-xs text-zinc-500">Entregamos em todo o estado de São Paulo.</span>
            {errors.province && <span className="text-xs text-red-500">{errors.province}</span>}
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Continuar para Entrega
          </Button>
        </div>
      </form>
    </div>
  )
}

export default AddressStep