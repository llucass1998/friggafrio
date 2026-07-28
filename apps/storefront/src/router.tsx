import { routeTree } from "@/routeTree.gen"
import { QueryClient } from "@tanstack/react-query"
import { createRouter as createTanStackRouter } from "@tanstack/react-router"
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query"
import { lazy } from "react"

const NotFound = lazy(() => import("@/components/not-found"))

export function createRouter() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // 5 minutes — critical queries (cart, checkout) override this individually
        staleTime: 1000 * 60 * 5,
        // Disable global refetch on focus; critical queries handle freshness via mutation invalidation
        refetchOnWindowFocus: false,
        // Enable refetch on reconnect
        refetchOnReconnect: true,
        // Retry failed requests
        retry: 1,
      },
    },
  })

  const router = createTanStackRouter({
    routeTree,
    context: { queryClient },
    defaultPreload: "intent", // Puxa os chunks sob demanda quando o usuário foca ou passa o mouse no link
    defaultNotFoundComponent: NotFound,
    scrollRestoration: true,
    defaultViewTransition: true,
  })
  setupRouterSsrQueryIntegration({
    router,
    queryClient,
  })

  return router
}

export function getRouter() {
  return createRouter()
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}
