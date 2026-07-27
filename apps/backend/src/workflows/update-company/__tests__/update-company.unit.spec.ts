import { MedusaError } from "@medusajs/framework/utils"
import { COMPANY_MODULE } from "../../../modules/company"
import type CompanyModuleService from "../../../modules/company/service"
import type { MedusaContainer } from "@medusajs/framework/types"
import { StepResponse } from "@medusajs/framework/workflows-sdk"
import { CompanyStatus, SpendLimitResetFrequency } from "../../../modules/company/models"

import {
  isUpdateCompanyInput,
  updateCompanyStepHandler,
  updateCompanyCompensationHandler,
  updateCompanyWorkflow,
  UpdateCompanyCompensationData
} from "../index"

type SingleUpdateCompanyType = {
  id: string
  name: string
  email: string
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  postal_code: string | null
  country_code: string | null
  logo_url: string | null
  status: CompanyStatus
  spend_limit_reset_frequency: SpendLimitResetFrequency
  created_at: Date
  updated_at: Date
  deleted_at: Date | null
  employees: string[]
  addresses: string[]
}

const mockRetrieveCompany = jest.fn()
const mockUpdateCompanies = jest.fn()

const mockCompanyModuleService = {
  retrieveCompany: mockRetrieveCompany,
  updateCompanies: mockUpdateCompanies,
}

describe("updateCompanyWorkflow step unit tests", () => {
  const resolveMock = jest.fn()
  const mockContainer = {
    resolve: resolveMock,
  } as Pick<MedusaContainer, "resolve"> & Record<string, unknown>

  const context = {
    container: mockContainer as MedusaContainer,
  }

  beforeEach(() => {
    jest.resetAllMocks()
    resolveMock.mockImplementation((key: string) => {
      if (key === COMPANY_MODULE) return mockCompanyModuleService as Pick<CompanyModuleService, "retrieveCompany" | "updateCompanies">
      throw new Error(`Unexpected resolution of ${key}`)
    })
  })

  describe("isUpdateCompanyInput", () => {
    it("should return true for valid minimum input", () => {
      expect(isUpdateCompanyInput({ id: "comp_123" })).toBe(true)
    })

    it("should return true for optional fields correctly set", () => {
      expect(
        isUpdateCompanyInput({
          id: "comp_123",
          name: "Test",
          status: CompanyStatus.ACTIVE,
        })
      ).toBe(true)
    })

    it("should return true for nullable fields set to null", () => {
      expect(
        isUpdateCompanyInput({
          id: "comp_123",
          phone: null,
          city: null,
        })
      ).toBe(true)
    })

    const invalidInputs = [
      { name: "undefined", value: undefined },
      { name: "null", value: null },
      { name: "string", value: "comp_123" },
      { name: "number", value: 123 },
      { name: "array", value: [] },
      { name: "empty object", value: {} },
      { name: "id missing", value: { name: "Test" } },
      { name: "id null", value: { id: null } },
      { name: "id number", value: { id: 123 } },
      { name: "id empty", value: { id: "" } },
      { name: "id spaces only", value: { id: "   " } },
      { name: "invalid status", value: { id: "123", status: "magic" } },
      { name: "invalid frequency", value: { id: "123", spend_limit_reset_frequency: "hourly" } },
      { name: "string field with number", value: { id: "123", name: 123 } },
      { name: "nullable field with boolean", value: { id: "123", city: true } },
    ]

    it.each(invalidInputs)("should return false for $name", ({ value }) => {
      expect(isUpdateCompanyInput(value)).toBe(false)
    })
  })

  describe("updateCompanyStepHandler", () => {
    const validSnapshot: SingleUpdateCompanyType = {
      id: "comp_123",
      name: "Old Name",
      email: "old@test.com",
      status: CompanyStatus.PENDING,
      spend_limit_reset_frequency: SpendLimitResetFrequency.MONTHLY,
      phone: null,
      address: null,
      city: null,
      state: null,
      postal_code: null,
      country_code: null,
      logo_url: null,
      created_at: new Date(),
      updated_at: new Date(),
      deleted_at: null,
      employees: [],
      addresses: [],
    }

    beforeEach(() => {
      mockRetrieveCompany.mockResolvedValue(validSnapshot)
      mockUpdateCompanies.mockResolvedValue({
        ...validSnapshot,
        name: "New Name",
      })
    })

    it("should fail for invalid input without resolving service", async () => {
      await expect(updateCompanyStepHandler({ id: "" }, context)).rejects.toThrow(MedusaError)
      expect(mockContainer.resolve).not.toHaveBeenCalled()
    })

    it("should retrieve the company using normalized ID and execute update exactly once", async () => {
      const input = { id: "  comp_123  ", name: "New Name" }
      const response = await updateCompanyStepHandler(input, context)

      expect(mockRetrieveCompany).toHaveBeenCalledWith("comp_123")
      expect(mockUpdateCompanies).toHaveBeenCalledTimes(1)
      expect(mockUpdateCompanies).toHaveBeenCalledWith({
        id: "comp_123",
        name: "New Name",
      })
      expect(response).toBeInstanceOf(StepResponse)
    })

    it("should preserve explicit nulls and explicitly strip undefined properties from payload", async () => {
      // Pass both null and undefined values to verify correct handling
      const input = { id: "comp_123", city: null, name: undefined, email: undefined }
      await updateCompanyStepHandler(input, context)

      expect(mockUpdateCompanies).toHaveBeenCalledTimes(1)

      const payloadReceived = mockUpdateCompanies.mock.calls[0][0]

      // The payload MUST contain explicitly passed nulls
      expect(payloadReceived).toHaveProperty("city", null)

      // The payload MUST NOT contain keys that were set to undefined in the input
      expect(Object.keys(payloadReceived)).not.toContain("name")
      expect(Object.keys(payloadReceived)).not.toContain("email")

      // Exact check of the payload structure
      expect(payloadReceived).toStrictEqual({
        id: "comp_123",
        city: null,
      })
    })

    it("should propagate retrieveCompany error and not execute update", async () => {
      mockRetrieveCompany.mockRejectedValueOnce(new Error("Not found"))
      await expect(updateCompanyStepHandler({ id: "comp_123" }, context)).rejects.toThrow("Not found")
      expect(mockUpdateCompanies).not.toHaveBeenCalled()
    })

    it("should propagate updateCompanies error and not return success", async () => {
      mockUpdateCompanies.mockRejectedValueOnce(new Error("Update failed"))
      await expect(updateCompanyStepHandler({ id: "comp_123", name: "Fail" }, context)).rejects.toThrow("Update failed")
    })

    it("should generate proper compensation data excluding unneeded relations and preserving null", async () => {
      const input = { id: "comp_123", name: "New Name" }
      const response = await updateCompanyStepHandler(input, context)
      expect(response).toBeInstanceOf(StepResponse)
    })
  })

  describe("updateCompanyCompensationHandler", () => {
    it("should not resolve service for undefined, null or invalid objects", async () => {
      await updateCompanyCompensationHandler(undefined, context)
      await updateCompanyCompensationHandler(null, context)
      await updateCompanyCompensationHandler({}, context)
      await updateCompanyCompensationHandler({ id: "123" }, context)

      expect(mockContainer.resolve).not.toHaveBeenCalled()
    })

    it("should call updateCompanies exactly once with the valid compensation snapshot", async () => {
      const snapshot: UpdateCompanyCompensationData = {
        id: "comp_123",
        name: "Old",
        email: "old@test.com",
        status: CompanyStatus.PENDING,
        phone: null,
        address: null,
        city: null,
        state: null,
        postal_code: null,
        country_code: null,
        logo_url: null,
        spend_limit_reset_frequency: SpendLimitResetFrequency.MONTHLY,
      }

      await updateCompanyCompensationHandler(snapshot, context)

      expect(mockUpdateCompanies).toHaveBeenCalledTimes(1)
      expect(mockUpdateCompanies).toHaveBeenCalledWith(snapshot)
    })

    it("should propagate error if update fails during compensation", async () => {
      const snapshot: UpdateCompanyCompensationData = {
        id: "comp_123",
        name: "Old",
        email: "old@test.com",
        status: CompanyStatus.ACTIVE,
        phone: null,
        address: null,
        city: null,
        state: null,
        postal_code: null,
        country_code: null,
        logo_url: null,
        spend_limit_reset_frequency: SpendLimitResetFrequency.MONTHLY,
      }
      mockUpdateCompanies.mockRejectedValueOnce(new Error("Compensation failed"))

      await expect(updateCompanyCompensationHandler(snapshot, context)).rejects.toThrow("Compensation failed")
    })
  })

  describe("Workflow Export and Connections", () => {
    it("should export updateCompanyWorkflow", () => {
      expect(updateCompanyWorkflow).toBeDefined()
      expect(typeof updateCompanyWorkflow).toBe("function")
    })
  })
})
