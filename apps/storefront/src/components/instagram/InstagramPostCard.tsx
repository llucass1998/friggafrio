import { Play, Copy, ExternalLink } from "lucide-react"
import type { InstagramPost } from "@/components/instagram/instagram.types"
import { InstagramIcon } from "@/components/instagram/InstagramIcon"

interface InstagramPostCardProps {
  post: InstagramPost
  isFeatured?: boolean
}

export function InstagramPostCard({ post, isFeatured = false }: InstagramPostCardProps) {
  const displayImage = post.thumbnail_url || post.media_url
  const ariaLabel = post.caption
    ? `Ver no Instagram: ${post.caption.slice(0, 100)}`
    : `Ver publicação da FriggaFrio no Instagram`

  return (
    <a
      href={post.permalink}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      className={`group relative block overflow-hidden rounded-2xl border border-[#E2E8F0] bg-[#0A1626] shadow-xs transition-all duration-300 hover:shadow-xl hover:border-[#38BDF8]/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] ${
        isFeatured
          ? "aspect-[4/5] lg:aspect-auto lg:h-full lg:min-h-0 w-full min-h-[340px] sm:min-h-[440px]"
          : "aspect-[4/5] w-full"
      }`}
    >
      {/* Background Image Container */}
      <img
        src={displayImage}
        alt={post.caption ? post.caption.slice(0, 80) : "Publicação FriggaFrio no Instagram"}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
      />

      {/* Top Right Media Type Badge or Instagram Glyph */}
      <div className="absolute right-2.5 top-2.5 sm:right-3 sm:top-3 z-10 flex items-center gap-1.5">
        {post.media_type === "VIDEO" && (
          <span
            data-testid="badge-video"
            className="inline-flex items-center gap-1 rounded-full bg-black/60 px-2 sm:px-2.5 py-0.5 sm:py-1 text-[11px] sm:text-xs font-semibold text-white backdrop-blur-md shadow-xs"
          >
            <Play className="h-3 w-3 fill-current" aria-hidden="true" />
            <span>Vídeo</span>
          </span>
        )}
        {post.media_type === "CAROUSEL_ALBUM" && (
          <span
            data-testid="badge-carousel"
            className="inline-flex items-center gap-1 rounded-full bg-black/60 px-2 sm:px-2.5 py-0.5 sm:py-1 text-[11px] sm:text-xs font-semibold text-white backdrop-blur-md shadow-xs"
          >
            <Copy className="h-3 w-3" aria-hidden="true" />
            <span>Álbum</span>
          </span>
        )}
        {post.media_type !== "VIDEO" && post.media_type !== "CAROUSEL_ALBUM" && (
          <span className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md opacity-85 group-hover:opacity-100 transition-opacity shadow-xs">
            <InstagramIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden="true" />
          </span>
        )}
      </div>

      {/* Bottom Gradient Overlay (crisp, unobtrusive framing) */}
      <div
        className={`absolute inset-0 z-20 flex flex-col justify-end bg-gradient-to-t from-black/85 via-black/35 via-30% to-transparent text-white transition-opacity duration-300 ${
          isFeatured ? "p-3.5 sm:p-5" : "p-2.5 sm:p-3.5"
        }`}
      >
        {/* Caption Snippet */}
        {post.caption && (
          <p
            className={`font-medium leading-relaxed text-white/95 ${
              isFeatured
                ? "text-xs sm:text-sm line-clamp-2 sm:line-clamp-3"
                : "text-[11px] sm:text-xs line-clamp-1 sm:line-clamp-2"
            }`}
          >
            {post.caption}
          </p>
        )}

        {/* Action Link on Hover/Focus */}
        <div className="mt-1.5 sm:mt-2.5 flex items-center justify-between border-t border-white/20 pt-1.5 sm:pt-2">
          <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold text-[#38BDF8] group-hover:underline">
            Ver no Instagram
            <ExternalLink className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
          </span>
          <span className={`text-[10px] sm:text-[11px] font-medium text-white/70 ${isFeatured ? "inline" : "hidden sm:inline"}`}>
            @frigga.frio
          </span>
        </div>
      </div>
    </a>
  )
}
