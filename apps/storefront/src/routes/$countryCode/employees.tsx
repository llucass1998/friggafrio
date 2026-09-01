import { createFileRoute } from "@tanstack/react-router"
import EmployeesPage from "@/pages/employees"
import { pageMeta } from "@/lib/seo"

export const Route = createFileRoute("/$countryCode/employees")({
  head: ({ params }) => pageMeta({
    title: "Colaboradores | FriggaFrio",
    description: "Gerencie os colaboradores autorizados da sua empresa.",
    path: `/${params.countryCode}/employees`,
    indexable: false,
  }),
  component: EmployeesPage,
})
