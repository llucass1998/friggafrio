import { POST } from "../route";
import { CreateContactRequestSchema } from "../validators";
import { CONTACT_REQUEST_MODULE } from "../../../../modules/contact-request";
import { Modules } from "@medusajs/framework/utils";

describe("POST /store/contact-requests", () => {
  let mockReq: any;
  let mockRes: any;
  let mockContactRequestService: any;
  let mockNotificationModuleService: any;
  let mockLogger: any;

  beforeEach(() => {
    mockContactRequestService = {
      createContactRequests: jest.fn().mockResolvedValue({
        id: "creq_123",
        name: "John",
        email: "john@example.com",
        status: "received",
        created_at: new Date().toISOString()
      }),
      updateContactRequests: jest.fn().mockResolvedValue({})
    };

    mockNotificationModuleService = {
      createNotifications: jest.fn().mockResolvedValue({})
    };

    mockLogger = {
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn()
    };

    mockReq = {
      body: {},
      scope: {
        resolve: jest.fn((key: string) => {
          if (key === CONTACT_REQUEST_MODULE) return mockContactRequestService;
          if (key === Modules.NOTIFICATION) return mockNotificationModuleService;
          if (key === "logger") return mockLogger;
          return null;
        })
      }
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    process.env.ADMIN_EMAIL = "admin@test.com";
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should validate schema properly (invalid -> 400)", async () => {
    mockReq.body = {
      name: "John",
      // missing email
      message: "Hello"
    };

    await POST(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      type: "invalid_data"
    }));
  });

  it("should sanitize user input and save to Postgres without returning PII (valid -> 201)", async () => {
    mockReq.body = {
      name: "John Doe",
      email: "john@example.com",
      message: "Hello there!",
      website: "" // honeypot empty
    };

    await POST(mockReq, mockRes);
    expect(mockContactRequestService.createContactRequests).toHaveBeenCalledWith({
      name: "John Doe",
      email: "john@example.com",
      message: "Hello there!"
    });

    expect(mockRes.status).toHaveBeenCalledWith(201);
    const jsonCall = mockRes.json.mock.calls[0][0];
    // Check no PII in response
    expect(jsonCall.contact_request.name).toBeUndefined();
    expect(jsonCall.contact_request.email).toBeUndefined();
    expect(jsonCall.contact_request.message).toBeUndefined();
    expect(jsonCall.contact_request.id).toBe("creq_123");
  });

  it("should correctly apply honeypot", async () => {
    mockReq.body = {
      name: "Spammer",
      email: "spam@example.com",
      message: "Cheap meds",
      website: "http://spam.com" // honeypot filled
    };

    await POST(mockReq, mockRes);
    expect(mockContactRequestService.createContactRequests).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      contact_request: expect.objectContaining({
        status: "spam_rejected"
      })
    }));
  });

  it("should ignore missing notification provider gracefully", async () => {
    mockReq.body = {
      name: "John Doe",
      email: "john@example.com",
      message: "Hello there!",
      website: ""
    };

    mockReq.scope.resolve = jest.fn((key: string) => {
      if (key === CONTACT_REQUEST_MODULE) return mockContactRequestService;
      if (key === Modules.NOTIFICATION) return null; // No provider
      if (key === "logger") return mockLogger;
      return null;
    });

    await POST(mockReq, mockRes);
    expect(mockContactRequestService.createContactRequests).toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(201);
    // Should not try to update notification_sent status
    expect(mockContactRequestService.updateContactRequests).not.toHaveBeenCalled();
  });

  it("should ignore notification failure gracefully", async () => {
    mockReq.body = {
      name: "John Doe",
      email: "john@example.com",
      message: "Hello there!"
    };

    mockNotificationModuleService.createNotifications.mockRejectedValue(new Error("Send failed"));

    await POST(mockReq, mockRes);
    expect(mockContactRequestService.createContactRequests).toHaveBeenCalled();
    expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining("Failed to send contact request notification"));
    expect(mockRes.status).toHaveBeenCalledWith(201); // Still returns 201
  });

  it("should correctly update notification_sent status on success", async () => {
    mockReq.body = {
      name: "John Doe",
      email: "john@example.com",
      message: "Hello there!"
    };

    await POST(mockReq, mockRes);
    expect(mockNotificationModuleService.createNotifications).toHaveBeenCalled();
    expect(mockContactRequestService.updateContactRequests).toHaveBeenCalledWith({
      id: "creq_123",
      notification_sent: true
    });
  });

  it("should throw 500 without details if DB save fails", async () => {
    mockReq.body = {
      name: "John Doe",
      email: "john@example.com",
      message: "Hello there!"
    };

    mockContactRequestService.createContactRequests.mockRejectedValue(new Error("Database connection lost"));

    await POST(mockReq, mockRes);
    expect(mockLogger.error).toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      type: "internal_error",
      message: "Ocorreu um erro ao processar sua solicitação de contato."
    });
  });
});