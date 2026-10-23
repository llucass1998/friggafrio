import { ArrowUpRight } from "lucide-react"
import { storeConfig } from "@/config/store"
import { InstagramIcon } from "@/components/instagram/InstagramIcon"

export function InstagramFeedEmpty() {
  const instagramUrl = storeConfig.instagramUrl || "https://www.instagram.com/frigga.frio/"

  return (
    <div
      data-testid="instagram-feed-empty"
      className="mx-auto max-w-2xl flex flex-col items-center justify-center rounded-2xl border border-[#D9E8F2] bg-gradient-to-b from-white to-[#F5F8FA] p-8 sm:p-12 text-center shadow-xs"
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8F5FB] text-[var(--color-primary)] shadow-xs ring-1 ring-[#D9E8F2]">
        <InstagramIcon className="h-7 w-7" aria-hidden="true" />
      </div>

      <h3 className="mb-2 text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-navy)]">
        Conecte-se com a FriggaFrio no Instagram
      </h3>

      <p className="mb-6 max-w-md text-sm leading-relaxed text-[var(--color-text-muted)] sm:text-base">
        Acesse nosso perfil oficial <strong className="font-semibold text-[var(--color-navy)]">@frigga.frio</strong> para acompanhar novidades técnicas, lançamentos de componentes e os bastidores de nossas unidades.
      </p>

      <a
        href={instagramUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Abrir perfil da FriggaFrio no Instagram (abre em nova aba)"
        className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-6 text-sm font-bold text-white shadow-xs transition hover:bg-[var(--color-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
      >
        <span>Acessar @frigga.frio</span>
        <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
      </a>
    </div>
  )
}
