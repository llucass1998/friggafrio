import assert from "node:assert/strict"
import test from "node:test"
import {
  clampPage,
  normalizePage,
  offsetForPage,
  paginationItems,
  PRODUCTS_PER_PAGE,
  totalPagesFor,
} from "../../src/lib/utils/pagination"

test("catalog pagination uses a controlled page size and offset math", () => {
  assert.equal(PRODUCTS_PER_PAGE, 24)
  assert.equal(totalPagesFor(100), 5)
  assert.equal(totalPagesFor(101), 5)
  assert.equal(totalPagesFor(0), 1)
  assert.equal(offsetForPage(1), 0)
  assert.equal(offsetForPage(2), 24)
  assert.equal(offsetForPage(3), 48)
})

test("invalid page values normalize to page one", () => {
  assert.equal(normalizePage(0), 1)
  assert.equal(normalizePage(-5), 1)
  assert.equal(normalizePage("abc"), 1)
  assert.equal(normalizePage("3.9"), 3)
})

test("out of range pages clamp to the deterministic last page", () => {
  assert.equal(clampPage(999, 101), 5)
  assert.equal(clampPage(3, 101), 3)
})

test("desktop pagination stays compact", () => {
  assert.deepEqual(paginationItems(1, 45), [1, 2, 3, "ellipsis", 45])
  assert.deepEqual(paginationItems(22, 45), [1, "ellipsis", 21, 22, 23, "ellipsis", 45])
  assert.deepEqual(paginationItems(45, 45), [1, "ellipsis", 43, 44, 45])
})
