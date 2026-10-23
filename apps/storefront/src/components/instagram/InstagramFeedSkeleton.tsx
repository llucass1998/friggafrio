export function InstagramFeedSkeleton() {
  return (
    <div
      data-testid="instagram-feed-skeleton"
      aria-label="Carregando publicações do Instagram..."
      className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2"
    >
      {/* Featured Left Card Skeleton */}
      <div className="aspect-[4/3] sm:aspect-[4/5] lg:aspect-auto lg:h-[460px] w-full animate-pulse rounded-2xl bg-[#E5EDF4]" />

      {/* 2x2 Secondary Grid Skeleton */}
      <div className="grid grid-cols-2 gap-4 sm:gap-6">
        <div className="aspect-square w-full animate-pulse rounded-2xl bg-[#E5EDF4]" />
        <div className="aspect-square w-full animate-pulse rounded-2xl bg-[#E5EDF4]" />
        <div className="aspect-square w-full animate-pulse rounded-2xl bg-[#E5EDF4]" />
        <div className="aspect-square w-full animate-pulse rounded-2xl bg-[#E5EDF4]" />
      </div>
    </div>
  )
}
