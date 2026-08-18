import { Link, useLoaderData } from "@tanstack/react-router"
import { HttpTypes } from "@medusajs/types"
import { CategoryIllustration } from "@/components/home/FeaturedCategories"

type CategoriesPageData = {
  countryCode: string
  categories: HttpTypes.StoreProductCategory[]
}

export default function CategoriesPage() {
  const { countryCode, categories = [] } = useLoaderData({ strict: false }) as CategoriesPageData
  const visibleCategories = categories

  return (
    <main className="min-h-screen bg-[var(--color-background)]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:py-10 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
          <Link
            to="/$countryCode"
            params={{ countryCode }}
            className="rounded-sm transition-colors hover:text-[var(--color-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
          >
            Home
          </Link>
          <span aria-hidden="true">/</span>
          <span className="font-medium text-[var(--color-navy)]">Categorias</span>
        </nav>

        <header className="mb-8 flex flex-col gap-2 border-b border-[var(--color-border)] pb-6 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[var(--color-navy)] md:text-4xl">Todas as categorias</h1>
            <p className="mt-2 max-w-2xl text-sm text-[var(--color-text-muted)] md:text-base">
              Encontre rapidamente equipamentos e componentes para refrigeração.
            </p>
          </div>
          <span className="text-sm font-medium text-[var(--color-text-muted)]">
            {visibleCategories.length} {visibleCategories.length === 1 ? "categoria" : "categorias"}
          </span>
        </header>

        {visibleCategories.length === 0 ? (
          <p className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white p-10 text-center text-[var(--color-text-muted)]">
            Nenhuma categoria encontrada no momento.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
            {visibleCategories.map((category) => (
              <Link
                key={category.id}
                to="/$countryCode/categories/$handle"
                params={{ countryCode, handle: category.handle }}
                aria-label={`Abrir categoria ${category.name}`}
                className="group flex min-h-[136px] flex-col items-center justify-start gap-2 px-3 py-4 text-center transition-transform duration-[var(--motion-duration-card)] hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
              >
                <CategoryIllustration handle={category.handle} name={category.name} />
                <h2 className="line-clamp-2 text-sm font-semibold leading-snug text-[var(--color-navy)] transition-colors group-hover:text-[var(--color-primary)]">{category.name}</h2>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
