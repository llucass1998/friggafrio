import { Link } from "@tanstack/react-router"
import { demoCategories } from "../../data/demo/categories"

export function FeaturedCategories() {
  return (
    <section className="py-16 bg-[var(--color-background)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--color-navy)] mb-2">Categorias em Destaque</h2>
            <p className="text-[var(--color-text-muted)] text-sm md:text-base">Navegue pelas principais linhas de produtos</p>
          </div>
          <Link 
            to="/" 
            className="hidden md:inline-flex text-sm font-semibold text-[var(--color-primary)] hover:text-[var(--color-accent)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] rounded-sm"
          >
            Ver todas as categorias
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {demoCategories.map((category) => (
            <Link
              key={category.id}
              to="/"
              className="group flex flex-col items-center text-center p-6 bg-white rounded-[var(--radius-card)] border border-[var(--color-border)] hover:border-[var(--color-primary)] hover:shadow-md transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
            >
              <div className="w-16 h-16 rounded-full bg-[var(--color-surface-soft)] flex items-center justify-center mb-4 group-hover:bg-[var(--color-primary)] transition-colors">
                <span className="text-2xl text-[var(--color-primary)] group-hover:text-white">
                  {category.name.charAt(0)}
                </span>
              </div>
              <h3 className="font-semibold text-[var(--color-navy)] text-sm">{category.name}</h3>
            </Link>
          ))}
        </div>
        
        <div className="mt-6 text-center md:hidden">
          <Link 
            to="/" 
            className="inline-flex items-center justify-center w-full py-3 text-sm font-semibold text-[var(--color-primary)] bg-[var(--color-surface-soft)] rounded-[var(--radius-button)] hover:bg-[var(--color-border)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
          >
            Ver todas as categorias
          </Link>
        </div>
      </div>
    </section>
  )
}
