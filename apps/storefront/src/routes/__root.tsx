import { lazy, useEffect } from "react"
import { ErrorBoundary } from "@/components/error-boundary"
import Layout from "@/components/layout"
import { listRegions } from "@/lib/data/regions"
import { CartProvider } from "@/lib/context/cart"
import { AuthProvider } from "@/lib/context/auth-context"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router"
import { Toaster } from "sonner"
import { initSentry } from "@/lib/sentry"
import appCss from "@/styles/app.css?url"
import {
  organizationStructuredData,
  structuredDataScript,
  websiteStructuredData,
} from "@/lib/seo"

const NotFound = lazy(() => import("@/components/not-found"))

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  loader: async ({ context }) => {
    const { queryClient } = context

    // Pre-populate regions cache
    await queryClient.ensureQueryData({
      queryKey: ["regions"],
      queryFn: () =>
        listRegions({ fields: "id, name, currency_code, *countries" }),
    })

    return {}
  },
  head: () => ({
    links: [
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "shortcut icon", href: "/favicon.png" },
      { rel: "apple-touch-icon", href: "/favicon.png" },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
    ],
    meta: [
      { title: "FriggaFrio | Refrigeração e Ar Condicionado" },
      { charSet: "UTF-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1.0",
      },
      { property: "og:locale", content: "pt_BR" },
    ],
    scripts: [
      structuredDataScript(organizationStructuredData()),
      structuredDataScript(websiteStructuredData()),
    ],
  }),
  notFoundComponent: NotFound,
  component: RootComponent,
})

function RootComponent() {
  const { queryClient } = Route.useRouteContext()
  useEffect(() => {
    initSentry()
  }, [])
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <CartProvider>
              <ErrorBoundary>
                <Layout />
              </ErrorBoundary>
            </CartProvider>
          </AuthProvider>
        </QueryClientProvider>
        <Toaster
          position="top-right"
          offset={{ top: "1rem", right: "1rem" }}
          mobileOffset={{ top: "1rem", right: "1rem" }}
          richColors
        />

        <Scripts />
      </body>
    </html>
  )
}
