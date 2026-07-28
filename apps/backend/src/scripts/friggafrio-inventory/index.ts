import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { downloadGoogleSheetWorkbook } from "./download-google-sheet"
import { parseWorkbook } from "./parse-workbook"
import { validateWorkbook } from "./validate-workbook"
import { normalizeRow } from "./normalize-row"
import { readMedusaState, saveLogicalBackup } from "./medusa-reader"
import { buildSyncPlan } from "./build-sync-plan"
import { SPREADSHEET_EXPORT_URL } from "./config"
import { generateSyncJournal, generatePublicReport } from "./report"

export default async function runInventorySync({ container }: { container: MedusaContainer }) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const args = process.argv.slice(2)
  const isApply = args.includes("--apply")

  logger.info(`Iniciando FASE INVENTÁRIO 0-B (${isApply ? "APPLY" : "DRY-RUN"})`)

  let expectedSha: string | null = null
  if (isApply) {
    if (!args.includes("--confirm=APLICAR_ESTOQUE_FRIGGAFRIO")) {
      logger.error("Modo apply exige flag --confirm=APLICAR_ESTOQUE_FRIGGAFRIO")
      process.exit(1)
    }

    const shaFlag = args.find(a => a.startsWith("--source-sha="))
    if (!shaFlag) {
      logger.error("Modo apply exige flag --source-sha=<SHA_DO_DRY_RUN>")
      process.exit(1)
    }
    expectedSha = shaFlag.split("=")[1]
  }

  logger.info("Baixando planilha original dinamicamente...")
  const downloaded = await downloadGoogleSheetWorkbook(SPREADSHEET_EXPORT_URL)
  logger.info(`Planilha SHA-256: ${downloaded.sha256}`)
  logger.info(`Tamanho: ${downloaded.size} bytes`)

  if (isApply && expectedSha !== downloaded.sha256) {
    logger.error(`O SHA-256 da planilha mudou! Esperado: ${expectedSha}, Atual: ${downloaded.sha256}`)
    logger.error("Execute o dry-run novamente para aprovar a nova versão.")
    process.exit(1)
  }

  logger.info("Analisando workbook...")
  const workbook = parseWorkbook(downloaded.buffer)

  if (workbook.unknownSheets.length > 0) {
    logger.warn(`Abas desconhecidas encontradas (ignoradas): ${workbook.unknownSheets.join(", ")}`)
    if (isApply) {
      logger.error("Bloqueando apply devido a abas desconhecidas (UNKNOWN_SHEET). Configure-as antes.")
      process.exit(1)
    }
  }

  logger.info("Validando formato...")
  const validation = validateWorkbook(workbook.parsedSheets)

  if (validation.errors.length > 0) {
    logger.warn(`Encontrados ${validation.errors.length} erros de validação:`)
    validation.errors.slice(0, 10).forEach(e => logger.warn(` - ${e}`))
    if (validation.errors.length > 10) logger.warn(`   ...e mais ${validation.errors.length - 10} erros.`)
  }

  logger.info("Normalizando registros e aplicando regras de negócio...")
  const canonicalProducts = validation.validRows.map(normalizeRow)

  logger.info("Lendo estado do Medusa (somente leitura)...")
  const medusaState = await readMedusaState(container)

  // Validate single stock location / sales channel mapping
  if (!medusaState.stockLocations || medusaState.stockLocations.length === 0) {
    logger.error("Nenhuma Stock Location encontrada no Medusa.")
    process.exit(1)
  }
  if (!medusaState.salesChannels || medusaState.salesChannels.length === 0) {
    logger.error("Nenhum Sales Channel encontrado no Medusa.")
    process.exit(1)
  }

  const stockLocationId = process.env.INVENTORY_SYNC_STOCK_LOCATION_ID || medusaState.stockLocations[0].id
  const salesChannelId = process.env.INVENTORY_SYNC_SALES_CHANNEL_ID || medusaState.salesChannels[0].id

  if (medusaState.stockLocations.length > 1 && !process.env.INVENTORY_SYNC_STOCK_LOCATION_ID) {
    logger.warn(`Múltiplas Stock Locations. Usando a primeira (${stockLocationId}). Configure INVENTORY_SYNC_STOCK_LOCATION_ID para travar.`)
    if (isApply) {
       logger.error("Múltiplas localizações exigem configuração explícita no modo apply.")
       process.exit(1)
    }
  }

  logger.info(`Stock Location Alvo: ${stockLocationId}`)
  logger.info(`Sales Channel Alvo: ${salesChannelId}`)

  let backupPathStr: string | null = null
  if (isApply) {
    logger.info("Criando backup lógico...")
    backupPathStr = saveLogicalBackup(medusaState)
    logger.info(`Backup salvo em: ${backupPathStr}`)
  }

  logger.info("Gerando plano determinístico...")
  const plan = buildSyncPlan(canonicalProducts, medusaState)

  const journal = generateSyncJournal(plan, isApply ? "apply" : "dry-run", downloaded.sha256, backupPathStr)

  logger.info("=".repeat(50))
  logger.info(`PLAN SUMMARY (${isApply ? "APPLY" : "DRY-RUN"})`)
  logger.info("=".repeat(50))
  logger.info(`CREATE:    ${journal.created}`)
  logger.info(`UPDATE:    ${journal.updated}`)
  logger.info(`PUBLISH:   ${journal.published}`)
  logger.info(`DRAFT:     ${journal.drafted}`)
  logger.info(`ARCHIVE:   ${journal.archived}`)
  logger.info(`NO CHANGE: ${journal.unchanged}`)
  logger.info(`ERROR:     ${journal.errors}`)
  logger.info("=".repeat(50))

  const baseCommit = "48c785288ff139b08e2cc367e6c6bb8fe8e8dc03"
  const realCommit = "9e1fadf8157a455cd9d9569c9c73598bf0b1ebdf"

  generatePublicReport(journal, plan, medusaState, downloaded.sha256, backupPathStr, baseCommit, realCommit)

  if (!isApply) {
    logger.info(`DRY-RUN concluído. Zero writes executados.`)
    logger.info(`Para aplicar, execute novamente com:`)
    logger.info(`--apply --confirm=APLICAR_ESTOQUE_FRIGGAFRIO --source-sha=${downloaded.sha256}`)
    process.exit(0)
  }

  // TODO: Lock implementation (omitted until needed to verify dry run)
  logger.info("Modo de aplicação ativado. No entanto, por segurança, os métodos de mutação não estão implementados nesta fase.")
  logger.info("Zero writes executados. Relatório gerado em memória.")

  process.exit(0)
}
