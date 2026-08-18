import { Link, useLoaderData, useNavigate, useSearch } from "@tanstack/react-router"
import { HttpTypes } from "@medusajs/types"
import { PublicProductCard } from "@/components/public-product-card"
import { ChevronRight } from "@medusajs/icons"
import { DEFAULT_COUNTRY_CODE } from "@/config/commerce"

interface CategoryPageData {
  category: HttpTypes.StoreProductCategory
  products: HttpTypes.StoreProduct[]
  count?: number
  region: HttpTypes.StoreRegion
  countryCode: string
  page?: number
  pageSize?: number
}

export function CategoryPage() {
  const loaderData = useLoaderData({ strict: false }) as CategoryPageData | undefined
  const { category, products = [], count = products.length, page = 1, pageSize = 24, countryCode = DEFAULT_COUNTRY_CODE } = loaderData || {}
  const navigate = useNavigate()
  const search = useSearch({ strict: false }) as { page?: number }
  const currentPage = search?.page ?? page
  const totalPages = Math.max(1, Math.ceil(count / pageSize))

  const goToPage = (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages || nextPage === currentPage) return
    navigate({
      to: ".",
      search: { page: nextPage },
    })
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[var(--color-navy)] mb-2">Categoria não encontrada</h1>
          <p className="text-[var(--color-text-muted)] mb-6">A categoria solicitada não existe ou foi removida.</p>
          <Link
            to={"/$countryCode/store" as string}
            params={{ countryCode }}
            className="inline-flex px-5 py-2.5 bg-[var(--color-primary)] text-white font-semibold rounded-[var(--radius-button)] hover:bg-[var(--color-primary-hover)] transition-colors"
          >
            Voltar ao catálogo
          </Link>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-[var(--color-background)]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 overflow-x-auto whitespace-nowrap text-sm text-[var(--color-text-muted)]">
          <Link to={"/$countryCode" as string} params={{ countryCode }} className="hover:text-[var(--color-primary)] transition-colors">
            Home
          </Link>
          <ChevronRight className="h-4 w-4 shrink-0" />
          <Link to={"/$countryCode/store" as string} params={{ countryCode }} className="hover:text-[var(--color-primary)] transition-colors">
            Catálogo
          </Link>
          <ChevronRight className="h-4 w-4 shrink-0" />
          <span className="font-medium text-[var(--color-navy)]">{category.name}</span>
        </nav>

        <div className="mb-7 flex flex-col gap-4 border-b border-[var(--color-border)] pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[var(--color-navy)] md:text-4xl">{category.name}</h1>
            {category.description && (
              <p className="mt-2 max-w-2xl text-[var(--color-text-muted)]">{category.description}</p>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm text-[var(--color-text-muted)]">
            <span className="font-medium text-[var(--color-navy)]">
              {count} {count === 1 ? "produto encontrado" : "produtos encontrados"}
            </span>
            <span aria-hidden="true" className="hidden h-4 w-px bg-[var(--color-border)] sm:block" />
            <span className="hidden sm:inline">{pageSize} por página</span>
          </div>
        </div>

        {products.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
              {products.map((product) => (
                <PublicProductCard key={product.id} product={product} />
              ))}
            </div>

            {totalPages > 1 && (
              <nav aria-label="Paginação da categoria" className="mt-10 flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="rounded-[var(--radius-button-sm)] border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--color-navy)] transition-colors hover:border-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Anterior
                </button>
                <span className="text-sm font-medium text-[var(--color-text-muted)]">
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="rounded-[var(--radius-button-sm)] border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--color-navy)] transition-colors hover:border-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Próxima
                </button>
              </nav>
            )}
          </>
        ) : (
          <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white p-12 text-center">
            <p className="mb-4 text-[var(--color-text-muted)]">Nenhum produto encontrado nesta categoria.</p>
            <Link
              to={"/$countryCode/categories" as string} params={{ countryCode }}
              className="inline-flex items-center gap-2 rounded-[var(--radius-button)] bg-[var(--color-primary)] px-5 py-2.5 font-semibold text-white transition-colors hover:bg-[var(--color-primary-hover)]"
            >
              Voltar para categorias
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}

export default CategoryPage
