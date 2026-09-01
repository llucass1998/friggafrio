import { createFileRoute } from "@tanstack/react-router"
import { adminProxyHandlers } from "@/lib/server/admin-proxy"

export const Route = createFileRoute("/admin/")({
  server: {
    handlers: adminProxyHandlers,
  },
})
