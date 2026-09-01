import assert from "node:assert/strict"
import test from "node:test"
import { getInterestFreeInstallment, MAX_INTEREST_FREE_INSTALLMENTS } from "../../src/lib/utils/installments.ts"

test("interest-free installment policy is capped at ten and uses a safe amount", () => {
  assert.equal(MAX_INTEREST_FREE_INSTALLMENTS, 10)
  const installment = getInterestFreeInstallment(100)
  assert.equal(installment?.installmentAmount, 10)
  assert.match(installment?.label || "", /ou 10x de R\$\s*10,00 sem juros/)
})

test("invalid prices never produce installment copy", () => {
  assert.equal(getInterestFreeInstallment(undefined), null)
  assert.equal(getInterestFreeInstallment(Number.NaN), null)
  assert.equal(getInterestFreeInstallment(0), null)
  assert.equal(getInterestFreeInstallment(-10), null)
})
