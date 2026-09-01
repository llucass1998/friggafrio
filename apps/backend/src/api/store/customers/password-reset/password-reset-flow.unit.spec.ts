import { Modules } from "@medusajs/framework/utils"
import { sign } from "jsonwebtoken"
import { PASSWORD_RESET_TOKEN_MODULE } from "../../../../modules/password-reset-token"
import { POST as requestPasswordReset } from "./route"
import { POST as confirmPasswordReset } from "./confirm/route"

type StoredResetToken = {
  id: string
  token_hash: string
  customer_email: string
  expires_at: Date
  consumed_at: Date | null
}

const createResponse = () => {
  const response = {
    statusCode: 200,
    payload: undefined as unknown,
    status(code: number) {
      this.statusCode = code
      return this
    },
    json(payload: unknown) {
      this.payload = payload
      return this
    },
  }

  return response
}

describe("persistent password reset flow", () => {
  it("allows exactly one concurrent confirmation for an issued token", async () => {
    const records: StoredResetToken[] = []
    let eventToken = ""
    let locked = false
    const waiters: Array<() => void> = []
    const auth = {
      listProviderIdentities: jest.fn().mockResolvedValue([{ id: "auth_1" }]),
      updateProvider: jest.fn().mockResolvedValue({ success: true }),
    }
    const resetTokens = {
      listPasswordResetTokens: jest.fn(async (filters: Partial<StoredResetToken>) =>
        records.filter((record) =>
          Object.entries(filters).every(([key, value]) =>
            record[key as keyof StoredResetToken] === value,
          ),
        ),
      ),
      createPasswordResetTokens: jest.fn(async (input) => {
        const record: StoredResetToken = {
          id: "reset_1",
          consumed_at: null,
          ...input,
        }
        records.push(record)
        return record
      }),
      updatePasswordResetTokens: jest.fn(async (input) => {
        for (const update of Array.isArray(input) ? input : [input]) {
          const record = records.find((candidate) => candidate.id === update.id)
          if (record) Object.assign(record, update)
        }
      }),
    }
    const locking = {
      acquire: jest.fn(async () => {
        if (!locked) {
          locked = true
          return
        }
        await new Promise<void>((resolve) => waiters.push(resolve))
        locked = true
      }),
      release: jest.fn(async () => {
        locked = false
        waiters.shift()?.()
        return true
      }),
    }
    const eventBus = {
      emit: jest.fn(async (event) => {
        eventToken = event.data.token
      }),
    }
    const scope = {
      resolve(key: string) {
        if (key === Modules.AUTH) return auth
        if (key === Modules.LOCKING) return locking
        if (key === Modules.EVENT_BUS) return eventBus
        if (key === PASSWORD_RESET_TOKEN_MODULE) return resetTokens
        if (key === "configModule") {
          return { projectConfig: { http: { jwtSecret: "test-secret" } } }
        }
        throw new Error(`Unexpected dependency: ${key}`)
      },
    }

    const requestResponse = createResponse()
    await requestPasswordReset(
      {
        validatedBody: { email: "customer@example.com" },
        scope,
      } as never,
      requestResponse as never,
    )

    expect(requestResponse.statusCode).toBe(202)
    expect(eventToken).not.toBe("")
    expect(records).toHaveLength(1)
    expect(records[0].token_hash).not.toContain(eventToken)

    const firstResponse = createResponse()
    const secondResponse = createResponse()
    const confirmationRequest = (response: ReturnType<typeof createResponse>) =>
      confirmPasswordReset(
        {
          validatedBody: { token: eventToken, password: "new-password-123" },
          scope,
        } as never,
        response as never,
      )

    await Promise.all([
      confirmationRequest(firstResponse),
      confirmationRequest(secondResponse),
    ])

    expect([firstResponse.statusCode, secondResponse.statusCode].sort()).toEqual([
      200,
      400,
    ])
    expect(auth.updateProvider).toHaveBeenCalledTimes(1)
    expect(records[0].consumed_at).toBeInstanceOf(Date)
  })

  it("does not consume a valid token when the provider rejects the password", async () => {
    const records = [{
      id: "reset_failure",
      token_hash: "hash",
      customer_email: "customer@example.com",
      expires_at: new Date(Date.now() + 60_000),
      consumed_at: null,
    }]
    const auth = {
      updateProvider: jest.fn().mockResolvedValue({ success: false }),
    }
    const resetTokens = {
      listPasswordResetTokens: jest.fn().mockResolvedValue(records),
      updatePasswordResetTokens: jest.fn(),
    }
    const locking = {
      acquire: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(true),
    }
    const scope = {
      resolve(key: string) {
        if (key === Modules.AUTH) return auth
        if (key === Modules.LOCKING) return locking
        if (key === PASSWORD_RESET_TOKEN_MODULE) return resetTokens
        if (key === "configModule") {
          return { projectConfig: { http: { jwtSecret: "test-secret" } } }
        }
        throw new Error(`Unexpected dependency: ${key}`)
      },
    }
    const response = createResponse()
    const token = sign(
      {
        entity_id: "customer@example.com",
        actor_type: "customer",
        provider: "emailpass",
        purpose: "reset",
        jti: "reset_failure",
      },
      "test-secret",
      { expiresIn: 300 },
    )

    await confirmPasswordReset(
      { validatedBody: { token, password: "new-password-123" }, scope } as never,
      response as never,
    )

    expect(response.statusCode).toBe(400)
    expect(resetTokens.updatePasswordResetTokens).not.toHaveBeenCalled()
  })
})
