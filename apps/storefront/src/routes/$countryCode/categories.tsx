import { createFileRoute, Outlet } from "@tanstack/react-router"

export const Route = createFileRoute("/$countryCode/categories")({
  component: () => <Outlet />,
})
