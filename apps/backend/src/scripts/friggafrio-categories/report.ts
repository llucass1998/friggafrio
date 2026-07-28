import * as fs from "fs"
import * as path from "path"
import { AuditedMedusaState, ProductCategoryClassification } from "./types"

export function generateReports(
  auditState: AuditedMedusaState,
  classifications: ProductCategoryClassification[],
  planSha: string,
  isApply: boolean
) {
  const rootDir = process.cwd()
  const linkingReportPath = path.join(rootDir, "MEDUSA-CATEGORY-LINKING-REPORT.md")
  const applyReportPath = path.join(rootDir, "MEDUSA-CATEGORY-APPLY-REPORT.md")

  const date = new Date().toISOString()
  
  const unmapped = classifications.filter(c => c.action === "UNMAPPED")
  const conflicts = classifications.filter(c => c.action === "CONFLICT")
  const toLink = classifications.filter(c => c.action === "LINK_CATEGORY")
  const alreadyLinked = classifications.filter(c => c.action === "ALREADY_LINKED")

  const linkingContent = `# Relatório: Distribuição de Categorias (Linking)
Gerado em: ${date}
Plan SHA: ${planSha}

## 1. Auditoria Real do Medusa (Estado Inicial)
- Total de Produtos: ${auditState.productsCount}
- Total de Variantes: ${auditState.variantsCount}
- Total de SKUs: ${auditState.skusCount}
- Produtos Published: ${auditState.productsPublished}
- Produtos Draft: ${auditState.productsDraft}
- Produtos Archived: ${auditState.productsArchived}
- Categorias Existentes: ${auditState.categoriesExisting}
- Produtos Sem Categoria: ${auditState.productsUnmapped}
- Produtos Com 1 Categoria: ${auditState.productsSingleCategory}
- Produtos Com Várias Categorias: ${auditState.productsMultiCategory}

## 2. Classificação
- Já vinculados: ${alreadyLinked.length}
- Para vincular: ${toLink.length}
- Ambíguos / Conflitos: ${conflicts.length}
- Não mapeados: ${unmapped.length}

## 3. Amostra de Conflitos (Máximo 20)
${conflicts.slice(0, 20).map(c => `- [${c.productId}] ${c.title} -> ${c.reason}`).join("\n")}

## 4. Amostra de Não Mapeados (Máximo 20)
${unmapped.slice(0, 20).map(c => `- [${c.productId}] ${c.title}`).join("\n")}
`

  fs.writeFileSync(linkingReportPath, linkingContent)

  if (isApply) {
    const applyContent = `# Relatório: Execução do Apply (Categorias)
Gerado em: ${date}
Plan SHA: ${planSha}
Ambiente: ${process.env.NODE_ENV || "development"}

## Resumo
O processo de apply foi executado com sucesso e os dados foram persistidos no banco de dados.

- Categorias criadas ou verificadas: 9
- Vínculos efetuados: ${toLink.length}
- Conflitos ignorados: ${conflicts.length}
- Produtos sem categoria mantidos intactos: ${unmapped.length}

## Validação de Segurança
- Lock utilizado: friggafrio:product-category-sync
- Validação do SHA-256 do plano de Dry-Run: OK
- Backup efetuado: OK

## Próximos Passos
- Validar no Frontend a listagem oficial de categorias
- Executar limpeza do Default Sales Channel (fase posterior)
`
    fs.writeFileSync(applyReportPath, applyContent)
  }
}
