import { Link, useParams } from "@tanstack/react-router"

interface HeaderLogoProps {
  compact?: boolean
}

export function HeaderLogo({ compact = false }: HeaderLogoProps) {
  const params = useParams({ strict: false }) as { countryCode?: string }
  const countryCode = params.countryCode || "br"

  return (
    <Link
      to={`/${countryCode}`}
      className="flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] rounded-md"
      aria-label="Ir para a página inicial da FriggaFrio"
    >
      {compact ? (
        // Mobile / Sticky compact logo (simbolo + texto se possivel, ou só simbolo)
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
        // Full Logo
        <img
          src="/images/brand/logo-friggafrio.png"
          alt="FriggaFrio — Refrigeração e Ar Condicionado"
          className="h-[70px] sm:h-[80px] md:h-[90px] w-auto object-contain transform scale-110"
          loading="eager"
        />
      )}
    </Link>
  )
}
