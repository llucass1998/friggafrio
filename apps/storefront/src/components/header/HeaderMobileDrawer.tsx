import { Link } from "@tanstack/react-router"
import { Menu, X } from "lucide-react"
import { useState, useEffect } from "react"
import { productCategories } from "@/components/header/categories"
import { HeaderSearch } from "@/components/header/HeaderSearch"
import { HeaderActions } from "@/components/header/HeaderActions"
import { HeaderLogo } from "@/components/header/HeaderLogo"

export function HeaderMobileDrawer() {
  const [isOpen, setIsOpen] = useState(false)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "auto"
    return () => {
      document.body.style.overflow = "auto"
    }
  }, [isOpen])

  const toggleCategory = (id: string) => {
    setExpandedCategory(expandedCategory === id ? null : id)
  }

  const closeDrawer = () => setIsOpen(false)

  return (
    <>
      <button
        className="lg:hidden p-2 -ml-2 text-[var(--color-navy)] hover:text-[var(--color-primary)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] rounded-md"
        onClick={() => setIsOpen(true)}
        aria-label="Abrir menu mobile"
      >
        <Menu className="w-6 h-6" />
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 lg:hidden transition-opacity"
          onClick={closeDrawer}
          aria-hidden="true"
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 w-[85%] max-w-sm bg-[var(--color-background)] shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col lg:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <div onClick={closeDrawer}>
            <HeaderLogo compact />
          </div>
          <button
            onClick={closeDrawer}
            className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors rounded-full hover:bg-[var(--color-surface-soft)]"
            aria-label="Fechar menu"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-4 border-b border-[var(--color-border)]">
            <HeaderSearch />
          </div>

          <nav className="p-2">
            <div className="mb-2">
              <h3 className="px-4 py-2 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                Produtos
              </h3>
              <ul className="space-y-1">
                {productCategories.map((cat) => (
                  <li key={cat.id}>
                    <button
                      onClick={() => toggleCategory(cat.id)}
                      className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-[var(--color-navy)] hover:bg-[var(--color-surface-soft)] rounded-md transition-colors"
                    >
                      {cat.label}
                      <span className="text-xl leading-none">
                        {expandedCategory === cat.id ? "-" : "+"}
                      </span>
                    </button>
                    {expandedCategory === cat.id && cat.children && (
                      <ul className="bg-[var(--color-surface)] rounded-md mt-1 mb-2 py-2 overflow-hidden">
                        {cat.children.map((child) => (
                          <li key={child.id}>
                            <Link
                              to={child.href as any}
                              onClick={closeDrawer}
                              className="block px-8 py-2 text-sm text-[var(--color-text)] hover:text-[var(--color-primary)] transition-colors"
                            >
                              {child.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="px-4 py-2 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                Institucional
              </h3>
              <ul className="space-y-1">
                <li>
                  <Link
                    to="/nossa-loja"
                    onClick={closeDrawer}
                    className="block px-4 py-3 text-sm font-medium text-[var(--color-navy)] hover:bg-[var(--color-surface-soft)] rounded-md transition-colors"
                  >
                    Nossa Loja
                  </Link>
                </li>
              </ul>
            </div>
          </nav>
        </div>

        <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-surface-soft)]">
          <div className="flex justify-around">
            <HeaderActions compact />
          </div>
        </div>
      </div>
    </>
  )
}
