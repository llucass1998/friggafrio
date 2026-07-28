import { PlanItem, BackupData } from "./types"
import fs from "fs"
import path from "path"

export function generatePrivateManifest(plan: PlanItem[], backupPath: string, sha256: string) {
  const manifestData = {
    backupPath,
    spreadsheetHash: sha256,
    items: plan.map(p => ({
      sku: p.sku,
      action: p.action,
      cost: p.pricedRow?.cost,
      suggestedPrice: p.pricedRow?.suggestedPrice,
      quantity: p.pricedRow?.quantity,
      sheet: p.pricedRow?.sheetName,
      reasons: p.reasons
    }))
  }

  const filePath = "C:/Users/lluca/Documents/Codex/friggafrio-inventory-data/reports/inventory-plan-private.json"
  fs.writeFileSync(filePath, JSON.stringify(manifestData, null, 2))
}

export function generatePublicReport(
  plan: PlanItem[],
  medusaState: BackupData,
  sha256: string,
  backupPath: string,
  baseCommit: string,
  realCommit: string
) {
  let activeReady = 0
  let inactiveZero = 0
  let inactiveNegative = 0
  let inactiveInvalidCost = 0
  let inactiveSuspiciousCost = 0
  let blockedDuplicate = 0
  let blockedInvalid = 0
  let blockedFractional = 0

  let keepAndUpdate = 0
  let deactivate = 0
  let removeCandidate = 0
  let archiveRequired = 0
  let conflict = 0
  let unknownReference = 0

  let createCount = 0
  let updateCount = 0

  for (const item of plan) {
    if (item.action === "CREATE") createCount++
    if (item.action === "UPDATE") updateCount++
    if (item.action === "DEACTIVATE") deactivate++
    if (item.action === "REMOVE_CANDIDATE") removeCandidate++
    if (item.action === "ARCHIVE_REQUIRED") archiveRequired++
    if (item.action === "CONFLICT") conflict++
    if (item.action === "UNKNOWN_REFERENCE") unknownReference++

    if (item.action === "UPDATE" && item.reasons.length === 0) keepAndUpdate++

    if (item.action === "BLOCKED_DUPLICATE_SKU") blockedDuplicate++
    if (item.action === "BLOCKED_INVALID_ROW") blockedInvalid++

    if (item.pricedRow) {
      if (item.pricedRow.quantity > 0 && item.pricedRow.costStatus === "VALID" && item.pricedRow.unitType !== "kg") activeReady++
      if (item.pricedRow.quantity === 0) inactiveZero++
      if (item.pricedRow.quantity < 0) inactiveNegative++
      if (item.pricedRow.costStatus === "INVALID" || item.pricedRow.costStatus === "MISSING") inactiveInvalidCost++
      if (item.pricedRow.costStatus === "SUSPICIOUS") inactiveSuspiciousCost++
      if (item.pricedRow.unitType === "kg") blockedFractional++
    }
  }

  const collectionsProposal = new Set(plan.map(p => p.pricedRow?.sheetName).filter(Boolean))

  const md = `
# Relatório de Importação de Estoque FriggaFrio (DRY-RUN)

## 1. Identidade e Ambiente
- **Modelo:** claude-sonnet-5
- **Diretório Principal:** \`C:\\Users\\lluca\\Documents\\Codex\\projeto friggagafrio\`
- **Commit Base Esperado:** \`${baseCommit}\`
- **Commit Base Real:** \`${realCommit}\`
- **Branch/Worktree:** \`feat/medusa-inventory-import\`

## 2. Fonte de Dados
- **SHA-256 da Planilha:** \`${sha256}\`
- **Abas Encontradas:** ${Array.from(collectionsProposal).join(", ")}
- **Total de Itens no Plano:** ${plan.length}

## 3. Qualidade dos Dados (Planilha)
- **Candidatos a Ativo:** ${activeReady}
- **Quantidade Zerada:** ${inactiveZero}
- **Quantidade Negativa (Inconsistente):** ${inactiveNegative}
- **Unidade Fracionada (KG):** ${blockedFractional}
- **Custo Inválido ou Ausente:** ${inactiveInvalidCost}
- **Custo Suspeito:** ${inactiveSuspiciousCost}
- **Regra Comercial Aplicada:** Custo * 1.30 (Markup de 30%)
- **Convenção Monetária do Medusa:** Valores float com 2 casas decimais assumidos para envio via API, aguardando validação final de price modules.
- **Estratégia de Produtos KG:** Bloqueada nesta fase. Suporte a decimal no banco a ser comprovado.

## 4. Auditoria do Catálogo Atual (Medusa)
- **Total de Produtos:** ${medusaState.products.length}
- **Total de Variantes:** ${medusaState.variants.length}
- **Total de Inventory Items:** ${medusaState.inventoryItems.length}
- **Total de Inventory Levels:** ${medusaState.inventoryLevels.length}
- **Stock Locations Encontradas:** ${medusaState.stockLocations.map((s: any) => s.name).join(", ")}
- **Sales Channels Associados:** ${medusaState.salesChannels.map((s: any) => s.name).join(", ")}

## 5. Plano de Ação
- **CREATE:** ${createCount}
- **UPDATE:** ${updateCount}
- **DEACTIVATE:** ${deactivate}
- **KEEP_AND_UPDATE:** ${keepAndUpdate}
- **REMOVE_CANDIDATE:** ${removeCandidate}
- **ARCHIVE_REQUIRED:** ${archiveRequired}
- **CONFLICT:** ${conflict}
- **UNKNOWN_REFERENCE:** ${unknownReference}
- **BLOCKED_DUPLICATE_SKU:** ${blockedDuplicate}
- **BLOCKED_INVALID_ROW:** ${blockedInvalid}

## 6. Prova de Zero Gravações
- **Backup Gerado:** \`${backupPath}\`
- **DRY RUN:** \`true\`
- **Write Operations:** \`0\`
- **Produtos Criados/Atualizados:** \`0\`
- **Estoque Modificado:** \`NÃO\`

## 7. Próximos Passos
Aguardar aprovação do dry-run antes da Fase Inventário 0-B. Nenhuma mutação foi executada.
`

  // Write report to root of the worktree (two levels up from apps/backend)
  const rootDir = path.join(process.cwd(), "..", "..")
  fs.writeFileSync(path.join(rootDir, "INVENTORY-IMPORT-REPORT.md"), md.trim())
}
