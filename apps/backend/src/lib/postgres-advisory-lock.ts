type AdvisoryLockTransaction = {
  raw: (sql: string, bindings?: unknown[]) => Promise<unknown>
}

export type AdvisoryLockTransactionRunner = <T>(
  handler: (transaction: AdvisoryLockTransaction) => Promise<T>
) => Promise<T>

export const withPostgresAdvisoryLock = async <T>(
  runTransaction: AdvisoryLockTransactionRunner,
  lockKey: string,
  work: () => Promise<T>
): Promise<T> => {
  const normalizedLockKey = lockKey.trim()

  if (!normalizedLockKey) {
    throw new Error("PostgreSQL advisory lock key cannot be empty.")
  }

  return runTransaction(async (transaction) => {
    await transaction.raw("SELECT pg_advisory_xact_lock(hashtext(?))", [
      normalizedLockKey
    ])

    return work()
  })
}
