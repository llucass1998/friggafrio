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
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "auto"
    }
    return () => {
      document.body.style.overflow = "auto"
    }
  }, [isOpen])

  const toggleCategory = (id: string) => {
    setExpandedCategory(expandedCategory === id ? null : id)
  }

  const closeDrawer = () => setIsOpen(false)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        closeDrawer()
      }
    }
    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [isOpen])

  return (
    <>
      <button
        className="lg:hidden p-2 -ml-2 text-[var(--color-navy)] hover:text-[var(--color-primary)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] rounded-md"
        onClick={() => setIsOpen(true)}
        aria-label="Abrir menu mobile"
        aria-expanded={isOpen}
        aria-controls="mobile-menu-drawer"
      >
        <Menu className="w-6 h-6" aria-hidden="true" />
      </button>

      <div
        id="mobile-menu-drawer"
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
            <X className="w-6 h-6" aria-hidden="true" />
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
                      aria-expanded={expandedCategory === cat.id}
                    >
                      {cat.label}
                      <span className="text-xl leading-none" aria-hidden="true">
                        {expandedCategory === cat.id ? "-" : "+"}
                      </span>
                    </button>
                    {expandedCategory === cat.id && cat.children && (
                      <ul className="bg-[var(--color-surface)] rounded-md mt-1 mb-2 py-2 overflow-hidden">
                        {cat.children.map((child) => {
                          // Extract category query parameter safely to use in statically typed link
                          const categoryParam = new URL(child.href, "http://localhost").searchParams.get("category")
                          const queryParam = new URL(child.href, "http://localhost").searchParams.get("q")

                          // TanStack router type fix - Explicitly defining search based on properties available
                          // instead of spreading an empty object
                          return (
                            <li key={child.id}>
                              {categoryParam ? (
                                <Link
                                  to="/$countryCode/store"
                                  params={{ countryCode: "br" }}
                                  search={{ category: categoryParam }}
                                  onClick={closeDrawer}
                                  className="block px-8 py-2 text-sm text-[var(--color-text)] hover:text-[var(--color-primary)] transition-colors"
                                >
                                  {child.label}
                                </Link>
                              ) : queryParam ? (
                                <Link
                                  to="/$countryCode/store"
                                  params={{ countryCode: "br" }}
                                  search={{ q: queryParam }}
                                  onClick={closeDrawer}
                                  className="block px-8 py-2 text-sm text-[var(--color-text)] hover:text-[var(--color-primary)] transition-colors"
                                >
                                  {child.label}
                                </Link>
                              ) : (
                                <Link
                                  to="/$countryCode/store"
                                  params={{ countryCode: "br" }}
                                  onClick={closeDrawer}
                                  className="block px-8 py-2 text-sm text-[var(--color-text)] hover:text-[var(--color-primary)] transition-colors"
                                >
                                  {child.label}
                                </Link>
                              )}
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </li>
                ))}
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

      {isOpen && (
        <div
          data-testid="mobile-menu-overlay"
          className="fixed inset-y-0 right-0 w-[15%] bg-black/50 z-50 lg:hidden transition-opacity"
          onClick={closeDrawer}
          aria-hidden="true"
        />
      )}
    </>
  )
}
