import { request } from "node:http"

const backendBaseUrl = process.env.E2E_BACKEND_URL ?? "http://127.0.0.1:9000"
const backendHealthUrl = `${backendBaseUrl.replace(/\/$/u, "")}/health/ready`
const backendIsolationUrl = `${backendBaseUrl.replace(/\/$/u, "")}/health/e2e-isolation`

const checkEndpoint = async (url: string, expectedBody?: "isolated"): Promise<void> => {
  await new Promise<void>((resolve, reject) => {
    const req = request(url, { timeout: 5_000 }, (response) => {
      let body = ""
      response.setEncoding("utf8")
      response.on("data", (chunk) => { body += chunk })
      response.on("end", () => {
        const healthy = response.statusCode && response.statusCode >= 200 && response.statusCode < 300
        if (!healthy) return reject(new Error(`E2E_RELEASE_PREFLIGHT_BACKEND_UNHEALTHY:${response.statusCode ?? "no_status"}`))
        if (expectedBody === "isolated" && !/"isolated"\s*:\s*true/.test(body)) {
          return reject(new Error("E2E_RELEASE_PREFLIGHT_RUNTIME_DATABASE_NOT_ISOLATED"))
        }
        resolve()
      })
    })
    req.on("timeout", () => req.destroy(new Error("E2E_RELEASE_PREFLIGHT_BACKEND_TIMEOUT")))
    req.on("error", reject)
    req.end()
  })
}

export default async function globalSetup(): Promise<void> {
  if (process.env.E2E_BACKEND_ISOLATION_ATTESTED !== "1") {
    throw new Error("E2E_RELEASE_PREFLIGHT_BACKEND_ISOLATION_ATTESTATION_REQUIRED")
  }
  let parsedBackend: URL
  try {
    parsedBackend = new URL(backendBaseUrl)
  } catch {
    throw new Error("E2E_RELEASE_PREFLIGHT_BACKEND_URL_INVALID")
  }
  if (parsedBackend.protocol !== "http:" || !["127.0.0.1", "localhost"].includes(parsedBackend.hostname)) {
    throw new Error("E2E_RELEASE_PREFLIGHT_BACKEND_MUST_BE_LOOPBACK")
  }
  await checkEndpoint(backendHealthUrl)
  await checkEndpoint(backendIsolationUrl, "isolated")
}
