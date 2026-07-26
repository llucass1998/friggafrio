import pg from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const client = new pg.Client({ connectionString: databaseUrl });

try {
  await client.connect();
  const result = await client.query(`
    SELECT
      (SELECT count(*)::integer FROM product WHERE deleted_at IS NULL) AS products,
      (SELECT count(*)::integer FROM product_variant WHERE deleted_at IS NULL) AS variants,
      (SELECT count(*)::integer FROM price WHERE deleted_at IS NULL) AS prices,
      (SELECT count(*)::integer FROM inventory_item WHERE deleted_at IS NULL) AS inventory
  `);
  const counts = result.rows[0];
  const populatedAreas = Object.entries(counts)
    .filter(([, count]) => count !== 0)
    .map(([area]) => area);

  if (populatedAreas.length > 0) {
    throw new Error(
      `Schema migration inserted unapproved commercial data in: ${populatedAreas.join(", ")}`,
    );
  }

  console.log("No commercial catalog, price or inventory seed was executed.");
} finally {
  await client.end();
}
