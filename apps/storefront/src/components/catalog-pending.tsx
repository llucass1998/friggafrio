export function CatalogPending() {
  return (
    <main className="mx-auto w-[calc(100%-24px)] max-w-[1520px] py-8 sm:w-[calc(100%-32px)] lg:w-[calc(100%-64px)]" aria-busy="true" aria-label="Carregando catálogo">
      <p role="status" className="sr-only">Carregando produtos do catálogo.</p>
      <div className="mb-8 h-8 w-64 animate-pulse rounded bg-[var(--color-border)]" />
      <div className="catalog-layout grid grid-cols-1 items-start gap-8 lg:grid-cols-[296px_minmax(0,1fr)]">
        <div className="hidden h-96 rounded-2xl border border-[var(--color-border)] bg-white lg:block" aria-hidden="true" />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 min-[1280px]:grid-cols-4 2xl:gap-6" aria-hidden="true">
          {Array.from({ length: 24 }, (_, index) => (
            <div key={index} className="animate-pulse overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white">
              <div className="aspect-[4/3] bg-[var(--color-background)]" />
              <div className="space-y-3 p-4"><div className="h-4 w-3/4 rounded bg-[var(--color-border)]" /><div className="h-3 w-1/2 rounded bg-[var(--color-border)]" /><div className="h-5 w-1/3 rounded bg-[var(--color-border)]" /></div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
