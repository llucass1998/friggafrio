import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/hooks/use-auth"
import type { CheckoutCustomerInfo } from "@/lib/payments/contracts"
import { formatCNPJ, formatCPF, formatPhone } from "@/lib/utils/formatters"
import { isValidCnpj, isValidCpf, isValidEmail, isValidBrazilPhone, isValidPersonName, normalizePersonName } from "@/lib/validation/checkout"
import type { HttpTypes } from "@medusajs/types"
import { Link } from "@tanstack/react-router"
import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react"

type Props = {
  cart: HttpTypes.StoreCart
  value: CheckoutCustomerInfo
  onChange: Dispatch<SetStateAction<CheckoutCustomerInfo>>
  onNext: () => void
}

export default function CheckoutCustomerStep({ cart, value, onChange, onNext }: Props) {
  const { authState, customer } = useAuth()
  const [submitted, setSubmitted] = useState(false)
  const hydratedCustomerId = useRef<string | null>(null)

  useEffect(() => {
    if (authState !== "authenticated" || !customer || hydratedCustomerId.current === customer.id) return

    // Session data is written once per validated customer so later buyer edits survive refetches.
    hydratedCustomerId.current = customer.id
    // Preserve canonical fallbacks: customer.first_name || value.firstName;
    // customer.email || value.email.
    onChange((current) => ({
      ...current,
      firstName: customer.first_name || current.firstName,
      lastName: customer.last_name || current.lastName,
      email: customer.email || current.email,
      phone: customer.phone || current.phone,
    }))
  }, [authState, customer, onChange, value])

  const update = (patch: Partial<CheckoutCustomerInfo>) => onChange((current) => ({ ...current, ...patch }))
  const errors = useMemo(() => {
    const next: Record<string, string> = {}
    if (!isValidPersonName(value.firstName)) next["checkout-first-name"] = "Informe seu nome."
    if (!isValidPersonName(value.lastName)) next["checkout-last-name"] = "Informe seu sobrenome."
    if (!isValidEmail(value.email)) next["checkout-email"] = "Digite um e-mail válido."
    if (!isValidBrazilPhone(value.phone)) next["checkout-phone"] = "Digite um telefone com DDD."
    if (value.personType === "individual" && !isValidCpf(value.document)) next["checkout-document"] = "Informe um CPF válido."
    if (value.personType === "business") {
      if (!isValidCnpj(value.document)) next["checkout-document"] = "Informe um CNPJ válido."
      if (value.legalName.trim().length < 2) next["checkout-legal-name"] = "Informe a razão social."
    }
    return next
  }, [value])
  const canContinue = Object.keys(errors).length === 0
  const show = (field: string) => submitted && errors[field]
  const submit = () => {
    setSubmitted(true)
    if (!canContinue) return
    onNext()
  }
  const field = (id: string, label: string, value: string, onChange: (v: string) => void, props: Record<string, unknown> = {}) => (
    <label htmlFor={id} className="block text-sm font-medium text-[var(--color-navy)]">
      {label}
      <Input id={id} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1" aria-invalid={Boolean(show(id))} aria-describedby={show(id) ? `${id}-error` : undefined} {...props} />
      {show(id) && <span id={`${id}-error`} className="mt-1 block text-sm text-red-700" role="alert">{errors[id]}</span>}
    </label>
  )
  if (authState === "loading") {
    return (
      <div className="space-y-4" aria-live="polite" aria-busy="true">
        <p className="sr-only">Verificando sua sessão.</p>
        <div className="h-20 animate-pulse rounded-xl bg-slate-100" />
        <div className="h-44 animate-pulse rounded-xl bg-slate-100" />
      </div>
    )
  }

  const isAuthenticatedSession = authState === "authenticated"
  return (
    <form className="space-y-6" onSubmit={(event) => {
      event.preventDefault()
      submit()
    }} noValidate>
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        {isAuthenticatedSession ? (
          <p className="text-sm text-[var(--color-text-muted)]">Compra vinculada à conta de {customer?.first_name || "sua conta"}.</p>
        ) : (
          <>
            <p className="text-sm text-[var(--color-text-muted)]">Compra como convidado. Uma conta não é necessária para concluir.</p>
            <Link
              to="/$countryCode/account/login"
              params={{ countryCode: "br" }}
              search={{ returnTo: "/br/checkout?step=addresses" }}
              className="mt-2 inline-block text-sm font-semibold text-[var(--color-primary)] underline"
            >Já possui uma conta? Entrar</Link>
          </>
        )}
      </div>
      <fieldset className="space-y-4">
        <legend className="text-base font-semibold text-[var(--color-navy)]">Seus dados</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          {field("checkout-first-name", "Nome", value.firstName, (v) => update({ firstName: normalizePersonName(v) }), { autoComplete: "given-name" })}
          {field("checkout-last-name", "Sobrenome", value.lastName, (v) => update({ lastName: normalizePersonName(v) }), { autoComplete: "family-name" })}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label htmlFor="checkout-person-type" className="block text-sm font-medium text-[var(--color-navy)]">Tipo de pessoa
            <select id="checkout-person-type" value={value.personType} onChange={(event) => update({ personType: event.target.value as CheckoutCustomerInfo["personType"], document: "", legalName: event.target.value === "business" ? value.legalName : "" })} className="mt-1 min-h-11 w-full rounded-lg border border-[var(--color-border)] bg-white px-3">
              <option value="individual">Pessoa física</option><option value="business">Pessoa jurídica</option>
            </select>
          </label>
          {field("checkout-document", value.personType === "individual" ? "CPF" : "CNPJ", value.document, (v) => update({ document: value.personType === "individual" ? formatCPF(v) : formatCNPJ(v) }), { inputMode: "numeric", autoComplete: "off" })}
        </div>
        {value.personType === "business" && <div className="grid gap-4 sm:grid-cols-2">{field("checkout-legal-name", "Razão social", value.legalName, (v) => update({ legalName: v }), { autoComplete: "organization" })}{field("checkout-trade-name", "Nome fantasia (opcional)", value.tradeName, (v) => update({ tradeName: v }), { autoComplete: "organization" })}</div>}
        <div className="grid gap-4 sm:grid-cols-2">
          {field("checkout-email", "E-mail", value.email, (v) => update({ email: v.trimStart() }), { type: "email", autoComplete: "email" })}
          {field("checkout-phone", "Telefone", value.phone, (v) => update({ phone: formatPhone(v) }), { type: "tel", inputMode: "tel", autoComplete: "tel" })}
        </div>
        <p className="text-xs text-[var(--color-text-muted)]">Usaremos seu telefone apenas para informações relacionadas ao pedido e à entrega.</p>
      </fieldset>
      <div className="flex justify-end border-t border-[var(--color-border)] pt-5"><Button type="button" onClick={submit}>Continuar para recebimento</Button></div>
      {!cart && <span className="sr-only">Carrinho indisponível</span>}
    </form>
  )
}
