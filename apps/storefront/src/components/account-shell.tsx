import { useEffect, useRef, type ReactNode } from "react"
import { Link, useLocation, useNavigate, useParams } from "@tanstack/react-router"
import {
  Building2,
  Heart,
  LayoutDashboard,
  LogOut,
  MapPin,
  ShoppingBag,
  FileText,
  UserRound,
} from "lucide-react"
import { useAuth } from "@/lib/hooks/use-auth"
import { DEFAULT_COUNTRY_CODE } from "@/config/commerce"
import { defaultAuthenticatedPath, normalizeReturnTo } from "@/lib/auth/return-to"

type AccountTab = "profile" | "company"

type AccountNavItem = {
  id: string
  label: string
  href: string
  tab?: AccountTab
  icon: typeof LayoutDashboard
}

const baseNavItems: AccountNavItem[] = [
  {
    id: "overview",
    label: "Visão geral",
    href: "/$countryCode/account/",
    icon: LayoutDashboard,
  },
  {
    id: "favorites",
    label: "Favoritos",
    href: "/$countryCode/favorites",
    icon: Heart,
  },
  {
    id: "orders",
    label: "Pedidos",
    href: "/$countryCode/account/orders",
    icon: ShoppingBag,
  },
  {
    id: "quotes",
    label: "Orçamentos",
    href: "/$countryCode/quotes",
    icon: FileText,
  },
]

const profileNavItem: AccountNavItem = {
  id: "profile",
  label: "Perfil",
  href: "/$countryCode/account/",
  tab: "profile",
  icon: UserRound,
}

const companyNavItem: AccountNavItem = {
  id: "company",
  label: "Empresa",
  href: "/$countryCode/account/",
  tab: "company",
  icon: Building2,
}

const addressesNavItem: AccountNavItem = {
  id: "addresses",
  label: "Endereços",
  href: "/$countryCode/account/addresses",
  icon: MapPin,
}

function AccountNavLink({
  item,
  countryCode,
  active,
  onNavigate,
}: {
  item: AccountNavItem
  countryCode: string
  active: boolean
  onNavigate?: () => void
}) {
  const Icon = item.icon

  return (
    <Link
      to={item.href as string}
      params={{ countryCode }}
      search={item.tab ? { tab: item.tab } : undefined}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
        active
          ? "bg-sky-100 text-slate-900 shadow-sm ring-1 ring-sky-200"
          : "text-slate-600 hover:bg-sky-50 hover:text-slate-900"
      }`}
    >
      <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
      <span>{item.label}</span>
    </Link>
  )
}

function isActiveItem(item: AccountNavItem, pathname: string, search: string): boolean {
  if (item.id === "favorites") return pathname.endsWith("/favorites")
  if (item.id === "orders") return pathname.endsWith("/account/orders")
  if (item.id === "addresses") return pathname.endsWith("/account/addresses")
  if (item.id === "quotes") return pathname.endsWith("/quotes")
  if (!pathname.endsWith("/account") && !pathname.endsWith("/account/")) return false
  const tab = new URLSearchParams(search).get("tab")
  if (!item.tab) return !tab
  if (!tab) return false
  return tab === item.tab
}

export function AccountShell({ children }: { children: ReactNode }) {
  const { countryCode: routeCountryCode } = useParams({ strict: false })
  const countryCode = routeCountryCode || DEFAULT_COUNTRY_CODE
  const location = useLocation()
  const navigate = useNavigate()
  const { authState, customer, employee, logout } = useAuth()
  const redirectingRef = useRef(false)
  const isAdmin = employee?.is_admin === true

  const navItems = [
    ...baseNavItems,
    profileNavItem,
    addressesNavItem,
    ...(isAdmin ? [companyNavItem] : []),
  ]
  const locationSearch =
    typeof location.search === "string"
      ? location.search
      : new URLSearchParams(location.search as Record<string, string>).toString()
  const routeMinHeight = location.pathname.endsWith("/account/orders")
    ? "35rem"
    : location.pathname.endsWith("/favorites")
      ? "60rem"
      : "31rem"

  useEffect(() => {
    if (authState === "authenticated") {
      redirectingRef.current = false
      return
    }
    // The previous route can remain mounted briefly while the router commits
    // the login navigation. Never redirect the login entrypoint back to itself.
    if (/\/account\/login\/?$/.test(location.pathname)) return
    if (authState !== "guest" || redirectingRef.current) return
    redirectingRef.current = true
    const currentPath = `${location.pathname}${locationSearch ? `?${locationSearch}` : ""}`
    void navigate({
      to: "/$countryCode/account/login",
      params: { countryCode },
      search: { returnTo: normalizeReturnTo(currentPath, countryCode) },
      replace: true,
    })
  }, [authState, countryCode, location.pathname, locationSearch, navigate])

  if (authState !== "authenticated") {
    return (
      <div
        className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8"
        style={{ minHeight: routeMinHeight }}
        aria-busy="true"
      >
        <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
        <div className="mt-6 h-40 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    )
  }

  const handleLogout = async () => {
    await logout()
    window.location.replace(defaultAuthenticatedPath(countryCode))
  }

  return (
    <div
      data-account-shell
      className="mx-auto flex w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
      style={{ minHeight: routeMinHeight }}
    >
      <aside
        aria-label="Account navigation"
        data-account-nav-desktop
        className="hidden w-56 shrink-0 md:block"
      >
        <div className="sticky top-24 space-y-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="border-b border-slate-100 px-2 pb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">Minha conta</p>
            <p className="mt-1 truncate text-sm font-medium text-slate-900">
              {customer?.first_name || customer?.email || "Cliente"}
            </p>
          </div>
          <nav className="space-y-1" aria-label="Account sections">
            {navItems.map((item) => (
              <AccountNavLink
                key={item.id}
                item={item}
                countryCode={countryCode}
                active={isActiveItem(item, location.pathname, locationSearch)}
              />
            ))}
          </nav>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-700"
          >
            <LogOut aria-hidden="true" className="h-4 w-4 shrink-0" />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <nav
          aria-label="Account navigation"
          data-account-nav-mobile
          className="mb-5 overflow-x-auto md:hidden"
        >
          <div className="flex min-w-max gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
            {navItems.map((item) => (
              <AccountNavLink
                key={item.id}
                item={item}
                countryCode={countryCode}
                active={isActiveItem(item, location.pathname, locationSearch)}
              />
            ))}
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Log out"
              className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-700"
            >
              <LogOut aria-hidden="true" className="h-4 w-4 shrink-0" />
              <span>Sair</span>
            </button>
          </div>
        </nav>
        {children}
      </div>
    </div>
  )
}

export default AccountShell
