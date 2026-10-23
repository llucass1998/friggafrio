export function InstagramFeedSkeleton() {
  return (
    <div
      data-testid="instagram-feed-skeleton"
      aria-label="Carregando publicações do Instagram..."
      className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2 items-stretch"
    >
      {/* Featured Left Card Skeleton */}
      <div className="aspect-[4/5] lg:aspect-auto lg:h-full lg:min-h-0 w-full min-h-[340px] sm:min-h-[440px] animate-pulse rounded-2xl bg-[#E5EDF4]" />

      {/* 2x2 Secondary Grid Skeleton */}
      <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-2 items-stretch">
        <div className="aspect-[4/5] w-full animate-pulse rounded-2xl bg-[#E5EDF4]" />
        <div className="aspect-[4/5] w-full animate-pulse rounded-2xl bg-[#E5EDF4]" />
        <div className="aspect-[4/5] w-full animate-pulse rounded-2xl bg-[#E5EDF4]" />
        <div className="aspect-[4/5] w-full animate-pulse rounded-2xl bg-[#E5EDF4]" />
      </div>
    </div>
  )
}
