import { Link } from "@tanstack/react-router"
import { demoProducts } from "../../data/demo/products"

export function FeaturedProducts() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--color-navy)] mb-2">Produtos em Destaque</h2>
            <p className="text-[var(--color-text-muted)] text-sm md:text-base">As soluções mais procuradas para o seu projeto</p>
          </div>
          <Link 
            to="/" 
            className="hidden md:inline-flex text-sm font-semibold text-[var(--color-primary)] hover:text-[var(--color-accent)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] rounded-sm"
          >
            Ver todos os produtos
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {demoProducts.map((product) => (
            <div 
              key={product.id}
              className="flex flex-col bg-white rounded-[var(--radius-card)] border border-[var(--color-border)] overflow-hidden hover:shadow-md transition-shadow"
            >
              <Link to="/" className="relative aspect-square bg-[var(--color-surface-soft)] p-6 group focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-accent)] block">
                {product.images[0] ? (
                  <img 
                    src={product.images[0].url} 
                    alt={product.images[0].alt} 
                    className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[var(--color-text-muted)]">
                    Sem imagem
                  </div>
                )}
              </Link>
              
              <div className="p-5 flex flex-col flex-1">
                <div className="text-xs font-semibold text-[var(--color-text-muted)] mb-1 uppercase tracking-wide">
                  {product.brand}
                </div>
                <Link to="/" className="mb-2 focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] rounded-sm">
                  <h3 className="font-bold text-[var(--color-navy)] leading-tight hover:text-[var(--color-primary)] transition-colors line-clamp-2">
                    {product.name}
                  </h3>
                </Link>
                
                <div className="text-xs text-[var(--color-text-muted)] mb-4">
                  Ref: {product.sku}
                </div>
                
                <div className="mt-auto pt-4 border-t border-[var(--color-border)]">
                  {product.isDemoPrice ? (
                    <div className="flex flex-col gap-1 mb-4">
                      <span className="text-xs text-[var(--color-text-muted)] italic">Preço demonstrativo</span>
                      <span className="text-lg font-bold text-[var(--color-text)]">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1 mb-4">
                      <span className="text-xs text-[var(--color-text-muted)] italic">Consulte o valor</span>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-2">
                    {product.allowDirectPurchase && (
                      <button className="w-full py-2.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-sm font-semibold rounded-[var(--radius-button-sm)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]">
                        Comprar
                      </button>
                    )}
                    <button className={`w-full py-2.5 bg-white border border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-surface-soft)] text-sm font-semibold rounded-[var(--radius-button-sm)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] ${!product.allowDirectPurchase ? 'col-span-2' : ''}`}>
                      Orçamento
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
