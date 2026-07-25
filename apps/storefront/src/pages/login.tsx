import { useState } from "react"
import { useNavigate, useParams, Link } from "@tanstack/react-router"
import { useAuth } from "@/lib/hooks/use-auth"
import { LockClosedSolid } from "@medusajs/icons"

export default function LoginPage() {
  const navigate = useNavigate()
  const params = useParams({ strict: false }) as { countryCode?: string }
  const countryCode = params.countryCode || "us"
  const { login } = useAuth()
  
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      // Authenticate with Medusa using the auth hook
      await login(email, password)
      console.log("[LoginPage] login successful, navigating to home")

      // Navigate without full page reload to preserve auth state
      navigate({ to: "/$countryCode", params: { countryCode } })
    } catch (err: any) {
      console.error("Login error:", err)
      setError("Invalid email or password. Please try again.")
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
            <LockClosedSolid className="w-7 h-7 text-accent" />
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-[var(--color-navy)] mb-2">Bem-vindo(a) de volta</h1>
            <p className="text-[var(--color-text-muted)]">Faça login para acessar preços e orçamentos</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
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

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[var(--color-text)] mb-2">
                Senha
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-4 py-3 bg-[var(--color-background)] border border-[var(--color-border)] rounded-[var(--radius-input)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-colors text-[var(--color-text)]"
                placeholder="Digite sua senha"
              />
            </div>

            <div className="flex items-center justify-between mt-2 mb-4">
              <Link
                to="/$countryCode"
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
