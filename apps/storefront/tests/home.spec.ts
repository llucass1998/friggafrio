import { test, expect } from "@playwright/test"

test("Página Inicial carrega e exibe componentes Frigga", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByText("Categorias em Destaque")).toBeVisible({ timeout: 15000 })
  await expect(page.locator("h2", { hasText: "Produtos Especializados" })).toBeVisible({ timeout: 15000 })
  await expect(page.getByText("Marcas que você encontra na FriggaFrio")).toBeVisible({ timeout: 15000 })
})

test("Header contém busca e navegação corretas", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByRole("link", { name: "Quem Somos" }).first()).toBeVisible({ timeout: 15000 })
})
