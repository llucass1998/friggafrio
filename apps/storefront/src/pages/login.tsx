import { useEffect, useState } from "react"
import { useNavigate, useParams, useSearch, Link } from "@tanstack/react-router"
import { useAuth } from "@/lib/hooks/use-auth"
import { Eye, EyeOff, LockKeyhole } from "lucide-react"
import { DEFAULT_COUNTRY_CODE } from "@/config/commerce"
import { normalizeReturnTo } from "@/lib/auth/return-to"
import { configuredAdminOrigin } from "@/lib/auth/admin-origin"
import { MEDUSA_BACKEND_URL } from "@/config/env"

export default function LoginPage() {
  const navigate = useNavigate()
  const params = useParams({ strict: false }) as { countryCode?: string }
  const countryCode = params.countryCode || DEFAULT_COUNTRY_CODE
  const search = useSearch({ strict: false }) as { returnTo?: unknown; google_error?: unknown }
  const { login } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [googleAvailable, setGoogleAvailable] = useState<boolean | null>(null)

  const googleErrorMessage =
    search.google_error === "expired"
      ? "A sessão do Google expirou. Inicie o login novamente."
      : search.google_error === "invalid_request"
        ? "Não foi possível validar a solicitação do Google. Inicie o login novamente."
        : search.google_error === "authentication_failed"
          ? "Não foi possível concluir o login com Google. Tente novamente."
          : ""

  useEffect(() => {
    const controller = new AbortController()
    // Authentication routes do not require a publishable API key. Keeping this
    // availability check beside the redirect flow prevents an anonymous 400
    // from being mistaken for an unavailable OIDC provider.
    void fetch(`${MEDUSA_BACKEND_URL}/auth/customer/google/status`, {
      credentials: "include",
      signal: controller.signal,
    })
      .then(async (response) => response.ok ? response.json() as Promise<{ available?: unknown }> : { available: false })
      .then((payload) => setGoogleAvailable(payload.available === true))
      .catch(() => {
        if (!controller.signal.aborted) setGoogleAvailable(false)
      })
    return () => controller.abort()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const actor = await login(email, password)
      if (actor === "admin") {
        // Local development shares the API origin; production keeps the Admin
        // origin explicit so an API-only origin cannot become a bad redirect.
        const adminOrigin =
          configuredAdminOrigin(import.meta.env.VITE_MEDUSA_ADMIN_URL) ??
          (import.meta.env.DEV ? configuredAdminOrigin(MEDUSA_BACKEND_URL) : null)
        if (!adminOrigin) {
          throw new Error("Admin origin is not configured")
        }
        window.location.assign(`${adminOrigin}/app`)
        return
      }
      const returnTo = normalizeReturnTo(search.returnTo, countryCode)
      navigate({ to: returnTo as string })
    } catch {
      setError("E-mail ou senha inválidos.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center px-6 py-12 bg-background">
      <div className="w-full max-w-md">
        {/* Sign In Card */}
        <div className="bg-surface rounded-2xl shadow-card border border-border p-8">
          {/* Icon */}
          <div className="w-14 h-14 bg-accent-light rounded-xl flex items-center justify-center mx-auto mb-6">
            <LockKeyhole className="w-7 h-7 text-accent" aria-hidden="true" />
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-[var(--color-navy)] mb-2">Bem-vindo(a) de volta</h1>
            <p className="text-[var(--color-text-muted)]">Faça login para acessar preços e orçamentos</p>
          </div>

          {/* Error Message */}
          {(error || googleErrorMessage) && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg" role="alert" aria-live="assertive">
              <p className="text-sm text-red-600">{error || googleErrorMessage}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[var(--color-text)] mb-2">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-4 py-3 bg-[var(--color-background)] border border-[var(--color-border)] rounded-[var(--radius-input)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-colors text-[var(--color-text)]"
                placeholder="você@empresa.com"
              />
            </div>

            <div className="relative">
              <label htmlFor="password" className="block text-sm font-medium text-[var(--color-text)] mb-2">
                Senha
              </label>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-4 py-3 pr-12 bg-[var(--color-background)] border border-[var(--color-border)] rounded-[var(--radius-input)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-colors text-[var(--color-text)]"
                placeholder="Digite sua senha"
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                className="absolute bottom-3 right-3 rounded p-1 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
              </button>
            </div>

            <div className="flex items-center justify-between mt-2 mb-4">
              <Link
                to="/$countryCode/account/forgot-password"
                params={{ countryCode }}
                className="text-sm text-[var(--color-primary)] hover:underline"
              >
                Esqueci minha senha
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-[var(--color-primary)] text-white font-bold rounded-[var(--radius-button)] hover:bg-[var(--color-primary-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Entrando...
                </span>
              ) : (
                "Entrar"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-[var(--color-border)]"></div>
            <span className="px-4 text-sm text-[var(--color-text-muted)]">ou</span>
            <div className="flex-1 border-t border-[var(--color-border)]"></div>
          </div>

          {/* Create Account Link */}
          <button
            type="button"
            disabled={isGoogleLoading || googleAvailable !== true}
            aria-busy={isGoogleLoading}
            onClick={() => {
              setError("")
              setIsGoogleLoading(true)
              const returnPath = normalizeReturnTo(search.returnTo, countryCode)
              const returnTo = `${window.location.origin}${returnPath}`
              window.location.assign(`${MEDUSA_BACKEND_URL}/auth/customer/google/start?return_to=${encodeURIComponent(returnTo)}`)
            }}
            className="mb-5 w-full rounded-[var(--radius-button)] border border-[var(--color-border)] px-4 py-3 font-semibold text-[var(--color-navy)] transition-colors hover:bg-[var(--color-background)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isGoogleLoading ? "Abrindo Google..." : "Continuar com Google"}
          </button>
          {googleAvailable === false && (
            <p className="-mt-3 mb-5 text-sm text-[var(--color-text-muted)]" role="status">
              O login com Google esta temporariamente indisponivel. Use e-mail e senha.
            </p>
          )}

          <div className="text-center">
            <p className="text-[var(--color-text-muted)]">
              Ainda não tem uma conta?{" "}
              <Link
                to="/$countryCode/account/register"
                params={{ countryCode }}
                className="text-[var(--color-primary)] hover:underline font-medium"
              >
                Crie agora
              </Link>
            </p>
          </div>
        </div>

        {/* Help Text */}
        <p className="text-center text-sm text-[var(--color-text-muted)] mt-6">
          Precisa de ajuda?{" "}
          <a href="mailto:contato@friggafrio.com.br" className="text-[var(--color-navy)] hover:text-[var(--color-primary)]">
            Entre em contato
          </a>
        </p>
      </div>
    </div>
  )
}
