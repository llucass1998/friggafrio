import { useEffect, useState } from "react"
import { ArrowUpRight } from "lucide-react"
import { storeConfig } from "@/config/store"
import { getInstagramFeed } from "@/lib/data/instagram"
import type { InstagramPost } from "@/components/instagram/instagram.types"
import { InstagramPostCard } from "@/components/instagram/InstagramPostCard"
import { InstagramFeedSkeleton } from "@/components/instagram/InstagramFeedSkeleton"
import { InstagramFeedEmpty } from "@/components/instagram/InstagramFeedEmpty"
import { InstagramIcon } from "@/components/instagram/InstagramIcon"

export function InstagramFeedSection() {
  const [posts, setPosts] = useState<InstagramPost[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const instagramUrl = storeConfig.instagramUrl || "https://www.instagram.com/frigga.frio/"
  const profileHandle = "@frigga.frio"

  useEffect(() => {
    let isMounted = true

    getInstagramFeed()
      .then((data) => {
        if (!isMounted) return
        setPosts(data?.posts || [])
      })
      .catch(() => {
        if (!isMounted) return
        setPosts([])
      })
      .finally(() => {
        if (!isMounted) return
        setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  const displayPosts = posts.slice(0, 5)
  const featuredPost = displayPosts[0]
  const secondaryPosts = displayPosts.slice(1)

  return (
    <section
      id="instagram-feed-section"
      aria-labelledby="instagram-section-heading"
      className="bg-[#F8FAFC] py-12 sm:py-20 border-y border-[#E5EDF4] scroll-mt-24 sm:scroll-mt-28"
    >
      <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5 sm:gap-6 mb-8 sm:mb-12">
          <div className="max-w-2xl">
            {/* Small Indicator */}
            <div className="flex items-center gap-2 mb-2 sm:mb-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]" aria-hidden="true" />
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-primary)]">
                NOSSO DIA A DIA
              </p>
            </div>

            {/* Title */}
            <h2
              id="instagram-section-heading"
              className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[var(--color-navy)]"
            >
              Acompanhe a FriggaFrio no Instagram
            </h2>

            {/* Subtitle */}
            <p className="mt-1.5 sm:mt-2 text-sm sm:text-base leading-relaxed text-[var(--color-text-muted)]">
              Novidades, bastidores e conhecimento técnico em refrigeração.
            </p>
          </div>

          {/* Social CTA & Handle */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
            {/* Pill Badge */}
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D9E8F2] bg-white px-3.5 py-1.5 text-xs font-semibold text-[var(--color-navy)] shadow-xs">
              <InstagramIcon className="h-3.5 w-3.5 text-[var(--color-primary)]" aria-hidden="true" />
              {profileHandle}
            </span>

            {/* CTA Button */}
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Seguir FriggaFrio no Instagram oficial (abre em nova aba)"
              className="inline-flex min-h-[42px] sm:min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 sm:px-5 text-xs sm:text-sm font-bold text-white shadow-xs transition hover:bg-[var(--color-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
            >
              <span>Seguir no Instagram</span>
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>

        {/* Content Area */}
        {isLoading ? (
          <InstagramFeedSkeleton />
        ) : displayPosts.length === 0 ? (
          <InstagramFeedEmpty />
        ) : displayPosts.length === 1 ? (
          /* 1 post: Prominent centered card */
          <div className="max-w-xl mx-auto">
            <InstagramPostCard post={featuredPost} isFeatured />
          </div>
        ) : displayPosts.length === 2 ? (
          /* 2 posts: Balanced 2-column layout */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <InstagramPostCard post={displayPosts[0]} isFeatured />
            <InstagramPostCard post={displayPosts[1]} isFeatured />
          </div>
        ) : displayPosts.length === 3 ? (
          /* 3 posts: Balanced 3-column layout without gaps */
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <InstagramPostCard post={displayPosts[0]} isFeatured />
            <InstagramPostCard post={displayPosts[1]} />
            <InstagramPostCard post={displayPosts[2]} />
          </div>
        ) : displayPosts.length === 4 ? (
          /* 4 posts: Balanced 4-column layout */
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {displayPosts.map((post) => (
              <InstagramPostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          /* 5 (or more) posts: Asymmetric editorial composition (1 featured ~50% + 4 secondary in 2x2 grid) */
          <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2 items-stretch">
            {/* Featured Post (Left ~50%) */}
            <div className="h-full">
              <InstagramPostCard post={featuredPost} isFeatured />
            </div>

            {/* Secondary Posts (Right Grid on Desktop/Tablet, Responsive 2-col Grid on Mobile with snap-alignment) */}
            <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-2 snap-x snap-mandatory scrollbar-none items-stretch">
              {secondaryPosts.map((post) => (
                <div key={post.id} className="w-full snap-start">
                  <InstagramPostCard post={post} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
