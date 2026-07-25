import { Link, useParams } from "@tanstack/react-router"
import { ShoppingBag, MagnifyingGlass, User, XMark } from "@medusajs/icons"

// Simple hamburger menu icon
function MenuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}
import { useCart } from "@/lib/hooks/use-cart"
import { useState } from "react"

export function Navbar() {
  const { data: cart } = useCart()
  const params = useParams({ strict: false })
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  const itemCount = cart?.items?.length ?? 0
  const countryCode = (params as { countryCode?: string })?.countryCode || "us"

  return (
    <>
      {/* Clean minimal header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo - simple wordmark */}
            <Link
              to="/$countryCode"
              params={{ countryCode }}
              className="text-xl font-semibold tracking-tight text-gray-900"
            >
              ForkliftPro
            </Link>

            {/* Center nav - desktop */}
            <nav className="hidden md:flex items-center gap-8">
              <Link
                to="/$countryCode/store"
                params={{ countryCode }}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                All Equipment
              </Link>
              <Link
                to="/$countryCode/categories/$handle"
                params={{ countryCode, handle: "forklifts" }}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Forklifts
              </Link>
              <Link
                to="/$countryCode/categories/$handle"
                params={{ countryCode, handle: "material-handlers" }}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Material Handlers
              </Link>
              <Link
                to="/$countryCode/categories/$handle"
                params={{ countryCode, handle: "parts-accessories" }}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Parts
              </Link>
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-4">
              {/* Search toggle */}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2 text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
                aria-label="Search"
              >
                <MagnifyingGlass className="w-5 h-5" />
              </button>

              {/* Account */}
              <Link
                to={"/$countryCode/account" as string}
                params={{ countryCode }}
                className="hidden sm:block p-2 text-gray-500 hover:text-gray-900 transition-colors"
              >
                <User className="w-5 h-5" />
              </Link>

              {/* Cart */}
              <Link
                to="/$countryCode/cart"
                params={{ countryCode }}
                className="relative p-2 text-gray-500 hover:text-gray-900 transition-colors"
              >
                <ShoppingBag className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-gray-900 text-white text-xs rounded-full flex items-center justify-center font-medium">
                    {itemCount}
                  </span>
                )}
              </Link>

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
                aria-label="Menu"
              >
                {mobileMenuOpen ? (
                  <XMark className="w-5 h-5" />
                ) : (
                  <MenuIcon className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Search bar - expandable */}
        {searchOpen && (
          <div className="border-t border-gray-100 bg-white">
            <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
              <div className="relative max-w-xl mx-auto">
                <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search equipment..."
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border-0 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
                  autoFocus
                />
              </div>
            </div>
          </div>
        )}

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white">
            <nav className="px-6 py-4 space-y-1">
              <Link
                to="/$countryCode/store"
                params={{ countryCode }}
                onClick={() => setMobileMenuOpen(false)}
                className="block py-3 text-gray-900 font-medium"
              >
                All Equipment
              </Link>
              <Link
                to="/$countryCode/categories/$handle"
                params={{ countryCode, handle: "forklifts" }}
                onClick={() => setMobileMenuOpen(false)}
                className="block py-3 text-gray-600"
              >
                Forklifts
              </Link>
              <Link
                to="/$countryCode/categories/$handle"
                params={{ countryCode, handle: "material-handlers" }}
                onClick={() => setMobileMenuOpen(false)}
                className="block py-3 text-gray-600"
              >
                Material Handlers
              </Link>
              <Link
                to="/$countryCode/categories/$handle"
                params={{ countryCode, handle: "parts-accessories" }}
                onClick={() => setMobileMenuOpen(false)}
                className="block py-3 text-gray-600"
              >
                Parts
              </Link>
              <div className="pt-4 border-t border-gray-100">
                <Link
                  to={"/$countryCode/account" as string}
                  params={{ countryCode }}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-3 text-gray-600"
                >
                  Account
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>
    </>
  )
}

export default Navbar
