import { Link, useRouterState, useParams } from "@tanstack/react-router"
import { Search } from "lucide-react"

export function HeaderSearch({ compact = false }: { compact?: boolean }) {
  const routerState = useRouterState()
  const params = useParams({ strict: false }) as Record<string, string>
  const countryCode = params.countryCode || "br"

  return (
    <div className={`flex flex-1 relative ${compact ? "max-w-md" : "max-w-2xl"}`}>
      <form
        action={`/${countryCode}/store`}
        className="w-full flex"
      >
        <input
          name="q"
          type="text"
          placeholder="Busque por produto, gás, marca ou código"
          className={`w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-md pl-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all ${
            compact ? "py-2" : "py-2.5"
          }`}
          aria-label="Busque por produto, gás, marca ou código"
        />
        <button
          type="submit"
          className="absolute right-0 top-0 h-full px-4 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors rounded-r-md focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
          aria-label="Buscar"
        >
          <Search className="w-5 h-5" />
        </button>
      </form>
    </div>
  )
}
