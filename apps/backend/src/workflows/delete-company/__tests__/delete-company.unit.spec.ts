import { MedusaError } from "@medusajs/framework/utils"
import { COMPANY_MODULE } from "../../../modules/company"
import type CompanyModuleService from "../../../modules/company/service"
import type { MedusaContainer } from "@medusajs/framework/types"
import { StepResponse } from "@medusajs/framework/workflows-sdk"

import { 
  deleteCompanyStepHandler, 
  deleteCompanyCompensationHandler,
  isDeleteCompanyInput,
  deleteCompanyWorkflow
} from "../index"

type CompanyServiceContract = Pick<
  CompanyModuleService,
  "softDeleteCompanies" | "restoreCompanies"
>

describe("deleteCompanyWorkflow", () => {
  const mockCompanyModuleService: jest.Mocked<CompanyServiceContract> = {
    softDeleteCompanies: jest.fn(),
    restoreCompanies: jest.fn(),
  }

  // A strict mock that acts as a MedusaContainer
  // We use object spreading to add our mock implementation of resolve
  const resolveMock = jest.fn()
  const mockContainer = {
    resolve: resolveMock
  } as Pick<MedusaContainer, "resolve"> & Record<string, unknown>

  const context = {
    container: mockContainer as MedusaContainer
  }

  beforeEach(() => {
    jest.resetAllMocks()
    resolveMock.mockImplementation((key: string) => {
      if (key === COMPANY_MODULE) return mockCompanyModuleService
      throw new Error(`Unexpected resolution of ${key}`)
    })
  })

  describe("isDeleteCompanyInput validation", () => {
    it("should return true for valid input", () => {
      expect(isDeleteCompanyInput({ id: "comp_123" })).toBe(true)
    })

    const invalidInputs = [
      { name: "undefined", value: undefined },
      { name: "null", value: null },
      { name: "string", value: "string" },
      { name: "number", value: 123 },
      { name: "array", value: [] },
      { name: "empty object", value: {} },
      { name: "id undefined", value: { id: undefined } },
      { name: "id null", value: { id: null } },
      { name: "id boolean", value: { id: true } },
      { name: "id numeric", value: { id: 123 } },
      { name: "id empty", value: { id: "" } },
      { name: "id spaces", value: { id: "   " } }
    ]

    it.each(invalidInputs)("should return false for $name", ({ value }) => {
      expect(isDeleteCompanyInput(value)).toBe(false)
    })
  })

  describe("deleteCompanyStepHandler", () => {
    it("should successfully soft delete a company and return a StepResponse", async () => {
      const input = { id: "comp_123" }
      
      const response = await deleteCompanyStepHandler(input, context)
      
      expect(mockContainer.resolve).toHaveBeenCalledWith(COMPANY_MODULE)
      expect(mockCompanyModuleService.softDeleteCompanies).toHaveBeenCalledTimes(1)
      expect(mockCompanyModuleService.softDeleteCompanies).toHaveBeenCalledWith("comp_123")
      
      expect(response).toBeInstanceOf(StepResponse)
    })

    it("should process valid ID with spaces by trimming it", async () => {
      const input = { id: "  comp_123  " }
      
      await deleteCompanyStepHandler(input, context)
      
      expect(mockCompanyModuleService.softDeleteCompanies).toHaveBeenCalledWith("comp_123")
    })

    const invalidInputs = [
      { name: "undefined", value: undefined },
      { name: "null", value: null },
      { name: "string", value: "string" },
      { name: "number", value: 123 },
      { name: "array", value: [] },
      { name: "empty object", value: {} },
      { name: "id undefined", value: { id: undefined } },
      { name: "id null", value: { id: null } },
      { name: "id boolean", value: { id: true } },
      { name: "id numeric", value: { id: 123 } },
      { name: "id empty", value: { id: "" } },
      { name: "id spaces", value: { id: "   " } }
    ]

    it.each(invalidInputs)("should throw INVALID_DATA and not resolve service for $name", async ({ value }) => {
      await expect(deleteCompanyStepHandler(value, context)).rejects.toThrow(MedusaError)
      await expect(deleteCompanyStepHandler(value, context)).rejects.toThrow(/Invalid input/)
      
      expect(mockContainer.resolve).not.toHaveBeenCalled()
      expect(mockCompanyModuleService.softDeleteCompanies).not.toHaveBeenCalled()
    })

    it("should propagate error if softDeleteCompanies fails and not return StepResponse", async () => {
      const input = { id: "comp_123" }
      const error = new Error("DB Error")
      mockCompanyModuleService.softDeleteCompanies.mockRejectedValueOnce(error)
      
      await expect(deleteCompanyStepHandler(input, context)).rejects.toThrow("DB Error")
    })
  })

  describe("deleteCompanyCompensationHandler", () => {
    it("should successfully restore a company", async () => {
      const id = "comp_123"
      
      await deleteCompanyCompensationHandler(id, context)
      
      expect(mockContainer.resolve).toHaveBeenCalledWith(COMPANY_MODULE)
      expect(mockCompanyModuleService.restoreCompanies).toHaveBeenCalledTimes(1)
      expect(mockCompanyModuleService.restoreCompanies).toHaveBeenCalledWith("comp_123")
    })
    
    it("should trim the ID before restoring", async () => {
      const id = "  comp_123  "
      
      await deleteCompanyCompensationHandler(id, context)
      
      expect(mockCompanyModuleService.restoreCompanies).toHaveBeenCalledWith("comp_123")
    })

    const invalidIds = [
      { name: "undefined", value: undefined },
      { name: "null", value: null },
      { name: "empty string", value: "" },
      { name: "spaces only", value: "   " },
      { name: "object", value: { id: "comp_123" } }
    ]

    it.each(invalidIds)("should silently return without resolving service for $name", async ({ value }) => {
      await deleteCompanyCompensationHandler(value, context)
      
      expect(mockContainer.resolve).not.toHaveBeenCalled()
      expect(mockCompanyModuleService.restoreCompanies).not.toHaveBeenCalled()
    })

    it("should propagate exact error if restoreCompanies fails", async () => {
      const id = "comp_123"
      const error = new Error("Restore Failed")
      mockCompanyModuleService.restoreCompanies.mockRejectedValueOnce(error)
      
      await expect(deleteCompanyCompensationHandler(id, context)).rejects.toThrow("Restore Failed")
    })
  })

  describe("Workflow Export", () => {
    it("should export the deleteCompanyWorkflow", () => {
      expect(deleteCompanyWorkflow).toBeDefined()
      // Basic check to see it is a workflow (callable object/function)
      expect(typeof deleteCompanyWorkflow).toBe("function")
    })
  })
})
