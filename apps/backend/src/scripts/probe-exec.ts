import type { ExecArgs } from "@medusajs/framework/types"

export default async function probe({ container }: ExecArgs) {
  console.log("PROBE_EXEC_STARTED", Boolean(container))
}
