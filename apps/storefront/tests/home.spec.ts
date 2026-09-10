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

test("home preserves category banners before commercial benefits", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto("/br", { waitUntil: "networkidle" })

  const hero = page.getByLabel("Destaques da FriggaFrio")
  const banners = page.getByLabel("Linhas de produtos FriggaFrio")
  const benefits = page.getByTestId("home-commercial-benefits")
  const specialized = page.getByTestId("home-specialized-products")

  await expect(banners.getByRole("img")).toHaveCount(3)
  await expect(benefits.getByText("Até 10x sem juros")).toBeVisible()
  await expect(benefits.getByText("Compra segura")).toBeVisible()

  const positions = await Promise.all([hero, banners, benefits, specialized].map((locator) => locator.evaluate((element) => element.getBoundingClientRect().top)))
  expect(positions[0]).toBeLessThan(positions[1])
  expect(positions[1]).toBeLessThan(positions[2])
  expect(positions[2]).toBeLessThan(positions[3])
  await page.screenshot({ path: testInfo.outputPath("home-banner-benefits-order.png"), fullPage: false })
})
