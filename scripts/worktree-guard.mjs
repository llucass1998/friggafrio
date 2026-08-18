/**
 * FriggaFrio Worktree Guard — Fail-Closed
 *
 * Prevents local dev/seed/start execution from any worktree other than the
 * canonical Maestro worktree.
 *
 * Discovery method:
 *   git worktree list --porcelain → find refs/heads/Maestro → extract path
 *
 * CI bypass:
 *   ONLY when GITHUB_ACTIONS === "true" (specific to the project's CI).
 *   Generic CI=true does NOT bypass.
 *
 * This script NEVER:
 *   - Runs git switch/checkout/reset/clean
 *   - Moves or copies files
 *   - Auto-corrects anything
 *   - Provides --force or override flags
 *
 * It only VALIDATES or BLOCKS.
 */

import { execFileSync } from "node:child_process"

const EXPECTED_BRANCH = "Maestro"
const EXPECTED_REF = `refs/heads/${EXPECTED_BRANCH}`

// --- CI bypass (GITHUB_ACTIONS only) ------------------------------------
if (process.env.GITHUB_ACTIONS === "true") {
  console.log("FRIGGAFRIO_WORKTREE_GUARD")
  console.log("ENVIRONMENT: GITHUB_ACTIONS")
  console.log("RESULT: CI_BYPASS")
  process.exit(0)
}

// --- Helpers ------------------------------------------------------------

/** Normalize a path for reliable comparison on Windows */
function normalizePath(p) {
  return p
    .trim()
    .replace(/\\/g, "/")   // backslash -> forward slash
    .replace(/\/+$/g, "")  // strip trailing slashes
    .toLowerCase()
}

/** Run a git command and return trimmed stdout */
function git(...args) {
  return execFileSync("git", args, {
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  }).trim()
}

// --- Discover canonical worktree from Git metadata ----------------------

function discoverCanonicalWorktree() {
  let porcelainOutput
  try {
    porcelainOutput = git("worktree", "list", "--porcelain")
  } catch (err) {
    console.error("FRIGGAFRIO_WORKTREE_GUARD_BLOCKED")
    console.error("")
    console.error("Failed to run: git worktree list --porcelain")
    console.error(`Error: ${err.message}`)
    console.error("")
    console.error("NO COMMAND EXECUTED.")
    process.exit(1)
  }

  // Parse porcelain format.  Each worktree block is separated by a blank
  // line and looks like:
  //   worktree <path>
  //   HEAD <sha>
  //   branch <ref>        <- or "detached"
  const blocks = porcelainOutput.split(/\n\n+/).filter(Boolean)

  for (const block of blocks) {
    const lines = block.split("\n")
    let worktreePath = null
    let branchRef = null

    for (const line of lines) {
      if (line.startsWith("worktree ")) {
        worktreePath = line.slice("worktree ".length)
      } else if (line.startsWith("branch ")) {
        branchRef = line.slice("branch ".length)
      }
    }

    if (branchRef === EXPECTED_REF && worktreePath) {
      return worktreePath
    }
  }

  return null // No worktree found for refs/heads/Maestro
}

// --- Main guard logic ---------------------------------------------------

const canonicalRaw = discoverCanonicalWorktree()

if (!canonicalRaw) {
  console.error("FRIGGAFRIO_WORKTREE_GUARD_BLOCKED")
  console.error("")
  console.error(`No worktree found for branch: ${EXPECTED_BRANCH}`)
  console.error("Could not discover canonical worktree via git worktree list --porcelain.")
  console.error("")
  console.error("NO COMMAND EXECUTED.")
  process.exit(1)
}

let currentWorktreeRaw
try {
  currentWorktreeRaw = git("rev-parse", "--show-toplevel")
} catch (err) {
  console.error("FRIGGAFRIO_WORKTREE_GUARD_BLOCKED")
  console.error("")
  console.error("Failed to run: git rev-parse --show-toplevel")
  console.error(`Error: ${err.message}`)
  console.error("")
  console.error("NO COMMAND EXECUTED.")
  process.exit(1)
}

let currentBranch
try {
  currentBranch = git("branch", "--show-current")
} catch (err) {
  console.error("FRIGGAFRIO_WORKTREE_GUARD_BLOCKED")
  console.error("")
  console.error("Failed to run: git branch --show-current")
  console.error(`Error: ${err.message}`)
  console.error("")
  console.error("NO COMMAND EXECUTED.")
  process.exit(1)
}

// --- Normalize and compare ----------------------------------------------

const canonicalNorm = normalizePath(canonicalRaw)
const currentNorm = normalizePath(currentWorktreeRaw)
const worktreeMatch = currentNorm === canonicalNorm
const branchMatch = currentBranch === EXPECTED_BRANCH

if (worktreeMatch && branchMatch) {
  // --- PASS ---
  let commitShort = "unknown"
  try {
    commitShort = git("rev-parse", "--short", "HEAD")
  } catch {
    // non-fatal
  }

  console.log("FRIGGAFRIO_WORKTREE_GUARD")
  console.log(`WORKTREE: PASS`)
  console.log(`BRANCH: ${currentBranch}`)
  console.log(`COMMIT: ${commitShort}`)
  console.log(`PATH: ${currentWorktreeRaw}`)
  console.log("RESULT: SAFE_TO_PROCEED")
  process.exit(0)
}

// --- FAIL CLOSED --------------------------------------------------------

console.error("FRIGGAFRIO_WORKTREE_GUARD_BLOCKED")
console.error("")
console.error(`Expected worktree: ${canonicalRaw}`)
console.error(`Actual worktree:   ${currentWorktreeRaw}`)
console.error("")
console.error(`Expected branch:   ${EXPECTED_BRANCH}`)
console.error(`Actual branch:     ${currentBranch || "(detached HEAD)"}`)
console.error("")
if (!worktreeMatch) {
  console.error("MISMATCH: worktree path does not match canonical Maestro worktree.")
}
if (!branchMatch) {
  console.error("MISMATCH: current branch is not Maestro.")
}
console.error("")
console.error("NO COMMAND EXECUTED.")
process.exit(1)
