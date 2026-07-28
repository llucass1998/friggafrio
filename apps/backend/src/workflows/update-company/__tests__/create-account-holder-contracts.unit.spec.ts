
import type { MedusaContainer } from "@medusajs/framework/types"
import { StepResponse } from "@medusajs/framework/workflows-sdk"
import {
  isCreateAccountHolderInput,
  buildCreateAccountHolderInput,
  isCreateAccountHolderCompensationData,
  buildCreateAccountHolderCompensationData,
  createAccountHolderStepHandler,
  createAccountHolderCompensationHandler,
  getExistingAccountHolderId,
  buildCompanyAccountHolderLinkPayload,
  buildCompanyAccountHolderDismissPayload,
  type CreateAccountHolderStepResult,
  type CreateAccountHolderCompensationData,
} from "../index"
import { MedusaError } from "@medusajs/framework/utils"
import * as isStripeConfiguredModule from "../../../utils/is-stripe-configured"
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { COMPANY_MODULE } from "../../../modules/company"

jest.mock("../../../utils/is-stripe-configured")

describe("Create Account Holder Contracts", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("isCreateAccountHolderInput", () => {
    it("returns true for a valid input", () => {
      expect(isCreateAccountHolderInput({
        company_id: "comp_123",
        company_email: "test@example.com"
      })).toBe(true)
    })

    it("returns false for undefined, null, arrays, and primitives", () => {
      expect(isCreateAccountHolderInput(undefined)).toBe(false)
      expect(isCreateAccountHolderInput(null)).toBe(false)
      expect(isCreateAccountHolderInput([])).toBe(false)
      expect(isCreateAccountHolderInput("string")).toBe(false)
    })

    it("returns false for missing properties", () => {
      expect(isCreateAccountHolderInput({})).toBe(false)
      expect(isCreateAccountHolderInput({ company_id: "comp_123" })).toBe(false)
      expect(isCreateAccountHolderInput({ company_email: "test@example.com" })).toBe(false)
    })

    it("returns false for invalid company_id", () => {
      expect(isCreateAccountHolderInput({ company_id: "", company_email: "test@example.com" })).toBe(false)
      expect(isCreateAccountHolderInput({ company_id: "   ", company_email: "test@example.com" })).toBe(false)
      expect(isCreateAccountHolderInput({ company_id: 123, company_email: "test@example.com" })).toBe(false)
      expect(isCreateAccountHolderInput({ company_id: null, company_email: "test@example.com" })).toBe(false)
    })

    it("returns false for invalid company_email", () => {
      expect(isCreateAccountHolderInput({ company_id: "comp_123", company_email: "" })).toBe(false)
      expect(isCreateAccountHolderInput({ company_id: "comp_123", company_email: "   " })).toBe(false)
      expect(isCreateAccountHolderInput({ company_id: "comp_123", company_email: 123 })).toBe(false)
      expect(isCreateAccountHolderInput({ company_id: "comp_123", company_email: null })).toBe(false)
      expect(isCreateAccountHolderInput({ company_id: "comp_123", company_email: "invalid-email" })).toBe(false)
    })
  })

  describe("buildCreateAccountHolderInput", () => {
    it("builds the exact object and normalizes trims", () => {
      const input = {
        company_id: "  comp_123  ",
        company_email: " TEST@example.com ",
        extra_prop: "should_be_stripped"
      }
      const built = buildCreateAccountHolderInput(input)

      expect(built).toStrictEqual({
        company_id: "comp_123",
        company_email: "test@example.com"
      })
      expect(Object.keys(built)).toHaveLength(2)

      // Ensures the original input is untouched
      expect(input.company_id).toBe("  comp_123  ")
    })

    it("throws INVALID_DATA for invalid inputs", () => {
      expect(() => buildCreateAccountHolderInput({ company_id: "comp_123" }))
        .toThrow(new MedusaError(MedusaError.Types.INVALID_DATA, "Invalid input for createAccountHolderStep"))
    })
  })

  describe("isCreateAccountHolderCompensationData", () => {
    it("returns true for a valid snapshot", () => {
      expect(isCreateAccountHolderCompensationData({
        company_id: "comp_123",
        account_holder_id: "acct_123"
      })).toBe(true)
    })

    it("returns false for invalid types and partial objects", () => {
      expect(isCreateAccountHolderCompensationData(undefined)).toBe(false)
      expect(isCreateAccountHolderCompensationData(null)).toBe(false)
      expect(isCreateAccountHolderCompensationData([])).toBe(false)
      expect(isCreateAccountHolderCompensationData({})).toBe(false)
      expect(isCreateAccountHolderCompensationData({ company_id: "comp_123" })).toBe(false)
    })

    it("returns false for invalid IDs", () => {
      expect(isCreateAccountHolderCompensationData({ company_id: "", account_holder_id: "acct_123" })).toBe(false)
      expect(isCreateAccountHolderCompensationData({ company_id: "comp_123", account_holder_id: "   " })).toBe(false)
      expect(isCreateAccountHolderCompensationData({ company_id: 123, account_holder_id: "acct_123" })).toBe(false)
      expect(isCreateAccountHolderCompensationData({ company_id: "comp_123", account_holder_id: 123 })).toBe(false)
    })
  })

  describe("buildCreateAccountHolderCompensationData", () => {
    it("builds the exact object, normalizes and strips extras", () => {
      const data = {
        company_id: "  comp_123  ",
        account_holder_id: " acct_123 ",
        extra: "strip_me"
      }

      const built = buildCreateAccountHolderCompensationData(data)
      expect(built).toStrictEqual({
        company_id: "comp_123",
        account_holder_id: "acct_123"
      })
      expect(Object.keys(built)).toHaveLength(2)
    })

    it("throws INVALID_DATA for invalid data", () => {
      expect(() => buildCreateAccountHolderCompensationData(null))
        .toThrow(new MedusaError(MedusaError.Types.INVALID_DATA, "Invalid compensation data for createAccountHolderStep"))
    })
  })

  describe("createAccountHolderStepHandler", () => {
    it("throws INVALID_DATA for invalid input before doing anything", async () => {
      const containerMock = { resolve: jest.fn() }

      await expect(
        createAccountHolderStepHandler({ company_id: "" }, { container: containerMock as Partial<MedusaContainer> as MedusaContainer })
      ).rejects.toThrow(new MedusaError(MedusaError.Types.INVALID_DATA, "Invalid input for createAccountHolderStep"))

      expect(containerMock.resolve).not.toHaveBeenCalled()
      expect(isStripeConfiguredModule.isStripeConfigured).not.toHaveBeenCalled()
    })

    it("returns skipped true and null compensation if stripe is not configured", async () => {
      const containerMock = { resolve: jest.fn() }
      ;(isStripeConfiguredModule.isStripeConfigured as jest.Mock).mockReturnValue(false)

      const response = await createAccountHolderStepHandler({
        company_id: "comp_123",
        company_email: "test@example.com"
      }, { container: containerMock as Partial<MedusaContainer> as MedusaContainer })

      const json = (response as StepResponse<CreateAccountHolderStepResult, CreateAccountHolderCompensationData | null>).toJSON();
      expect(json.output).toStrictEqual({ skipped: true });
      expect(json.compensateInput).toBeNull();
      expect(containerMock.resolve).not.toHaveBeenCalled()
    })

    it("returns skipped true if existing account holder is found in query", async () => {
      ;(isStripeConfiguredModule.isStripeConfigured as jest.Mock).mockReturnValue(true)
      const mockQuery = jest.fn().mockResolvedValue({
        data: [{ account_holder: { id: "acct_old" } }]
      })
      const containerMock = {
        resolve: jest.fn().mockImplementation((key) => {
          if (key === Modules.PAYMENT) return {}
          if (key === ContainerRegistrationKeys.QUERY) return { graph: mockQuery }
        })
      }

      const response = await createAccountHolderStepHandler({
        company_id: "comp_123",
        company_email: "test@example.com"
      }, { container: containerMock as Partial<MedusaContainer> as MedusaContainer })

      const json = (response as StepResponse<CreateAccountHolderStepResult, CreateAccountHolderCompensationData | null>).toJSON();
      expect(json.output).toStrictEqual({ skipped: true });
      expect(json.compensateInput).toBeNull();
    })

    it("creates holder, links, and returns step result with correct compensation data", async () => {
      ;(isStripeConfiguredModule.isStripeConfigured as jest.Mock).mockReturnValue(true)

      const mockQuery = jest.fn().mockResolvedValue({ data: [] })
      const mockPaymentService = {
        createAccountHolder: jest.fn().mockResolvedValue({ id: "acct_new" })
      }
      const mockLinkService = {
        create: jest.fn().mockResolvedValue(undefined)
      }

      const containerMock = {
        resolve: jest.fn().mockImplementation((key) => {
          if (key === Modules.PAYMENT) return mockPaymentService
          if (key === ContainerRegistrationKeys.QUERY) return { graph: mockQuery }
          if (key === ContainerRegistrationKeys.LINK) return mockLinkService
        })
      }

      const response = await createAccountHolderStepHandler({
        company_id: "  comp_123  ",
        company_email: "TEST@EXAMPLE.com"
      }, { container: containerMock as Partial<MedusaContainer> as MedusaContainer })

      // Normalized IDs
      const json = (response as StepResponse<CreateAccountHolderStepResult, CreateAccountHolderCompensationData | null>).toJSON();
      expect(json.output).toStrictEqual({ skipped: false, account_holder_id: "acct_new" });
      expect(json.compensateInput).toStrictEqual({ company_id: "comp_123", account_holder_id: "acct_new" });

      expect(mockPaymentService.createAccountHolder).toHaveBeenCalledWith({
        provider_id: "pp_stripe_stripe",
        context: {
          customer: {
            id: "comp_123",
            email: "test@example.com"
          }
        }
      })
    })
  })

  describe("createAccountHolderCompensationHandler", () => {
    it("returns early without resolving container if data is invalid", async () => {
      const containerMock = { resolve: jest.fn() }

      await createAccountHolderCompensationHandler(null, { container: containerMock as Partial<MedusaContainer> as MedusaContainer })
      await createAccountHolderCompensationHandler({}, { container: containerMock as Partial<MedusaContainer> as MedusaContainer })
      await createAccountHolderCompensationHandler({ company_id: "123", account_holder_id: "" }, { container: containerMock as Partial<MedusaContainer> as MedusaContainer })

      expect(containerMock.resolve).not.toHaveBeenCalled()
    })

    it("executes dismiss and deleteAccountHolder in correct order with normalized data", async () => {
      const mockPaymentService = {
        deleteAccountHolder: jest.fn().mockResolvedValue(undefined)
      }
      const mockLinkService = {
        dismiss: jest.fn().mockResolvedValue(undefined)
      }

      const containerMock = {
        resolve: jest.fn().mockImplementation((key) => {
          if (key === Modules.PAYMENT) return mockPaymentService
          if (key === ContainerRegistrationKeys.LINK) return mockLinkService
        })
      }

      await createAccountHolderCompensationHandler({
        company_id: "  comp_123  ",
        account_holder_id: "  acct_123  "
      }, { container: containerMock as Partial<MedusaContainer> as MedusaContainer })

      expect(mockLinkService.dismiss).toHaveBeenCalledTimes(1)
      expect(mockPaymentService.deleteAccountHolder).toHaveBeenCalledTimes(1)

      // Order Check - dismiss runs first
      expect(mockLinkService.dismiss.mock.invocationCallOrder[0])
        .toBeLessThan(mockPaymentService.deleteAccountHolder.mock.invocationCallOrder[0])

      expect(mockPaymentService.deleteAccountHolder).toHaveBeenCalledWith("acct_123")
    })

    it("propagates link.dismiss error and does not call deleteAccountHolder", async () => {
      const mockPaymentService = {
        deleteAccountHolder: jest.fn().mockResolvedValue(undefined)
      }
      const mockLinkService = {
        dismiss: jest.fn().mockRejectedValue(new Error("Database failure"))
      }

      const containerMock = {
        resolve: jest.fn().mockImplementation((key) => {
          if (key === Modules.PAYMENT) return mockPaymentService
          if (key === ContainerRegistrationKeys.LINK) return mockLinkService
        })
      }

      await expect(
        createAccountHolderCompensationHandler({
          company_id: "comp_123",
          account_holder_id: "acct_123"
        }, { container: containerMock as Partial<MedusaContainer> as MedusaContainer })
      ).rejects.toThrow("Database failure")

      expect(mockPaymentService.deleteAccountHolder).not.toHaveBeenCalled()
    })
  })

  describe("getExistingAccountHolderId", () => {
    it("returns null for empty array", () => {
      expect(getExistingAccountHolderId([])).toBeNull()
    })

    it("returns null for non-array inputs", () => {
      expect(getExistingAccountHolderId(null)).toBeNull()
      expect(getExistingAccountHolderId(undefined)).toBeNull()
      expect(getExistingAccountHolderId("string")).toBeNull()
      expect(getExistingAccountHolderId(42)).toBeNull()
      expect(getExistingAccountHolderId({})).toBeNull()
    })

    it("returns null when first element has no account_holder", () => {
      expect(getExistingAccountHolderId([{ id: "comp_123" }])).toBeNull()
      expect(getExistingAccountHolderId([{}])).toBeNull()
    })

    it("returns null when account_holder is not an object", () => {
      expect(getExistingAccountHolderId([{ account_holder: null }])).toBeNull()
      expect(getExistingAccountHolderId([{ account_holder: "string" }])).toBeNull()
      expect(getExistingAccountHolderId([{ account_holder: 42 }])).toBeNull()
      expect(getExistingAccountHolderId([{ account_holder: [] }])).toBeNull()
    })

    it("returns null when account_holder.id is missing or empty", () => {
      expect(getExistingAccountHolderId([{ account_holder: {} }])).toBeNull()
      expect(getExistingAccountHolderId([{ account_holder: { id: "" } }])).toBeNull()
      expect(getExistingAccountHolderId([{ account_holder: { id: "   " } }])).toBeNull()
      expect(getExistingAccountHolderId([{ account_holder: { id: null } }])).toBeNull()
      expect(getExistingAccountHolderId([{ account_holder: { id: 123 } }])).toBeNull()
    })

    it("returns the account_holder id string when valid", () => {
      expect(getExistingAccountHolderId([{ account_holder: { id: "acct_123" } }])).toBe("acct_123")
    })

    it("returns id from first element only, ignoring subsequent elements", () => {
      const data = [
        { account_holder: { id: "acct_first" } },
        { account_holder: { id: "acct_second" } },
      ]
      expect(getExistingAccountHolderId(data)).toBe("acct_first")
    })

    it("returns null when first element is missing but second has account_holder", () => {
      const data = [
        { id: "comp_123" },
        { account_holder: { id: "acct_second" } },
      ]
      expect(getExistingAccountHolderId(data)).toBeNull()
    })

    it("returns null when first element is a primitive in the array", () => {
      expect(getExistingAccountHolderId([null])).toBeNull()
      expect(getExistingAccountHolderId(["string"])).toBeNull()
      expect(getExistingAccountHolderId([42])).toBeNull()
    })
  })

  describe("buildCompanyAccountHolderLinkPayload", () => {
    it("builds a LinkDefinition with the correct module keys and field names", () => {
      const payload = buildCompanyAccountHolderLinkPayload("comp_123", "acct_456")
      expect(payload[COMPANY_MODULE]).toStrictEqual({ company_id: "comp_123" })
      expect(payload[Modules.PAYMENT]).toStrictEqual({ account_holder_id: "acct_456" })
    })

    it("contains exactly two module keys", () => {
      const payload = buildCompanyAccountHolderLinkPayload("comp_abc", "acct_xyz")
      expect(Object.keys(payload)).toHaveLength(2)
    })

    it("uses the provided ids without modification", () => {
      const payload = buildCompanyAccountHolderLinkPayload("  comp_trimmed  ", "  acct_trimmed  ")
      expect(payload[COMPANY_MODULE]).toStrictEqual({ company_id: "  comp_trimmed  " })
      expect(payload[Modules.PAYMENT]).toStrictEqual({ account_holder_id: "  acct_trimmed  " })
    })
  })

  describe("buildCompanyAccountHolderDismissPayload", () => {
    it("builds a LinkDefinition with the correct module keys and field names", () => {
      const payload = buildCompanyAccountHolderDismissPayload("comp_123", "acct_456")
      expect(payload[COMPANY_MODULE]).toStrictEqual({ company_id: "comp_123" })
      expect(payload[Modules.PAYMENT]).toStrictEqual({ account_holder_id: "acct_456" })
    })

    it("contains exactly two module keys", () => {
      const payload = buildCompanyAccountHolderDismissPayload("comp_abc", "acct_xyz")
      expect(Object.keys(payload)).toHaveLength(2)
    })

    it("dismiss payload is structurally identical to link payload for same inputs", () => {
      const link = buildCompanyAccountHolderLinkPayload("comp_123", "acct_456")
      const dismiss = buildCompanyAccountHolderDismissPayload("comp_123", "acct_456")
      expect(link).toStrictEqual(dismiss)
    })
  })

  describe("createAccountHolderStepHandler with typed query and link", () => {
    it("passes the correct typed payload to link.create on success", async () => {
      ;(isStripeConfiguredModule.isStripeConfigured as jest.Mock).mockReturnValue(true)

      const mockQuery = jest.fn().mockResolvedValue({ data: [] })
      const mockPaymentService = {
        createAccountHolder: jest.fn().mockResolvedValue({ id: "acct_new_typed" })
      }
      const mockLinkService = {
        create: jest.fn().mockResolvedValue(undefined)
      }

      const containerMock = {
        resolve: jest.fn().mockImplementation((key) => {
          if (key === Modules.PAYMENT) return mockPaymentService
          if (key === ContainerRegistrationKeys.QUERY) return { graph: mockQuery }
          if (key === ContainerRegistrationKeys.LINK) return mockLinkService
        })
      }

      await createAccountHolderStepHandler({
        company_id: "comp_typed",
        company_email: "typed@example.com"
      }, { container: containerMock as Partial<MedusaContainer> as MedusaContainer })

      expect(mockLinkService.create).toHaveBeenCalledWith(
        buildCompanyAccountHolderLinkPayload("comp_typed", "acct_new_typed")
      )
    })

    it("passes the correct typed payload to link.dismiss on compensation", async () => {
      const mockPaymentService = {
        deleteAccountHolder: jest.fn().mockResolvedValue(undefined)
      }
      const mockLinkService = {
        dismiss: jest.fn().mockResolvedValue(undefined)
      }

      const containerMock = {
        resolve: jest.fn().mockImplementation((key) => {
          if (key === Modules.PAYMENT) return mockPaymentService
          if (key === ContainerRegistrationKeys.LINK) return mockLinkService
        })
      }

      await createAccountHolderCompensationHandler({
        company_id: "comp_typed",
        account_holder_id: "acct_typed"
      }, { container: containerMock as Partial<MedusaContainer> as MedusaContainer })

      expect(mockLinkService.dismiss).toHaveBeenCalledWith(
        buildCompanyAccountHolderDismissPayload("comp_typed", "acct_typed")
      )
    })

    it("returns skipped true when getExistingAccountHolderId finds valid id", async () => {
      ;(isStripeConfiguredModule.isStripeConfigured as jest.Mock).mockReturnValue(true)

      const mockQuery = jest.fn().mockResolvedValue({
        data: [{ account_holder: { id: "acct_existing" } }]
      })
      const containerMock = {
        resolve: jest.fn().mockImplementation((key) => {
          if (key === Modules.PAYMENT) return {}
          if (key === ContainerRegistrationKeys.QUERY) return { graph: mockQuery }
        })
      }

      const response = await createAccountHolderStepHandler({
        company_id: "comp_123",
        company_email: "test@example.com"
      }, { container: containerMock as Partial<MedusaContainer> as MedusaContainer })

      const json = (response as StepResponse<CreateAccountHolderStepResult, CreateAccountHolderCompensationData | null>).toJSON()
      expect(json.output).toStrictEqual({ skipped: true })
      expect(json.compensateInput).toBeNull()
    })

    it("does NOT skip when query returns data without account_holder", async () => {
      ;(isStripeConfiguredModule.isStripeConfigured as jest.Mock).mockReturnValue(true)

      const mockQuery = jest.fn().mockResolvedValue({
        data: [{ id: "comp_123" }]
      })
      const mockPaymentService = {
        createAccountHolder: jest.fn().mockResolvedValue({ id: "acct_new" })
      }
      const mockLinkService = {
        create: jest.fn().mockResolvedValue(undefined)
      }
      const containerMock = {
        resolve: jest.fn().mockImplementation((key) => {
          if (key === Modules.PAYMENT) return mockPaymentService
          if (key === ContainerRegistrationKeys.QUERY) return { graph: mockQuery }
          if (key === ContainerRegistrationKeys.LINK) return mockLinkService
        })
      }

      const response = await createAccountHolderStepHandler({
        company_id: "comp_123",
        company_email: "test@example.com"
      }, { container: containerMock as Partial<MedusaContainer> as MedusaContainer })

      const json = (response as StepResponse<CreateAccountHolderStepResult, CreateAccountHolderCompensationData | null>).toJSON()
      expect(json.output).toStrictEqual({ skipped: false, account_holder_id: "acct_new" })
      expect(mockPaymentService.createAccountHolder).toHaveBeenCalledTimes(1)
    })
  })
})
