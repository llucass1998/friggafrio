import { Client } from "pg"
import { strict as assert } from "node:assert"
import { catalogBase, publicCatalogInput, queryPublicCatalog, queryPublicFacets } from "../integrations/catalog/public-query"

/** Usa exclusivamente banco descartável local fornecido explicitamente pelo operador. */
async function main() {
  const url = process.env.CATALOG_BENCHMARK_DATABASE_URL
  if (!url || !["127.0.0.1", "localhost", process.env.CATALOG_BENCHMARK_LOCAL_HOST].includes(new URL(url).hostname)) throw new Error("CATALOG_BENCHMARK_LOCAL_DATABASE_REQUIRED")
  // A fixture define explicitamente um único preço-base BRL por variante.
  process.env.CATALOG_BASE_PRICE_EQUIVALENCE_APPROVED = "true"
  const client = new Client({ connectionString: url })
  await client.connect()
  let queryCount = 0
  const raw = async (sql: string, bindings: unknown[] = []) => {
    queryCount++
    let index = 0
    return client.query(sql.replace(/\?/g, () => `$${++index}`), bindings)
  }
  await client.query("BEGIN")
  try {
    await client.query(`CREATE SCHEMA catalog_benchmark_${process.pid}`)
    await client.query(`SET LOCAL search_path TO catalog_benchmark_${process.pid},public`)
    await client.query(`
      CREATE TABLE product(id text PRIMARY KEY,title text,subtitle text,metadata jsonb,created_at timestamptz,collection_id text,status text,deleted_at timestamptz);
      CREATE TABLE product_variant(id text PRIMARY KEY,product_id text,sku text,barcode text,ean text,upc text,manage_inventory boolean,allow_backorder boolean,deleted_at timestamptz);
      CREATE TABLE product_collection(id text,title text,deleted_at timestamptz);
      CREATE TABLE product_category(id text,deleted_at timestamptz);
      CREATE TABLE product_category_product(product_id text,product_category_id text);
      CREATE TABLE product_sales_channel(product_id text,sales_channel_id text,deleted_at timestamptz);
      CREATE TABLE product_variant_price_set(variant_id text,price_set_id text,deleted_at timestamptz);
      CREATE TABLE price(id text,price_set_id text,currency_code text,amount numeric,price_list_id text,min_quantity numeric,max_quantity numeric,rules_count int,deleted_at timestamptz);
      CREATE TABLE price_rule(price_id text,deleted_at timestamptz);
      CREATE TABLE product_variant_inventory_item(variant_id text,inventory_item_id text,deleted_at timestamptz);
      CREATE TABLE inventory_level(inventory_item_id text,stocked_quantity numeric,reserved_quantity numeric,deleted_at timestamptz);
      CREATE TABLE region(id text,currency_code text,deleted_at timestamptz);
      CREATE TABLE product_variant_option(variant_id text,option_value_id text);
      CREATE TABLE product_option_value(id text,option_id text,value text,deleted_at timestamptz);
      CREATE TABLE product_option(id text,title text,deleted_at timestamptz);
      INSERT INTO region VALUES('reg_br','brl',NULL);
      INSERT INTO product_collection VALUES('brand_a','Marca A',NULL);
      INSERT INTO product_category VALUES('cat_gas',NULL);
      INSERT INTO product SELECT 'prod_'||lpad(n::text,6,'0'),'GÁS R404A '||n,NULL,jsonb_build_object('omie_code','DPGS'||n),now()-n*interval '1 second','brand_a','published',NULL FROM generate_series(1,11050) n;
      INSERT INTO product_variant SELECT 'var_'||id,id,'DPGS'||substring(id from 6)::int,NULL,NULL,NULL,true,false,NULL FROM product;
      INSERT INTO product_sales_channel SELECT id,'sc_public',NULL FROM product;
      INSERT INTO product_category_product SELECT id,'cat_gas' FROM product;
      INSERT INTO product_variant_price_set SELECT id,'ps_'||id,NULL FROM product_variant;
      INSERT INTO price SELECT 'price_'||id,'ps_'||id,'brl',substring(product_id from 6)::int,NULL,NULL,NULL,0,NULL FROM product_variant;
      INSERT INTO product_variant_inventory_item SELECT id,'item_'||id,NULL FROM product_variant;
      INSERT INTO inventory_level SELECT 'item_'||id,CASE WHEN substring(product_id from 6)::int%2=0 THEN 5 ELSE 1 END,1,NULL FROM product_variant;
      INSERT INTO product_option VALUES('opt','Tensão',NULL);
      INSERT INTO product_option_value VALUES('ov','opt','220V',NULL);
      INSERT INTO product_variant_option SELECT id,'ov' FROM product_variant WHERE substring(product_id from 6)::int%2=0;
      CREATE INDEX ON product_variant(product_id);
      CREATE INDEX ON product_variant(sku);
      CREATE INDEX ON product_sales_channel(product_id);
      CREATE INDEX ON product_category_product(product_id);
      CREATE INDEX ON product_variant_inventory_item(variant_id);
      CREATE INDEX ON inventory_level(inventory_item_id);
      CREATE INDEX ON product_variant_price_set(variant_id);
      CREATE INDEX ON price(price_set_id);
      CREATE INDEX ON product_variant_option(variant_id);
      ANALYZE;
    `)
    const req = (query: Record<string,unknown>) => ({ query: { region_id: "reg_br", ...query }, publishable_key_context: { sales_channel_ids: ["sc_public"] }, scope: { resolve: () => ({ raw }) } })
    const cases = [
      { name: "todos", query: {}, count: 11050 },
      { name: "SKU", query: { q: "DPGS4044", sort: "relevance" }, count: 1 },
      { name: "nome", query: { q: "gás r404a" }, count: 11050 },
      { name: "estoque", query: { availability: "in_stock" }, count: 5525 },
      { name: "categoria/marca", query: { category: "cat_gas",brand: "brand_a" }, count: 11050 },
      { name: "preço combinado", query: { price_min: 100,price_max: 200,availability: "in_stock",sort: "price_asc" }, count: 51 },
      { name: "opção", query: { option_value_id: "ov",category: "cat_gas" }, count: 5525 },
      { name: "fora da página", query: { offset: 20000 }, count: 11050 },
    ]
    for (const scenario of cases) {
      const times: number[] = []
      const counts: number[] = []
      for (let i=0;i<5;i++) {
        queryCount=0
        const r = req(scenario.query)
        const start=performance.now()
        const result=await queryPublicCatalog(r as never,publicCatalogInput(r as never))
        times.push(Math.round(performance.now()-start));counts.push(queryCount)
        assert.equal(result.count,scenario.count,scenario.name)
        assert.equal(result.product_ids.length,scenario.name==="fora da página"?0:Math.min(24,scenario.count))
        if(scenario.name==="SKU")assert.deepEqual(result.product_ids,["prod_004044"])
        if(scenario.name==="preço combinado")assert.equal(result.product_ids[0],"prod_000100")
      }
      console.log(JSON.stringify({ scenario: scenario.name,ms:times,queries:counts }))
    }
    const pageIds: string[][] = []
    for (const offset of [0,24,48]) {
      const pageReq = req({ q: "DPGS", offset })
      const page = await queryPublicCatalog(pageReq as never, publicCatalogInput(pageReq as never))
      pageIds.push(page.product_ids)
      assert.equal(page.count, 11050)
    }
    assert.equal(new Set(pageIds.flat()).size,72,"Páginas não devem repetir produtos")
    const r=req({})
    const facets=await queryPublicFacets(r as never,publicCatalogInput(r as never))
    assert.deepEqual(facets.options,[])
    assert.equal(facets.brands[0].count,11050)
    assert.equal(facets.price.min,1)
    assert.equal(facets.price.max,11050)
    console.log("FACETS_BYTES",JSON.stringify(facets).length)
    const input=publicCatalogInput(req({ q: "DPGS4044" }) as never)
    const base=catalogBase(input)
    console.log("EXPLAIN",(await raw(`EXPLAIN (ANALYZE,BUFFERS) ${base.sql} SELECT id FROM candidates LIMIT 24`,base.bindings)).rows)
    console.log("CONTRACT_FIXTURE_OK",11050)
  } finally { await client.query("ROLLBACK");await client.end() }
}
main().catch((error) => { console.error(error);process.exitCode=1 })
