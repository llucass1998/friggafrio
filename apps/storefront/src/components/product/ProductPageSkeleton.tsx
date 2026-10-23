export function ProductPageSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--color-background,#F8FAFC)] py-6 sm:py-10">
      <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb shimmer */}
        <div className="flex items-center gap-2 mb-6 animate-pulse">
          <div className="h-4 w-12 rounded bg-slate-200" />
          <div className="h-4 w-3 rounded bg-slate-200" />
          <div className="h-4 w-16 rounded bg-slate-200" />
          <div className="h-4 w-3 rounded bg-slate-200" />
          <div className="h-4 w-36 rounded bg-slate-200" />
        </div>

        {/* Product Hero Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Left Column: Image Gallery Skeleton */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="aspect-square w-full rounded-2xl bg-white border border-slate-100 p-6 shadow-sm flex items-center justify-center animate-pulse">
              <div className="h-3/4 w-3/4 rounded-xl bg-slate-100" />
            </div>
            {/* Thumbnail dots/bar shimmer */}
            <div className="flex gap-3 justify-center">
              <div className="h-16 w-16 rounded-xl bg-slate-200 animate-pulse" />
              <div className="h-16 w-16 rounded-xl bg-slate-200 animate-pulse" />
              <div className="h-16 w-16 rounded-xl bg-slate-200 animate-pulse" />
            </div>
          </div>

          {/* Right Column: Details & Actions Skeleton */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            {/* Brand & Badge shimmer */}
            <div className="flex items-center gap-3 animate-pulse">
              <div className="h-4 w-24 rounded bg-slate-200" />
              <div className="h-4 w-16 rounded-full bg-slate-100" />
            </div>

            {/* Title shimmer (2 lines) */}
            <div className="space-y-2.5 animate-pulse">
              <div className="h-7 w-full rounded-md bg-slate-200" />
              <div className="h-7 w-3/4 rounded-md bg-slate-200" />
            </div>

            {/* SKU & Stock shimmer */}
            <div className="flex items-center gap-4 animate-pulse">
              <div className="h-3.5 w-28 rounded bg-slate-100" />
              <div className="h-3.5 w-20 rounded bg-emerald-100" />
            </div>

            {/* Price Box shimmer */}
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-3 animate-pulse">
              <div className="h-4 w-20 rounded bg-slate-200" />
              <div className="h-9 w-44 rounded bg-slate-200" />
              <div className="h-4 w-48 rounded bg-slate-100" />
            </div>

            {/* CTA Buttons shimmer */}
            <div className="space-y-3 animate-pulse">
              <div className="h-12 w-full rounded-xl bg-[var(--color-primary,#0070BA)] opacity-50" />
              <div className="h-12 w-full rounded-xl bg-slate-100" />
            </div>

            {/* Trust arguments shimmer */}
            <div className="rounded-xl border border-slate-100 bg-white p-4 space-y-2.5 animate-pulse">
              <div className="h-4 w-3/4 rounded bg-slate-100" />
              <div className="h-4 w-1/2 rounded bg-slate-100" />
            </div>
          </div>
        </div>

        {/* Technical Specs shimmer */}
        <div className="mt-12 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-4 animate-pulse">
          <div className="flex gap-4 border-b border-slate-100 pb-3">
            <div className="h-6 w-28 rounded bg-slate-200" />
            <div className="h-6 w-28 rounded bg-slate-100" />
            <div className="h-6 w-28 rounded bg-slate-100" />
          </div>
          <div className="space-y-2 pt-2">
            <div className="h-4 w-full rounded bg-slate-100" />
            <div className="h-4 w-5/6 rounded bg-slate-100" />
            <div className="h-4 w-4/6 rounded bg-slate-100" />
          </div>
        </div>
      </div>
    </div>
  )
}
