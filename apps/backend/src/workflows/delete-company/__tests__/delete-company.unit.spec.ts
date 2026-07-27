
import { MedusaError } from "@medusajs/framework/utils"
import { COMPANY_MODULE } from "../../../modules/company"

// Extract handlers for direct testing
import { 
  deleteCompanyStepHandler, 
  deleteCompanyCompensationHandler,
  isDeleteCompanyInput 
} from "../index"

describe("deleteCompanyWorkflow", () => {
  const mockCompanyModuleService = {
    softDeleteCompanies: jest.fn(),
    restoreCompanies: jest.fn(),
  }

  const mockContainer = {
    resolve: jest.fn((key) => {
      if (key === COMPANY_MODULE) return mockCompanyModuleService
      throw new Error(`Unexpected resolution of ${key}`)
    }),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("isDeleteCompanyInput validation", () => {
    it("should return true for valid input", () => {
      expect(isDeleteCompanyInput({ id: "comp_123" })).toBe(true)
    })

    it("should return false for missing id", () => {
      expect(isDeleteCompanyInput({})).toBe(false)
    })

    it("should return false for empty string id", () => {
      expect(isDeleteCompanyInput({ id: "" })).toBe(false)
      expect(isDeleteCompanyInput({ id: "   " })).toBe(false)
    })

    it("should return false for invalid types", () => {
      expect(isDeleteCompanyInput(null)).toBe(false)
      expect(isDeleteCompanyInput(undefined)).toBe(false)
      expect(isDeleteCompanyInput("string")).toBe(false)
      expect(isDeleteCompanyInput({ id: 123 })).toBe(false)
    })
  })

  describe("deleteCompanyStepHandler", () => {
    it("should successfully soft delete a company and return a StepResponse", async () => {
      const input = { id: "comp_123" }
      
      const response = await deleteCompanyStepHandler(input as any, { container: mockContainer })
      
      expect(mockContainer.resolve).toHaveBeenCalledWith(COMPANY_MODULE)
      expect(mockCompanyModuleService.softDeleteCompanies).toHaveBeenCalledWith("comp_123")
      // Output is undefined, compensation data is the ID
      expect((response as any).output).toBeUndefined()
      expect((response as any).compensateInput).toBe("comp_123")
    })

    it("should throw MedusaError for invalid input", async () => {
      const input = { id: "" }
      
      await expect(
        deleteCompanyStepHandler(input as any, { container: mockContainer })
      ).rejects.toThrow(MedusaError)
      
      expect(mockCompanyModuleService.softDeleteCompanies).not.toHaveBeenCalled()
    })
  })

  describe("deleteCompanyCompensationHandler", () => {
    it("should successfully restore a company", async () => {
      const id = "comp_123"
      
      await deleteCompanyCompensationHandler(id, { container: mockContainer })
      
      expect(mockContainer.resolve).toHaveBeenCalledWith(COMPANY_MODULE)
      expect(mockCompanyModuleService.restoreCompanies).toHaveBeenCalledWith("comp_123")
    })

    it("should silently return for invalid compensation data", async () => {
      // It shouldn't crash if compensation data is malformed, just skip
      await deleteCompanyCompensationHandler(null, { container: mockContainer })
      await deleteCompanyCompensationHandler("", { container: mockContainer })
      await deleteCompanyCompensationHandler({ id: "comp_123" }, { container: mockContainer }) // Expects primitive string
      
      expect(mockCompanyModuleService.restoreCompanies).not.toHaveBeenCalled()
    })
  })
})
