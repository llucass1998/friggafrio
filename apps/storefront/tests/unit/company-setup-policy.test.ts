import assert from "node:assert/strict"
import test from "node:test"
import { companySetupQueryKey, isCompanySetupEligible, shouldRetryCompanySetup } from "../../src/lib/hooks/company-setup-policy"

test("company setup never queries anonymous or B2C sessions", () => {
  assert.equal(isCompanySetupEligible({ authState: "guest", customerId: undefined, companyId: undefined }), false)
  assert.equal(isCompanySetupEligible({ authState: "authenticated", customerId: "cus_b2c", companyId: undefined }), false)
  assert.equal(isCompanySetupEligible({ authState: "loading", customerId: "cus_b2b", companyId: "co_1" }), false)
})

test("company setup is enabled once for a verified B2B customer key", () => {
  assert.equal(isCompanySetupEligible({ authState: "authenticated", customerId: "cus_b2b", companyId: "co_1" }), true)
  assert.deepEqual(companySetupQueryKey("cus_b2b"), ["company-setup-status", "cus_b2b"])
})

test("company setup does not retry expected authorization responses", () => {
  assert.equal(shouldRetryCompanySetup(0, { status: 401 }), false)
  assert.equal(shouldRetryCompanySetup(0, { status: 403 }), false)
  assert.equal(shouldRetryCompanySetup(0, { status: 404 }), false)
  assert.equal(shouldRetryCompanySetup(0, { status: 500 }), true)
  assert.equal(shouldRetryCompanySetup(2, { status: 500 }), false)
})
