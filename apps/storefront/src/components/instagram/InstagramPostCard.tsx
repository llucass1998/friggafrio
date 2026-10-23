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
      className={`group relative block overflow-hidden rounded-2xl border border-[#E5EDF4] bg-[#F5F8FA] shadow-xs transition-all duration-300 hover:shadow-md hover:border-[#CBDDE9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] ${
        isFeatured
          ? "aspect-[4/3] md:aspect-[4/5] lg:aspect-auto lg:h-full w-full min-h-[320px] md:min-h-[420px]"
          : "aspect-square w-full"
      }`}
    >
      {/* Background Image */}
      <img
        src={displayImage}
        alt={post.caption ? post.caption.slice(0, 80) : "Publicação FriggaFrio no Instagram"}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
      />

      {/* Media Type Badge (Top Right) */}
      <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5">
        {post.media_type === "VIDEO" && (
          <span
            data-testid="badge-video"
            className="inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-md shadow-xs"
          >
            <Play className="h-3 w-3 fill-current" aria-hidden="true" />
            <span>Vídeo</span>
          </span>
        )}
        {post.media_type === "CAROUSEL_ALBUM" && (
          <span
            data-testid="badge-carousel"
            className="inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-md shadow-xs"
          >
            <Copy className="h-3 w-3" aria-hidden="true" />
            <span>Álbum</span>
          </span>
        )}
      </div>

      {/* Top Left Instagram Glyph */}
      <div className="absolute left-3 top-3 z-10">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md opacity-80 group-hover:opacity-100 transition-opacity">
          <InstagramIcon className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>

      {/* Bottom Gradient Overlay (always visible subtly, expands on hover) */}
      <div className="absolute inset-0 z-20 flex flex-col justify-end bg-gradient-to-t from-black/85 via-black/35 to-transparent p-4 sm:p-5 text-white transition-opacity duration-300">
        {/* Caption Snippet */}
        {post.caption && (
          <p
            className={`text-xs sm:text-sm font-medium leading-relaxed text-white/95 line-clamp-2 ${
              isFeatured ? "md:line-clamp-3 lg:line-clamp-4" : ""
            }`}
          >
            {post.caption}
          </p>
        )}

        {/* Action Link on Hover/Focus */}
        <div className="mt-2.5 sm:mt-3 flex items-center justify-between border-t border-white/20 pt-2 sm:pt-2.5">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#38BDF8] group-hover:underline">
            Ver no Instagram
            <ExternalLink className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
          </span>
          <span className={`text-[11px] font-medium text-white/70 ${isFeatured ? "inline" : "hidden sm:inline"}`}>
            @frigga.frio
          </span>
        </div>
      </div>
    </a>
  )
}
