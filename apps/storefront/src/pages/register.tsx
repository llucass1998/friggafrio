import { useState } from "react"
import { useNavigate, useParams, Link } from "@tanstack/react-router"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useAuth } from "@/lib/hooks/use-auth"
import { BuildingsSolid, User } from "@medusajs/icons"
import { Eye, EyeOff } from "lucide-react"
import { GoogleLogin, CredentialResponse } from "@react-oauth/google"
import {
  personRegistrationSchema,
  companyRegistrationSchema,
  PersonRegistrationForm,
  CompanyRegistrationForm
} from "@/lib/schemas/register"
import { formatPhone, formatCPF, formatCNPJ, normalizeToE164, extractOnlyNumbers } from "@/lib/utils/formatters"
import { sdk } from "@/lib/medusa"
import { registerCompany } from "@/lib/data/company"
import { registerCustomer } from "@/lib/data/customer"

export default function RegisterPage() {
  const navigate = useNavigate()
  const params = useParams({ strict: false }) as { countryCode?: string }
  const countryCode = params.countryCode || "br"
  const { loginWithGoogle, login } = useAuth()

  const [registerType, setRegisterType] = useState<"PERSON" | "COMPANY">("PERSON")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [serverError, setServerError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // React Hook Form for Person
  const personForm = useForm<PersonRegistrationForm>({
    resolver: zodResolver(personRegistrationSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      cpf: "",
      password: "",
      confirmPassword: "",
      acceptTerms: undefined,
      acceptMarketing: false
    }
  })

  // React Hook Form for Company
  const companyForm = useForm<CompanyRegistrationForm>({
    resolver: zodResolver(companyRegistrationSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      cnpj: "",
      companyName: "",
      tradeName: "",
      stateRegistration: "",
      isExemptStateRegistration: false,
      password: "",
      confirmPassword: "",
      acceptTerms: undefined,
      acceptMarketing: false
    }
  })

  // Submits B2C Person Registration
  const onSubmitPerson = async (data: PersonRegistrationForm) => {
    setServerError("")
    setIsLoading(true)

    try {
      const e164Phone = normalizeToE164(data.phone)
      const cleanCpf = data.cpf ? extractOnlyNumbers(data.cpf) : undefined

      // Uses custom atomic auth/customer registration flow for B2C
      await registerCustomer({
        email: data.email,
        password: data.password,
        first_name: data.firstName,
        last_name: data.lastName,
        phone: e164Phone,
        metadata: {
          person_type: "PERSON",
          cpf: cleanCpf,
          marketing_consent: data.acceptMarketing,
          marketing_consent_at: data.acceptMarketing ? new Date().toISOString() : null,
          terms_accepted_at: new Date().toISOString(),
        }
      })

      await login(data.email, data.password)
      navigate({ to: "/$countryCode" as string, params: { countryCode } })

    } catch (err: unknown) {
      console.error("Person registration error:", err)
      const e = err as Record<string, unknown>
      const message = typeof e?.message === "string" ? e.message : ""
      if (message.includes("already exists") || message.includes("duplicate")) {
        setServerError("Este e-mail já pode estar associado a uma conta.")
      } else {
        setServerError("Não foi possível concluir o cadastro. Revise os dados e tente novamente.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Submits B2B Company Registration
  const onSubmitCompany = async (data: CompanyRegistrationForm) => {
    setServerError("")
    setIsLoading(true)

    try {
      const e164Phone = normalizeToE164(data.phone)
      const cleanCnpj = extractOnlyNumbers(data.cnpj)

      await registerCompany({
        email: data.email,
        password: data.password,
        company: {
          name: data.companyName,
          email: data.email,
          phone: e164Phone,
          country_code: "br", // Force Brazil
        },
        admin: {
          first_name: data.firstName,
          last_name: data.lastName,
          phone: e164Phone
        },
      })

      // Update B2B Company details in metadata via backend /store/company custom logic if extended,
      // otherwise save it to customer me metadata for now since /store/company doesn't accept tradeName directly out of the box in this boilerplate.
      try {
        await login(data.email, data.password)
        await sdk.client.fetch("/store/customers/me", {
          method: "POST",
          body: {
            metadata: {
              person_type: "COMPANY",
              cnpj: cleanCnpj,
              trade_name: data.tradeName,
              state_registration: data.stateRegistration,
              is_exempt_ie: data.isExemptStateRegistration,
              marketing_consent: data.acceptMarketing,
              marketing_consent_at: data.acceptMarketing ? new Date().toISOString() : null,
              terms_accepted_at: new Date().toISOString(),
            }
          }
        })
      } catch (err) {
         // Silently fail metadata update if login succeeded
         console.error("Failed to update extra B2B metadata", err)
      }

      navigate({ to: "/$countryCode" as string, params: { countryCode } })

    } catch (err: unknown) {
      console.error("Company registration error:", err)
      const e = err as Record<string, unknown>
      const message = typeof e?.message === "string" ? e.message : ""
      if (message.includes("already exists") || message.includes("duplicate")) {
        setServerError("Este e-mail já pode estar associado a uma conta.")
      } else {
        setServerError("Não foi possível concluir o cadastro. Revise os dados e tente novamente.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    setServerError("")
    setIsLoading(true)

    try {
      if (credentialResponse.credential) {
        // Redireciona com base no hook centralizado
        
        // Como useAuth não pode ser chamado fora da renderização do componente,
        // a gente usa ele lá em cima.
        await loginWithGoogle(credentialResponse.credential)
        console.log("[RegisterPage] Google login/register successful, navigating to home")
        navigate({ to: "/$countryCode", params: { countryCode } })
      } else {
        throw new Error("No credential received from Google")
      }
    } catch (err: unknown) {
      console.error("Google Login error:", err)
      const e = err as Record<string, unknown>
      const message = typeof e?.message === "string" ? e.message : ""
      setServerError(message || "Falha na autenticação com Google. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const inputClass = "w-full px-4 py-3 bg-white border border-[var(--color-border)] rounded-[var(--radius-input)] focus:outline-2 focus:outline-offset-[-1px] focus:outline-[var(--color-primary)] transition-colors text-[var(--color-text)] placeholder-[var(--color-text-muted)] text-base"
  const inputErrorClass = "border-red-300 bg-red-50 focus:outline-red-500"
  const labelClass = "block text-sm font-semibold text-[var(--color-navy)] mb-1.5"

  const renderPasswordInput = (
    id: string,
    label: string,
    show: boolean,
    toggleShow: () => void,
    registerReturn: Record<string, unknown>,
    error?: string
  ) => (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label} <span className="text-red-500">*</span>
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          {...registerReturn}
          autoComplete="new-password"
          className={`${inputClass} ${error ? inputErrorClass : ""}`}
          placeholder="Mínimo de 8 caracteres"
          aria-invalid={!!error}
        />
        <button
          type="button"
          onClick={toggleShow}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] rounded-full p-1"
          aria-label={show ? "Ocultar senha" : "Mostrar senha"}
        >
          {show ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-600 font-medium" role="alert">{error}</p>}
    </div>
  )

  return (
    <div className="min-h-screen bg-[var(--color-surface-soft)] flex">
      {/* Coluna Esquerda: Institucional / Benefícios (Desktop) */}
      <div className="hidden lg:flex w-1/3 bg-[var(--color-navy)] text-white flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-accent)] rounded-full opacity-10 blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[var(--color-primary)] rounded-full opacity-20 blur-3xl translate-y-1/3 -translate-x-1/3" />

        <div className="relative z-10">
          <Link to={"/$countryCode" as string} params={{ countryCode }} className="inline-block mb-16 focus-visible:outline-2 focus-visible:outline-white rounded-sm">
            <h2 className="text-3xl font-bold tracking-tight text-white">
              Frigga<span className="text-[var(--color-accent)]">Frio</span>
            </h2>
          </Link>

          <h1 className="text-4xl font-bold mb-6">Sua conta FriggaFrio</h1>
          <p className="text-gray-300 text-lg mb-12">
            Tenha acesso ao histórico de pedidos, endereços salvos e uma experiência de compra mais rápida.
          </p>

          <ul className="space-y-6">
            {[
              "Acompanhe seus pedidos e orçamentos.",
              "Salve seus endereços para compras rápidas.",
              "Mantenha seu carrinho salvo após entrar.",
              "Solicite atendimento especializado B2B/B2C.",
            ].map((benefit, i) => (
              <li key={i} className="flex items-start gap-4 text-gray-200">
                <div className="mt-1 w-6 h-6 rounded-full bg-[var(--color-primary)] flex items-center justify-center flex-shrink-0">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 text-sm text-gray-400">
          &copy; {new Date().getFullYear()} FriggaFrio. Todos os direitos reservados.
        </div>
      </div>

      {/* Coluna Direita: Formulário */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 lg:p-12 overflow-y-auto">
        <div className="w-full max-w-lg">

          {/* Logo Mobile */}
          <div className="lg:hidden text-center mb-8">
            <Link to={"/$countryCode" as string} params={{ countryCode }} className="inline-block focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] rounded-sm">
              <h2 className="text-3xl font-bold tracking-tight text-[var(--color-navy)]">
                Frigga<span className="text-[var(--color-accent)]">Frio</span>
              </h2>
            </Link>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-[var(--color-border)] p-6 md:p-8 lg:p-10 w-full">
            <div className="mb-8">
              <h1 className="text-2xl lg:text-3xl font-bold text-[var(--color-navy)] mb-2">Criar minha conta</h1>
              <p className="text-[var(--color-text-muted)]">
                Cadastre-se para acompanhar seus pedidos, salvar seus dados e realizar compras com mais facilidade.
              </p>
            </div>

            {/* Abas Tipo de Cadastro */}
            <div className="flex p-1 bg-[var(--color-surface-soft)] rounded-lg mb-8" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={registerType === "PERSON"}
                onClick={() => setRegisterType("PERSON")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-md transition-all focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] ${
                  registerType === "PERSON"
                    ? "bg-white text-[var(--color-navy)] shadow-sm border border-[var(--color-border)]"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-navy)]"
                }`}
              >
                <User className="w-4 h-4" />
                Pessoa física
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={registerType === "COMPANY"}
                onClick={() => setRegisterType("COMPANY")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-md transition-all focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] ${
                  registerType === "COMPANY"
                    ? "bg-white text-[var(--color-navy)] shadow-sm border border-[var(--color-border)]"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-navy)]"
                }`}
              >
                <BuildingsSolid className="w-4 h-4" />
                Pessoa jurídica
              </button>
            </div>

            {serverError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 font-medium" role="alert" aria-live="assertive">
                {serverError}
              </div>
            )}

            {/* FORMULÁRIO: PESSOA FÍSICA */}
            <div className={registerType === "PERSON" ? "block" : "hidden"} role="tabpanel" aria-label="Cadastro de Pessoa Física">
              <form onSubmit={personForm.handleSubmit(onSubmitPerson)} className="space-y-5" noValidate>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="pf_firstName" className={labelClass}>Nome <span className="text-red-500">*</span></label>
                    <input
                      id="pf_firstName"
                      type="text"
                      {...personForm.register("firstName")}
                      autoComplete="given-name"
                      className={`${inputClass} ${personForm.formState.errors.firstName ? inputErrorClass : ""}`}
                      aria-invalid={!!personForm.formState.errors.firstName}
                    />
                    {personForm.formState.errors.firstName && <p className="mt-1 text-xs text-red-600 font-medium" role="alert">{personForm.formState.errors.firstName.message}</p>}
                  </div>
                  <div>
                    <label htmlFor="pf_lastName" className={labelClass}>Sobrenome <span className="text-red-500">*</span></label>
                    <input
                      id="pf_lastName"
                      type="text"
                      {...personForm.register("lastName")}
                      autoComplete="family-name"
                      className={`${inputClass} ${personForm.formState.errors.lastName ? inputErrorClass : ""}`}
                      aria-invalid={!!personForm.formState.errors.lastName}
                    />
                    {personForm.formState.errors.lastName && <p className="mt-1 text-xs text-red-600 font-medium" role="alert">{personForm.formState.errors.lastName.message}</p>}
                  </div>
                </div>

                <div>
                  <label htmlFor="pf_email" className={labelClass}>E-mail <span className="text-red-500">*</span></label>
                  <input
                    id="pf_email"
                    type="email"
                    inputMode="email"
                    {...personForm.register("email")}
                    autoComplete="email"
                    className={`${inputClass} ${personForm.formState.errors.email ? inputErrorClass : ""}`}
                    aria-invalid={!!personForm.formState.errors.email}
                  />
                  {personForm.formState.errors.email && <p className="mt-1 text-xs text-red-600 font-medium" role="alert">{personForm.formState.errors.email.message}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="pf_phone" className={labelClass}>Telefone <span className="text-red-500">*</span></label>
                    <input
                      id="pf_phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="(11) 99999-9999"
                      {...personForm.register("phone", {
                        onChange: (e) => { e.target.value = formatPhone(e.target.value) }
                      })}
                      className={`${inputClass} ${personForm.formState.errors.phone ? inputErrorClass : ""}`}
                      aria-invalid={!!personForm.formState.errors.phone}
                    />
                    {personForm.formState.errors.phone && <p className="mt-1 text-xs text-red-600 font-medium" role="alert">{personForm.formState.errors.phone.message}</p>}
                  </div>
                  <div>
                    <label htmlFor="pf_cpf" className={labelClass}>CPF <span className="text-[var(--color-text-muted)] text-xs font-normal">(Opcional)</span></label>
                    <input
                      id="pf_cpf"
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      placeholder="000.000.000-00"
                      {...personForm.register("cpf", {
                        onChange: (e) => { e.target.value = formatCPF(e.target.value) }
                      })}
                      className={`${inputClass} ${personForm.formState.errors.cpf ? inputErrorClass : ""}`}
                      aria-invalid={!!personForm.formState.errors.cpf}
                    />
                    {personForm.formState.errors.cpf && <p className="mt-1 text-xs text-red-600 font-medium" role="alert">{personForm.formState.errors.cpf.message}</p>}
                  </div>
                </div>

                {renderPasswordInput("pf_password", "Senha", showPassword, () => setShowPassword(!showPassword), personForm.register("password"), personForm.formState.errors.password?.message)}
                {renderPasswordInput("pf_confirmPassword", "Confirmar senha", showConfirmPassword, () => setShowConfirmPassword(!showConfirmPassword), personForm.register("confirmPassword"), personForm.formState.errors.confirmPassword?.message)}

                <div className="pt-4 space-y-4">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="flex items-center h-5">
                      <input
                        type="checkbox"
                        {...personForm.register("acceptTerms")}
                        className="w-5 h-5 text-[var(--color-primary)] border-gray-300 rounded focus:ring-[var(--color-primary)] cursor-pointer"
                        aria-invalid={!!personForm.formState.errors.acceptTerms}
                      />
                    </div>
                    <span className="text-sm text-[var(--color-text)]">
                      Li e aceito os <Link to={"/" as string} className="text-[var(--color-primary)] hover:underline font-medium">Termos de Uso</Link> e a <Link to={"/" as string} className="text-[var(--color-primary)] hover:underline font-medium">Política de Privacidade</Link>. <span className="text-red-500">*</span>
                    </span>
                  </label>
                  {personForm.formState.errors.acceptTerms && <p className="text-xs text-red-600 font-medium pl-8" role="alert">{personForm.formState.errors.acceptTerms.message}</p>}

                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="flex items-center h-5">
                      <input
                        type="checkbox"
                        {...personForm.register("acceptMarketing")}
                        className="w-5 h-5 text-[var(--color-primary)] border-gray-300 rounded focus:ring-[var(--color-primary)] cursor-pointer"
                      />
                    </div>
                    <span className="text-sm text-[var(--color-text)]">
                      Quero receber novidades, conteúdos e ofertas da FriggaFrio.
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-4 py-3.5 px-4 bg-[var(--color-primary)] text-white font-bold rounded-[var(--radius-button)] hover:bg-[var(--color-primary-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                  aria-live="polite"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Criando conta...
                    </>
                  ) : "Criar conta"}
                </button>
              </form>
            </div>

            {/* FORMULÁRIO: PESSOA JURÍDICA */}
            <div className={registerType === "COMPANY" ? "block" : "hidden"} role="tabpanel" aria-label="Cadastro de Pessoa Jurídica">
              <form onSubmit={companyForm.handleSubmit(onSubmitCompany)} className="space-y-5" noValidate>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="pj_cnpj" className={labelClass}>CNPJ <span className="text-red-500">*</span></label>
                    <input
                      id="pj_cnpj"
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      placeholder="00.000.000/0000-00"
                      {...companyForm.register("cnpj", {
                        onChange: (e) => { e.target.value = formatCNPJ(e.target.value) }
                      })}
                      className={`${inputClass} ${companyForm.formState.errors.cnpj ? inputErrorClass : ""}`}
                      aria-invalid={!!companyForm.formState.errors.cnpj}
                    />
                    {companyForm.formState.errors.cnpj && <p className="mt-1 text-xs text-red-600 font-medium" role="alert">{companyForm.formState.errors.cnpj.message}</p>}
                  </div>
                  <div>
                    <label htmlFor="pj_companyName" className={labelClass}>Razão social <span className="text-red-500">*</span></label>
                    <input
                      id="pj_companyName"
                      type="text"
                      {...companyForm.register("companyName")}
                      autoComplete="organization"
                      className={`${inputClass} ${companyForm.formState.errors.companyName ? inputErrorClass : ""}`}
                      aria-invalid={!!companyForm.formState.errors.companyName}
                    />
                    {companyForm.formState.errors.companyName && <p className="mt-1 text-xs text-red-600 font-medium" role="alert">{companyForm.formState.errors.companyName.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="pj_tradeName" className={labelClass}>Nome fantasia <span className="text-[var(--color-text-muted)] text-xs font-normal">(Opcional)</span></label>
                    <input
                      id="pj_tradeName"
                      type="text"
                      {...companyForm.register("tradeName")}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="pj_stateRegistration" className={labelClass}>Inscrição estadual</label>
                    <input
                      id="pj_stateRegistration"
                      type="text"
                      disabled={companyForm.watch("isExemptStateRegistration")}
                      {...companyForm.register("stateRegistration")}
                      className={`${inputClass} disabled:bg-gray-100 disabled:text-gray-400 ${companyForm.formState.errors.stateRegistration ? inputErrorClass : ""}`}
                      aria-invalid={!!companyForm.formState.errors.stateRegistration}
                    />
                    <label className="flex items-center gap-2 mt-2 cursor-pointer">
                      <input
                        type="checkbox"
                        {...companyForm.register("isExemptStateRegistration")}
                        className="w-4 h-4 text-[var(--color-primary)] border-gray-300 rounded focus:ring-[var(--color-primary)]"
                      />
                      <span className="text-xs text-[var(--color-text-muted)]">Isento de inscrição estadual</span>
                    </label>
                    {companyForm.formState.errors.stateRegistration && <p className="mt-1 text-xs text-red-600 font-medium" role="alert">{companyForm.formState.errors.stateRegistration.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="pj_firstName" className={labelClass}>Nome do responsável <span className="text-red-500">*</span></label>
                    <input
                      id="pj_firstName"
                      type="text"
                      {...companyForm.register("firstName")}
                      autoComplete="given-name"
                      className={`${inputClass} ${companyForm.formState.errors.firstName ? inputErrorClass : ""}`}
                      aria-invalid={!!companyForm.formState.errors.firstName}
                    />
                    {companyForm.formState.errors.firstName && <p className="mt-1 text-xs text-red-600 font-medium" role="alert">{companyForm.formState.errors.firstName.message}</p>}
                  </div>
                  <div>
                    <label htmlFor="pj_lastName" className={labelClass}>Sobrenome <span className="text-red-500">*</span></label>
                    <input
                      id="pj_lastName"
                      type="text"
                      {...companyForm.register("lastName")}
                      autoComplete="family-name"
                      className={`${inputClass} ${companyForm.formState.errors.lastName ? inputErrorClass : ""}`}
                      aria-invalid={!!companyForm.formState.errors.lastName}
                    />
                    {companyForm.formState.errors.lastName && <p className="mt-1 text-xs text-red-600 font-medium" role="alert">{companyForm.formState.errors.lastName.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="pj_email" className={labelClass}>E-mail <span className="text-red-500">*</span></label>
                    <input
                      id="pj_email"
                      type="email"
                      inputMode="email"
                      {...companyForm.register("email")}
                      autoComplete="email"
                      className={`${inputClass} ${companyForm.formState.errors.email ? inputErrorClass : ""}`}
                      aria-invalid={!!companyForm.formState.errors.email}
                    />
                    {companyForm.formState.errors.email && <p className="mt-1 text-xs text-red-600 font-medium" role="alert">{companyForm.formState.errors.email.message}</p>}
                  </div>
                  <div>
                    <label htmlFor="pj_phone" className={labelClass}>Telefone <span className="text-red-500">*</span></label>
                    <input
                      id="pj_phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="(11) 99999-9999"
                      {...companyForm.register("phone", {
                        onChange: (e) => { e.target.value = formatPhone(e.target.value) }
                      })}
                      className={`${inputClass} ${companyForm.formState.errors.phone ? inputErrorClass : ""}`}
                      aria-invalid={!!companyForm.formState.errors.phone}
                    />
                    {companyForm.formState.errors.phone && <p className="mt-1 text-xs text-red-600 font-medium" role="alert">{companyForm.formState.errors.phone.message}</p>}
                  </div>
                </div>

                {renderPasswordInput("pj_password", "Senha", showPassword, () => setShowPassword(!showPassword), companyForm.register("password"), companyForm.formState.errors.password?.message)}
                {renderPasswordInput("pj_confirmPassword", "Confirmar senha", showConfirmPassword, () => setShowConfirmPassword(!showConfirmPassword), companyForm.register("confirmPassword"), companyForm.formState.errors.confirmPassword?.message)}

                <div className="pt-4 space-y-4">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="flex items-center h-5">
                      <input
                        type="checkbox"
                        {...companyForm.register("acceptTerms")}
                        className="w-5 h-5 text-[var(--color-primary)] border-gray-300 rounded focus:ring-[var(--color-primary)] cursor-pointer"
                        aria-invalid={!!companyForm.formState.errors.acceptTerms}
                      />
                    </div>
                    <span className="text-sm text-[var(--color-text)]">
                      Li e aceito os <Link to={"/" as string} className="text-[var(--color-primary)] hover:underline font-medium">Termos de Uso</Link> e a <Link to={"/" as string} className="text-[var(--color-primary)] hover:underline font-medium">Política de Privacidade</Link>. <span className="text-red-500">*</span>
                    </span>
                  </label>
                  {companyForm.formState.errors.acceptTerms && <p className="text-xs text-red-600 font-medium pl-8" role="alert">{companyForm.formState.errors.acceptTerms.message}</p>}

                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="flex items-center h-5">
                      <input
                        type="checkbox"
                        {...companyForm.register("acceptMarketing")}
                        className="w-5 h-5 text-[var(--color-primary)] border-gray-300 rounded focus:ring-[var(--color-primary)] cursor-pointer"
                      />
                    </div>
                    <span className="text-sm text-[var(--color-text)]">
                      Quero receber novidades, conteúdos e ofertas da FriggaFrio.
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-4 py-3.5 px-4 bg-[var(--color-primary)] text-white font-bold rounded-[var(--radius-button)] hover:bg-[var(--color-primary-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                  aria-live="polite"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Criando conta...
                    </>
                  ) : "Criar conta"}
                </button>
              </form>
            </div>

            {/* Separator & OAuth */}
            <div className="my-8 flex items-center">
              <div className="flex-1 border-t border-[var(--color-border)]"></div>
              <span className="px-4 text-sm text-[var(--color-text-muted)] font-medium">ou</span>
              <div className="flex-1 border-t border-[var(--color-border)]"></div>
            </div>

            <div className="flex justify-center mb-6">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => {
                  console.error("Google Login falhou na inicializacao")
                  setServerError("Falha ao abrir pop-up do Google. Verifique o bloqueador de pop-ups.")
                }}
                shape="rectangular"
                text="continue_with"
                theme="outline"
                size="large"
              />
            </div>

            {/* Login Link */}
            <div className="mt-8 text-center text-sm">
              <p className="text-[var(--color-text-muted)]">
                Já possui uma conta?{" "}
                <Link
                  to="/$countryCode/account/login"
                  params={{ countryCode }}
                  className="text-[var(--color-primary)] hover:underline font-semibold"
                >
                  Entrar
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
