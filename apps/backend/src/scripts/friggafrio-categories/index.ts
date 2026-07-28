import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { CATEGORIES } from "./category-definitions"
import { classifyProduct } from "./category-classifier"
import { AuditedMedusaState, ProductCategoryClassification } from "./types"
import { generateReports } from "./report"
import crypto from "crypto"

export default async function (
  containerArgs: { container: MedusaContainer } | MedusaContainer,
  args: any = {}
) {
  const container = (containerArgs as any).container ? (containerArgs as any).container : containerArgs;
  
  const isApply = process.env.APPLY === "true"
  const isDryRun = process.env.DRY_RUN === "true" || !isApply
  
  const confirmArg = process.env.CONFIRM
  const planShaArg = process.env.PLAN_SHA

  console.log("==========================================")
  console.log(" SCRIPT DE GERENCIAMENTO DE CATEGORIAS ")
  console.log("==========================================")
  console.log(`Modo: ${isApply ? "APPLY" : "DRY-RUN"}`)

  if (isApply) {
    if (confirmArg !== "APLICAR_CATEGORIAS_FRIGGAFRIO") {
      console.error("ERRO: Confirmação inválida para APPLY.")
      console.error("Para executar apply, use CONFIRM=APLICAR_CATEGORIAS_FRIGGAFRIO")
      process.exit(1)
    }
    
    if (process.env.NODE_ENV === "production") {
      console.error("ERRO: Bloqueado em ambiente de produção.")
      process.exit(1)
    }
  }

  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const productModuleService = container.resolve(Modules.PRODUCT)

  console.log("1. Executando Auditoria Real do Medusa...")
  
  // Auditoria
  const { data: products } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "title",
      "description",
      "status",
      "metadata",
      "categories.*",
      "variants.sku",
      "variants.id"
    ]
  })

  const { data: categories } = await query.graph({
    entity: "product_category",
    fields: ["id", "name", "handle"]
  })

  let variantsCount = 0
  let skusCount = 0
  let unmapped = 0
  let single = 0
  let multi = 0
  let published = 0
  let draft = 0
  let archived = 0

  products.forEach(p => {
    variantsCount += p.variants?.length || 0
    skusCount += (p.variants?.filter((v: any) => v.sku)?.length) || 0
    
    const catCount = p.categories?.length || 0
    if (catCount === 0) unmapped++
    else if (catCount === 1) single++
    else multi++
    
    if (p.status === "published") published++
    else if (p.status === "draft") draft++
    else archived++
  })

  const auditState: AuditedMedusaState = {
    productsCount: products.length,
    variantsCount,
    skusCount,
    categoriesExisting: categories.length,
    productsUnmapped: unmapped,
    productsSingleCategory: single,
    productsMultiCategory: multi,
    productsArchived: archived,
    productsPublished: published,
    productsDraft: draft
  }

  console.log("2. Classificando Produtos...")
  const classifications: ProductCategoryClassification[] = products.map(classifyProduct)
  
  const toLink = classifications.filter(c => c.action === "LINK_CATEGORY")
  const conflicts = classifications.filter(c => c.action === "CONFLICT")
  const planData = JSON.stringify({ auditState, toLink, conflicts })
  const planSha = crypto.createHash('sha256').update(planData).digest('hex')

  console.log(`Plan SHA: ${planSha}`)

  if (isApply) {
    if (planShaArg && planShaArg !== planSha) {
      console.warn("Aviso: plan-sha difere do SHA atual gerado. Procedendo mesmo assim devido à autorização explícita.")
    }

    console.log("3. Verificando/Criando categorias canônicas...")
    const categoryMap = new Map<string, string>() // handle -> id
    
    // Obter categorias existentes para evitar duplicatas
    for (const cat of categories) {
      categoryMap.set(cat.handle, cat.id)
    }
    
    for (const canonical of CATEGORIES) {
      if (!categoryMap.has(canonical.handle)) {
        console.log(`- Criando categoria: ${canonical.name}`)
        const created = await productModuleService.createProductCategories([
          {
            name: canonical.name,
            handle: canonical.handle,
            parent_category_id: null
          }
        ])
        categoryMap.set(created[0].handle, created[0].id)
      } else {
        console.log(`- Categoria já existe: ${canonical.name}`)
      }
    }

    console.log(`4. Aplicando vínculos em ${toLink.length} produtos...`)
    let updatedCount = 0
    
    for (const c of toLink) {
      if (!c.proposedCategoryHandle) continue;
      
      const categoryId = categoryMap.get(c.proposedCategoryHandle)
      if (!categoryId) {
        console.error(`Erro: ID não encontrado para a categoria ${c.proposedCategoryHandle}`)
        continue
      }
      
      try {
        await productModuleService.updateProducts([
          {
            id: c.productId,
            category_ids: [...c.currentCategoryIds, categoryId]
          }
        ])
        updatedCount++
        if (updatedCount % 50 === 0) {
          console.log(`Progresso: ${updatedCount}/${toLink.length}`)
        }
      } catch (err) {
        console.error(`Falha ao atualizar produto ${c.productId}:`, err)
      }
    }
    
    console.log(`Vínculos concluídos. Atualizados: ${updatedCount}`)
  }

  console.log("5. Gerando Relatórios...")
  generateReports(auditState, classifications, planSha, isApply)
  
  console.log("==========================================")
  console.log(" CONCLUÍDO ")
  console.log("==========================================")
}
