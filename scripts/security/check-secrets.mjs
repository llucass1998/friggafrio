import { ScanInfrastructureError, hasFindings, printReport, scanRepository } from "./secret-scan-lib.mjs"

try {
  const report = scanRepository(process.cwd())
  printReport(report)
  if (hasFindings(report)) {
    console.error("Secret scan failed: review sanitized findings.")
    process.exitCode = 1
  } else {
    console.log("Reusable secret scan: PASS")
  }
} catch (error) {
  const scope = error instanceof ScanInfrastructureError ? error.scope : "unknown"
  console.error(`SCANNER_INFRASTRUCTURE_FAILURE scope=${scope}`)
  process.exitCode = 2
}
