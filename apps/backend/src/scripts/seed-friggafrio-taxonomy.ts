import { Client } from "pg"

type CategoryDefinition = {
  name: string
  handle: string
  featured?: boolean
  pattern: RegExp
}

const categories: CategoryDefinition[] = [
  { name: "Compressores", handle: "compressores", featured: true, pattern: /\bCOMP(?:RESSOR)?\b/i },
  { name: "Câmara Fria", handle: "camara-fria", featured: true, pattern: /CAMARA FRIA|EVAPORADOR|CONDENSADOR|UNIDADE CONDENSADORA/i },
  { name: "Gases Refrigerantes", handle: "gases-refrigerantes", featured: true, pattern: /\b(?:GAS|GASES|REFRIGERANTE|FREON|OPTEON|SUVA|ISCEON|MO49)\b|^R(?:32|134A|404A|407C|410A|507|290|600A|22|717|744)\b/i },
  { name: "Bombas de Vácuo", handle: "bombas-de-vacuo", featured: true, pattern: /BOMBA.*VACU|VACUO/i },
  { name: "Manifolds e Manômetros", handle: "manifolds-e-manometros", featured: true, pattern: /MANIFOLD|MANOMETRO/i },
  { name: "Detectores de Vazamento", handle: "detectores-de-vazamento", pattern: /DETECTOR.*VAZ|VAZAMENTO/i },
  { name: "Recolhedoras", handle: "recolhedoras", pattern: /RECOLHEDOR|RECUPERAD/i },
  { name: "Cilindros de Recolhimento", handle: "cilindros-de-recolhimento", pattern: /CILINDRO.*RECOLH|CILINDRO REC/i },
  { name: "Tubos de Cobre", handle: "tubos-de-cobre", featured: true, pattern: /TUBO.*COBRE|COBRE/i },
  { name: "Conexões", handle: "conexoes", pattern: /CONEX|LUVA|CURVA|SIFAO|SIFÃO|\bTE\b|REDUCAO|REDUÇÃO|ADAPTADOR/i },
  { name: "Isolamento Térmico", handle: "isolamento-termico", pattern: /ISOL|ARMAFLEX|ESPUMA/i },
  { name: "Óleos", handle: "oleos", pattern: /OLEO|ÓLEO/i },
  { name: "Produtos Químicos", handle: "produtos-quimicos", pattern: /QUIM|QUÍM|LIMPA|FLUIDO|ADITIVO/i },
  { name: "Ferramentas Manuais", handle: "ferramentas-manuais", pattern: /CHAVE|ALICATE|FERRAMENTA|CORTADOR|FLANGEADOR/i },
  { name: "Componentes", handle: "componentes", pattern: /BITZER|DANFOSS|COPELAND|VALV|VÁLV|SENSOR|CONTROL|CABO|ELETR|EL[ÉE]TR|RELE|RELÉ|CONTATOR|TERMOSTAT|PRESSOSTAT/i },
  { name: "Outros", handle: "outros", featured: false, pattern: /.*/i },
]

const connectionString = process.env.DATABASE_URL || "postgres://frigga:frigga-local-only@127.0.0.1:55432/frigga"
const apply = process.argv.includes("--apply")

function classify(title: string) {
  const normalized = title.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  return categories.find((category) => category.pattern.test(`${title} ${normalized}`)) || categories[categories.length - 1]
}

async function main() {
  const client = new Client({ connectionString })
  await client.connect()
  try {
    const products = await client.query<{ id: string; title: string; sku: string | null }>(
      `select p.id, p.title, v.sku
       from product p
       left join product_variant v on v.product_id = p.id and v.deleted_at is null
       where p.deleted_at is null and p.status = 'published'
       order by p.id`,
    )

    const assignments = products.rows.map((product) => ({ product, category: classify(product.title) }))
    const counts = new Map(categories.map((category) => [category.handle, 0]))
    for (const assignment of assignments) counts.set(assignment.category.handle, (counts.get(assignment.category.handle) || 0) + 1)

    const categoryIds = categories.map((category) => `pcat_${category.handle}`)
    const existingRelations = await client.query<{ product_id: string; product_category_id: string }>(
      `select product_id, product_category_id from product_category_product where product_category_id = any($1::text[])`,
      [categoryIds],
    )
    const expectedRelations = new Set<string>(assignments.map((assignment) => `${assignment.product.id}:pcat_${assignment.category.handle}`))
    const existingRelationSet = new Set<string>(existingRelations.rows.map((relation) => `${relation.product_id}:${relation.product_category_id}`))
    const newRelationCount = [...expectedRelations].filter((relation) => !existingRelationSet.has(relation)).length
    const removedRelationCount = [...existingRelationSet].filter((relation) => !expectedRelations.has(relation)).length

    const report = {
      mode: apply ? "apply" : "dry-run",
      total: assignments.length,
      mapped: assignments.length,
      unchanged: expectedRelations.size - newRelationCount,
      newAssignments: newRelationCount,
      removedAssignments: removedRelationCount,
      unclassified: 0,
      conflicts: 0,
      categories: categories.map((category) => ({
        name: category.name,
        handle: category.handle,
        featured: Boolean(category.featured),
        productCount: counts.get(category.handle) || 0,
        sampleSkus: assignments.filter((assignment) => assignment.category.handle === category.handle).map(({ product }) => product.sku).filter(Boolean).slice(0, 5),
      })),
    }

    if (!apply) {
      process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
      return
    }

    await client.query("begin")
    for (const [rank, category] of categories.entries()) {
      const id = `pcat_${category.handle}`
      await client.query(
        `insert into product_category (id, name, description, handle, mpath, is_active, is_internal, rank, metadata)
         values ($1, $2, $3, $4, $1, true, false, $5, $6::jsonb)
         on conflict (id) do update set name = excluded.name, description = excluded.description, handle = excluded.handle,
           is_active = true, rank = excluded.rank, metadata = excluded.metadata, updated_at = now(), deleted_at = null`,
        [id, category.name, `Produtos FriggaFrio em ${category.name}.`, category.handle, rank, JSON.stringify({ source: "deterministic-title-taxonomy", taxonomy_version: 1, featured: Boolean(category.featured) })],
      )
    }

    if (removedRelationCount > 0) {
      const staleRelations = [...existingRelationSet].filter((relation) => !expectedRelations.has(relation)).map((relation) => relation.split(":"))
      for (const [productId, categoryId] of staleRelations) {
        await client.query(`delete from product_category_product where product_id = $1 and product_category_id = $2`, [productId, categoryId])
      }
    }
    for (const assignment of assignments) {
      const relationKey = `${assignment.product.id}:pcat_${assignment.category.handle}`
      if (existingRelationSet.has(relationKey)) continue
      await client.query(
        `insert into product_category_product (product_id, product_category_id) values ($1, $2) on conflict do nothing`,
        [assignment.product.id, `pcat_${assignment.category.handle}`],
      )
    }
    await client.query("commit")

    const verification = await client.query<{ categories: string; relations: string; uncategorized: string }>(
      `select
         (select count(*) from product_category where deleted_at is null)::text as categories,
         (select count(*) from product_category_product)::text as relations,
         (select count(*) from product p where p.deleted_at is null and p.status = 'published' and not exists (select 1 from product_category_product pcp where pcp.product_id = p.id))::text as uncategorized`,
    )
    process.stdout.write(`${JSON.stringify({ ...report, verification: verification.rows[0] }, null, 2)}\n`)
  } catch (error) {
    await client.query("rollback").catch(() => undefined)
    throw error
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
