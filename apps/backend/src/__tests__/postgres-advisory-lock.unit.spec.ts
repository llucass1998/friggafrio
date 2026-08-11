import {
  withPostgresAdvisoryLock,
  type AdvisoryLockTransactionRunner
} from "../lib/postgres-advisory-lock"

describe("PostgreSQL advisory lock", () => {
  it("holds a transaction-scoped database lock while the work runs", async () => {
    const events: string[] = []
    const runTransaction: AdvisoryLockTransactionRunner = async (handler) => {
      events.push("transaction:start")
      const result = await handler({
        raw: async (sql, bindings) => {
          events.push(`${sql}:${String(bindings?.[0])}`)
        }
      })
      events.push("transaction:commit")
      return result
    }

    await expect(
      withPostgresAdvisoryLock(runTransaction, "commercial-seed", async () => {
        events.push("work")
        return "done"
      })
    ).resolves.toBe("done")

    expect(events).toEqual([
      "transaction:start",
      "SELECT pg_advisory_xact_lock(hashtext(?)):commercial-seed",
      "work",
      "transaction:commit"
    ])
  })

  it("keeps concurrent work serialized for the lifetime of the database transaction", async () => {
    let transactionTail = Promise.resolve()
    const runTransaction: AdvisoryLockTransactionRunner = async (handler) => {
      const previousTransaction = transactionTail
      let releaseTransaction!: () => void
      transactionTail = new Promise<void>((resolve) => {
        releaseTransaction = resolve
      })

      await previousTransaction

      try {
        return await handler({ raw: async () => undefined })
      } finally {
        releaseTransaction()
      }
    }

    let releaseFirstWork!: () => void
    let markFirstEntered!: () => void
    const firstWorkEntered = new Promise<void>((resolve) => {
      markFirstEntered = resolve
    })
    const firstWorkGate = new Promise<void>((resolve) => {
      releaseFirstWork = resolve
    })
    const events: string[] = []

    const first = withPostgresAdvisoryLock(
      runTransaction,
      "commercial-seed",
      async () => {
        events.push("first:start")
        markFirstEntered()
        await firstWorkGate
        events.push("first:end")
      }
    )
    const second = withPostgresAdvisoryLock(
      runTransaction,
      "commercial-seed",
      async () => {
        events.push("second:start")
      }
    )

    await firstWorkEntered
    await Promise.resolve()
    expect(events).toEqual(["first:start"])

    releaseFirstWork()
    await Promise.all([first, second])

    expect(events).toEqual(["first:start", "first:end", "second:start"])
  })

  it("rejects empty lock keys before opening a transaction", async () => {
    let transactionCalls = 0
    const runTransaction: AdvisoryLockTransactionRunner = async () => {
      transactionCalls += 1
      throw new Error("Transaction should not run.")
    }

    await expect(
      withPostgresAdvisoryLock(runTransaction, "  ", async () => undefined)
    ).rejects.toThrow("cannot be empty")
    expect(transactionCalls).toBe(0)
  })
})
