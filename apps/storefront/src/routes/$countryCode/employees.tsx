import { createFileRoute } from "@tanstack/react-router"
import EmployeesPage from "@/pages/employees"

export const Route = createFileRoute("/$countryCode/employees")({
  component: EmployeesPage,
  head: () => {
    return {
      meta: [
        {
          title: "Employees | FriggaFrio",
        },
        {
          name: "description",
          content: "Manage your company's employee accounts and spending limits.",
        },
      ],
    }
  },
})
