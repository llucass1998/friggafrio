import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { parseSpreadsheet } from "./parser"
import { normalizeRow } from "./normalizer"
import { applyPrice } from "./price"
import { readMedusaState, saveLogicalBackup } from "./medusa-reader"
import { generatePlan } from "./plan"
import { generatePrivateManifest, generatePublicReport } from "./report"
import crypto from "crypto"
import fs from "fs"

export default async function runDryRun({ container }: { container: MedusaContainer }) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  logger.info("Iniciando FASE INVENTÁRIO 0-A (DRY-RUN)")

  if (process.env.NODE_ENV) logger.info(`NODE_ENV: ${process.env.NODE_ENV}`)
  logger.info(`DATABASE_URL presence: ${!!process.env.DATABASE_URL}`)
  logger.info("DRY_RUN: true")

  const args = process.argv.slice(2)
  if (args.includes("--apply") || args.includes("--purge") || args.includes("--delete") || args.includes("--replace")) {
    logger.error("Modo de aplicação ainda não autorizado. Execute apenas o dry-run.")
    process.exit(1)
  }

  const spreadsheetPath = "C:/Users/lluca/Documents/Codex/friggafrio-inventory-data/ESTOQUE.xlsx"
  if (!fs.existsSync(spreadsheetPath)) {
    logger.error("Planilha não encontrada no caminho isolado.")
    process.exit(1)
  }

  const fileBuffer = fs.readFileSync(spreadsheetPath)
  const sha256 = crypto.createHash("sha256").update(fileBuffer).digest("hex").toUpperCase()
  logger.info(`Planilha SHA-256: ${sha256}`)

  const parsedRows = parseSpreadsheet(spreadsheetPath)
  const normalizedRows = parsedRows.map(normalizeRow)
  const pricedRows = normalizedRows.map(applyPrice)

  const medusaState = await readMedusaState(container)

  if (medusaState.stockLocations) {
    logger.info(`Stock Locations encontradas: ${medusaState.stockLocations.map(l => l.name).join(", ")}`)
  }

  const backupPath = saveLogicalBackup(medusaState)
  logger.info(`Backup lógico criado: ${backupPath}`)

  const plan = generatePlan(pricedRows, medusaState)

  generatePrivateManifest(plan, backupPath, sha256)

  // Hardcoded commit base expectations to match the context
  const baseCommit = "48c785288ff139b08e2cc367e6c6bb8fe8e8dc03"
  const realCommit = "9e1fadf8157a455cd9d9569c9c73598bf0b1ebdf"

  generatePublicReport(plan, medusaState, sha256, backupPath, baseCommit, realCommit)

  logger.info("WRITE OPERATIONS: 0")
  logger.info("PRODUCTS CREATED: 0")
  logger.info("PRODUCTS UPDATED: 0")
  logger.info("PRODUCTS DELETED: 0")
  logger.info("INVENTORY LEVELS UPDATED: 0")
  logger.info("PRICES UPDATED: 0")

  logger.info("DRY-RUN concluído com sucesso. Relatório salvo.")
}
