import { ExecArgs } from "@medusajs/framework/types"
import { setLayoutConfigurationWorkflow } from "@medusajs/core-flows"

/**
 * Persists the canonical FriggaFrio Medusa Admin sidebar layout.
 * Ensures "Gestão de Catálogo" is positioned directly below "Buscar" (rank 1),
 * followed by "Visão Geral", "Pedidos", "Produtos", etc.
 */
export default async function seedAdminSidebarLayout({ container }: ExecArgs) {
  const logger = container.resolve("logger")
  logger.info("[Layout] Seeding default Admin sidebar layout configuration...")

  await setLayoutConfigurationWorkflow(container).run({
    input: {
      zone: "sidebar",
      is_default: true,
      configuration: {
        widgets: {
          "core:Searchbar": { order: 0, hidden: false },
          "core:nav:/catalog": { order: 1, hidden: false },
          "core:nav:/overview": { order: 2, hidden: false },
          "core:nav:/orders": { order: 3, hidden: false },
          "core:nav:/products": { order: 4, hidden: false },
          "core:nav:/inventory": { order: 5, hidden: false },
          "core:nav:/customers": { order: 6, hidden: false },
          "core:nav:/promotions": { order: 7, hidden: false },
          "core:nav:/price-lists": { order: 8, hidden: false },
          "core:nav:/omie-products": { order: 9, hidden: false },
          "core:nav:/quotes": { order: 10, hidden: false },
          "core:nav:/companies": { order: 11, hidden: false },
          "core:nav:/product-reviews": { order: 12, hidden: false },
        },
      },
    },
  })

  logger.info("[Layout] Default Admin sidebar layout configured successfully.")
}
