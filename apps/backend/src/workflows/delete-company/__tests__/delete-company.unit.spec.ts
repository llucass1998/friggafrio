import { MedusaError } from "@medusajs/framework/utils"
import { StepResponse } from "@medusajs/framework/workflows-sdk"
import { COMPANY_MODULE } from "../../../modules/company"
import {
  deleteCompanyStepHandler,
  deleteCompanyCompensationHandler,
  deleteCompanyWorkflow,
  isDeleteCompanyInput
} from "../index"

describe("Delete Company Workflow", () => {
  describe("Input Validation", () => {
    it("should return true for valid input", () => {
      expect(isDeleteCompanyInput({ id: "comp_123" })).toBe(true)
    })

    it("should return false for undefined input", () => {
      expect(isDeleteCompanyInput(undefined)).toBe(false)
    })

    it("should return false for null input", () => {
      expect(isDeleteCompanyInput(null)).toBe(false)
    })

    it("should return false for empty object", () => {
      expect(isDeleteCompanyInput({})).toBe(false)
    })

    it("should return false when id is missing", () => {
      expect(isDeleteCompanyInput({ name: "Company" })).toBe(false)
    })

    it("should return false when id is undefined", () => {
      expect(isDeleteCompanyInput({ id: undefined })).toBe(false)
    })

    it("should return false when id is null", () => {
      expect(isDeleteCompanyInput({ id: null })).toBe(false)
    })

    it("should return false when id is numeric", () => {
      expect(isDeleteCompanyInput({ id: 123 })).toBe(false)
    })

    it("should return false when id is empty string", () => {
      expect(isDeleteCompanyInput({ id: "" })).toBe(false)
    })

    it("should return false when id is only spaces", () => {
      expect(isDeleteCompanyInput({ id: "   " })).toBe(false)
    })
  })

  describe("deleteCompanyStepHandler", () => {
    let mockCompanyModuleService: {
      softDeleteCompanies: jest.Mock
    }
    let mockContainer: {
      resolve: jest.Mock
    }

    beforeEach(() => {
      mockCompanyModuleService = {
        softDeleteCompanies: jest.fn().mockResolvedValue(undefined),
      }
      mockContainer = {
        resolve: jest.fn().mockReturnValue(mockCompanyModuleService),
      }
    })

    afterEach(() => {
      jest.clearAllMocks()
    })

    it("should resolve COMPANY_MODULE and call softDeleteCompanies with valid input", async () => {
      const response = await deleteCompanyStepHandler(
        { id: "comp_123" },
        { container: mockContainer }
      )

      expect(mockContainer.resolve).toHaveBeenCalledWith(COMPANY_MODULE)
      expect(mockCompanyModuleService.softDeleteCompanies).toHaveBeenCalledTimes(1)
      expect(mockCompanyModuleService.softDeleteCompanies).toHaveBeenCalledWith("comp_123")

      // StepResponse wraps the compensation data. The response object internally holds the comp data.
      expect(response).toBeInstanceOf(StepResponse)
    })

    it("should not call service when input is invalid", async () => {
      await expect(
        deleteCompanyStepHandler({ id: "   " }, { container: mockContainer })
      ).rejects.toThrow(MedusaError)

      expect(mockCompanyModuleService.softDeleteCompanies).not.toHaveBeenCalled()
    })

    it("should propagate failure of softDeleteCompanies", async () => {
      const expectedError = new Error("DB failure")
      mockCompanyModuleService.softDeleteCompanies.mockRejectedValue(expectedError)

      await expect(
        deleteCompanyStepHandler({ id: "comp_123" }, { container: mockContainer })
      ).rejects.toThrow(expectedError)
    })
  })

  describe("deleteCompanyCompensationHandler", () => {
    let mockCompanyModuleService: {
      restoreCompanies: jest.Mock
    }
    let mockContainer: {
      resolve: jest.Mock
    }

    beforeEach(() => {
      mockCompanyModuleService = {
        restoreCompanies: jest.fn().mockResolvedValue(undefined),
      }
      mockContainer = {
        resolve: jest.fn().mockReturnValue(mockCompanyModuleService),
      }
    })

    afterEach(() => {
      jest.clearAllMocks()
    })

    it("should call restoreCompanies once with valid ID", async () => {
      await deleteCompanyCompensationHandler("comp_123", { container: mockContainer })

      expect(mockContainer.resolve).toHaveBeenCalledWith(COMPANY_MODULE)
      expect(mockCompanyModuleService.restoreCompanies).toHaveBeenCalledTimes(1)
      expect(mockCompanyModuleService.restoreCompanies).toHaveBeenCalledWith("comp_123")
    })

    it("should not call restore when ID is undefined", async () => {
      await deleteCompanyCompensationHandler(undefined, { container: mockContainer })
      expect(mockCompanyModuleService.restoreCompanies).not.toHaveBeenCalled()
    })

    it("should not call restore when ID is null", async () => {
      await deleteCompanyCompensationHandler(null, { container: mockContainer })
      expect(mockCompanyModuleService.restoreCompanies).not.toHaveBeenCalled()
    })

    it("should not call restore when ID is an empty string", async () => {
      await deleteCompanyCompensationHandler("", { container: mockContainer })
      expect(mockCompanyModuleService.restoreCompanies).not.toHaveBeenCalled()
    })

    it("should not call restore when ID is only spaces", async () => {
      await deleteCompanyCompensationHandler("   ", { container: mockContainer })
      expect(mockCompanyModuleService.restoreCompanies).not.toHaveBeenCalled()
    })

    it("should propagate failure of restoreCompanies", async () => {
      const expectedError = new Error("Restore DB failure")
      mockCompanyModuleService.restoreCompanies.mockRejectedValue(expectedError)

      await expect(
        deleteCompanyCompensationHandler("comp_123", { container: mockContainer })
      ).rejects.toThrow(expectedError)
    })
  })

  describe("Workflow Export", () => {
    it("should export deleteCompanyWorkflow", () => {
      expect(deleteCompanyWorkflow).toBeDefined()
      expect(typeof deleteCompanyWorkflow.run).toBe("function")
    })
  })
})