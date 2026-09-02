import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

const isLoopbackDatabase = (value: string): boolean => {
  try {
    const url = new URL(value)
    return ["127.0.0.1", "localhost"].includes(url.hostname) && !/(^|_)prod(uction)?($|_)/i.test(url.pathname)
  } catch {
    return false
  }
}

/**
 * E2E gates use this proof from the process under test, not a caller-supplied
 * flag. It is deliberately absent outside NODE_ENV=test.
 */
export const GET = (_req: MedusaRequest, res: MedusaResponse): void => {
  const runtimeDatabase = process.env.DATABASE_URL || ""
  const testDatabase = process.env.TEST_DATABASE_URL || ""
  const isolated = process.env.NODE_ENV === "test"
    && Boolean(testDatabase)
    && runtimeDatabase === testDatabase
    && isLoopbackDatabase(runtimeDatabase)

  if (!isolated) {
    res.status(503).json({ isolated: false })
    return
  }

  res.status(200).json({ isolated: true })
}
