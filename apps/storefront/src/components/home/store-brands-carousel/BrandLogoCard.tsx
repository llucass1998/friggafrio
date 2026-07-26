import { } from "@tanstack/react-router"

interface BrandLogoCardProps {
  name: string
  logoSrc: string
  logoAlt: string
  websiteUrl?: string
}

export function BrandLogoCard({ name, logoSrc, logoAlt, websiteUrl }: BrandLogoCardProps) {
  const content = (
    <div className="flex items-center justify-center h-full w-full bg-white rounded-[var(--radius-card)] border border-[var(--color-border)] p-4 md:p-6 transition-colors hover:border-[#bae6fd] group-focus-visible:border-[var(--color-primary)]">
      <img
        src={logoSrc}
        alt={logoAlt || `Logo da ${name}`}
        className="w-full h-full object-contain max-h-[100px] md:max-h-[120px]"
        loading="lazy"
      />
    </div>
  )

  if (websiteUrl) {
    return (
      <a
        href={websiteUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Visitar o site oficial da ${name}`}
        className="block h-[125px] md:h-[150px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] rounded-[var(--radius-card)] group"
      >
        {content}
      </a>
    )
  }

  return (
    <div className="block h-[125px] md:h-[150px] group">
      {content}
    </div>
  )
}
