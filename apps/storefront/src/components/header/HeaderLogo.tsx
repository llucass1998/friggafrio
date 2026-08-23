import { Link, useLocation, useParams } from "@tanstack/react-router"

interface HeaderLogoProps {
  compact?: boolean
}

export function HeaderLogo({ compact = false }: HeaderLogoProps) {
  const params = useParams({ strict: false }) as Record<string, string>
  const countryCode = params.countryCode || "br"
  const location = useLocation()

  const scrollHomeToTop = () => {
    if (typeof window === "undefined") return
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" })
  }

  return (
    <Link
      to="/$countryCode"
      params={{ countryCode }}
      onClick={(event) => {
        const homePath = `/${countryCode}`
        const isHome = location.pathname === homePath || location.pathname === `${homePath}/`
        if (isHome) {
          event.preventDefault()
          scrollHomeToTop()
          return
        }
        window.setTimeout(scrollHomeToTop, 0)
      }}
      className="flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] rounded-md"
      aria-label="Ir para a página inicial da FriggaFrio"
    >
      {compact ? (
        <div className="flex items-center gap-2">
          <img
            src="/favicon.png"
            alt="FriggaFrio Símbolo"
            className="h-10 w-auto md:h-12"
            width={48}
            height={48}
            loading="eager"
          />
          <span className="font-heading font-black text-2xl tracking-tighter text-[var(--color-navy)] uppercase hidden sm:block">
            FriggaFrio
          </span>
        </div>
      ) : (
        <img
          src="/images/brand/logo-friggafrio-optimized.webp"
          alt="FriggaFrio — Refrigeração e Ar Condicionado"
          className="h-[52px] max-w-[44vw] w-auto object-contain px-[5px] sm:h-[60px] sm:max-w-none"
          loading="eager"
        />
      )}
    </Link>
  )
}
