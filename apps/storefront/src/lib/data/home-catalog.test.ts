import assert from "node:assert/strict"
import test from "node:test"
import { HOME_CATALOG_LIMIT, HOME_MAINTENANCE_CANDIDATE_LIMIT, HOME_SHELF_CARD_COUNT } from "@/lib/data/home-catalog"

test("Home catalog limit covers every shelf without loading the full catalog", () => {
  assert.equal(HOME_CATALOG_LIMIT, 240)
  assert.ok(HOME_CATALOG_LIMIT >= HOME_SHELF_CARD_COUNT * 3)
  assert.ok(HOME_CATALOG_LIMIT < 500)
  assert.equal(HOME_MAINTENANCE_CANDIDATE_LIMIT, HOME_SHELF_CARD_COUNT * 6)
})
