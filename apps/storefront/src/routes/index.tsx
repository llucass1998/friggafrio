import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    // Explicitly enforce canonical navigation to /br
    // Do not use stored cookies or dynamic defaults for the root redirect
    throw redirect({
      to: "/$countryCode",
      params: { countryCode: "br" },
    })
  },
})
