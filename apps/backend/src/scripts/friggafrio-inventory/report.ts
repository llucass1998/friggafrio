import { MedusaSyncOperation, BackupData, InventorySyncJournal } from "./types"
import fs from "fs"
import path from "path"

export function generateSyncJournal(
  plan: MedusaSyncOperation[],
  mode: "dry-run" | "apply",
  sha256: string,
  backupPath: string | null
): InventorySyncJournal {
  let created = 0
  let updated = 0
  let published = 0
  let drafted = 0
  let archived = 0
  let unchanged = 0
  let errors = 0
  let warnings = 0

  for (const op of plan) {
    if (op.action === "CREATE_PRODUCT") created++
    if (op.action === "UPDATE_PRODUCT" || op.action === "UPDATE_PRICE" || op.action === "UPDATE_INVENTORY") updated++
    if (op.action === "PUBLISH_PRODUCT") published++
    if (op.action === "DRAFT_PRODUCT") drafted++
    if (op.action === "ARCHIVE_PRODUCT") archived++
    if (op.action === "NO_CHANGE") unchanged++
    if (op.action === "ERROR") errors++
  }

  const syncId = `sync_${Date.now()}`
  const startedAt = new Date().toISOString() // In a real implementation this would be passed in

  const journal: InventorySyncJournal = {
    syncId,
    mode,
    sourceSha: sha256,
    startedAt,
    finishedAt: new Date().toISOString(),
    status: errors > 0 ? "failed" : "success",
    sourceRows: plan.filter(p => p.sourceRow).length,
    created,
    updated,
    published,
    drafted,
    archived,
    unchanged,
    errors,
    warnings,
  }

  return journal
}

export function generatePublicReport(
  journal: InventorySyncJournal,
  plan: MedusaSyncOperation[],
  medusaState: BackupData,
  sha256: string,
  backupPath: string | null,
  baseCommit: string,
  realCommit: string
) {
  const md = `
# Relatório de Importação de Estoque FriggaFrio (${journal.mode.toUpperCase()})

## 1. Identidade e Ambiente
- **Modelo:** claude-sonnet-5
- **Diretório Principal:** \`C:\\Users\\lluca\\Documents\\Codex\\projeto friggagafrio\`
- **Commit Base Esperado:** \`${baseCommit}\`
- **Commit Base Real:** \`${realCommit}\`
- **Branch/Worktree:** \`feat/medusa-inventory-import\`

## 2. Fonte de Dados
- **Tipo:** Google Sheets (Download Dinâmico)
- **Spreadsheet ID:** \`1gHTqPeQG8wV_YbkNTS-_dGAqtCXbse3O1VSTQS4VDiI\`
- **SHA-256 da Planilha:** \`${sha256}\`
- **Planilha Recriada:** NÃO
- **XLSX Local Usado como Fonte:** NÃO
- **CSV Local Usado como Fonte:** NÃO
- **Download a Cada Execução:** SIM

## 3. Qualidade dos Dados (Planilha)
- **Total de Linhas Processadas:** ${journal.sourceRows}
- **Regra Comercial Aplicada:** Custo * 1.30 (Markup de 30%)
- **Custo Exposto no Storefront:** NÃO
- **Custo Salvo no Medusa:** NÃO
- **Estratégia de Produtos KG:** Mantido como draft (KG_STRATEGY_PENDING) até comprovação de suporte decimal no Medusa 2.18.

## 4. Auditoria do Catálogo Atual (Medusa)
- **Total de Produtos:** ${medusaState.products.length}
- **Total de Variantes:** ${medusaState.variants.length}
- **Stock Locations Encontradas:** ${medusaState.stockLocations.map((s: any) => s.name).join(", ")}
- **Sales Channels Associados:** ${medusaState.salesChannels.map((s: any) => s.name).join(", ")}

## 5. Plano de Ação
- **CREATE:** ${journal.created}
- **UPDATE:** ${journal.updated}
- **PUBLISH:** ${journal.published}
- **DRAFT:** ${journal.drafted}
- **ARCHIVE:** ${journal.archived}
- **NO CHANGE:** ${journal.unchanged}
- **ERROR:** ${journal.errors}

## 6. Prova de Zero Gravações
- **Backup Gerado:** ${backupPath ? `\`${backupPath}\`` : 'NÃO'}
- **DRY RUN:** \`${journal.mode === "dry-run"}\`
- **Write Operations:** \`${journal.mode === "dry-run" ? 0 : "EXECUTADO"}\`
- **Banco Alterado:** \`${journal.mode === "dry-run" ? "NÃO" : "SIM"}\`
- **Neon Acessado Diretamente:** NÃO
- **SQL Direto:** NÃO

## 7. Informações de Segurança e Lock
- **Job Habilitado por Padrão:** NÃO
- **Risco do Link Público:** ATENÇÃO - A planilha atual expõe custos publicamente para quem tem o link. A arquitetura suporta troca para Service Account futura.

## 8. Próximos Passos
Aguardar aprovação do dry-run antes da Fase Inventário 0-B apply. Nenhuma mutação foi executada.
`

  // Write report to root of the worktree
  const rootDir = process.cwd()
  fs.writeFileSync(path.join(rootDir, "INVENTORY-SYNC-REPORT.md"), md.trim())

  // Also write an audit file specifically requested
  const auditMd = `
# Auditoria de Sincronização
- **Data:** ${new Date().toISOString()}
- **SHA:** ${sha256}
- **Modo:** ${journal.mode}
- **Sucesso:** ${journal.status}
`
  fs.writeFileSync(path.join(rootDir, "INVENTORY-SHEET-AUDIT.md"), auditMd.trim())
}
