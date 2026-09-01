import assert from "node:assert/strict"
import { execFileSync, spawnSync } from "node:child_process"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import test from "node:test"

const scanner = resolve("scripts/security/check-secrets.mjs")
const fakeJwt = [
  "eyJmYWtlIjoidGVzdCJ9",
  "eyJub3RfcmVhbCI6dHJ1ZX0",
  "not_a_real_signature",
].join(".")

const git = (cwd, args) => execFileSync("git", args, { cwd, stdio: "pipe" })
const createRepo = () => {
  const root = mkdtempSync(join(tmpdir(), "friggafrio-secret-scan-"))
  git(root, ["init"])
  git(root, ["config", "user.email", "security-test@example.invalid"])
  git(root, ["config", "user.name", "Security Test"])
  writeFileSync(join(root, ".gitignore"), "apps/backend/.env\n")
  writeFileSync(join(root, "safe.txt"), "safe content\n")
  git(root, ["add", ".gitignore", "safe.txt"])
  git(root, ["commit", "-m", "initial"])
  return root
}
const scan = (cwd) => spawnSync(process.execPath, [scanner], { cwd, encoding: "utf8" })
const cleanup = (root) => rmSync(root, { recursive: true, force: true })

test("passes in a clean clone without the retired baseline object", () => {
  const source = createRepo()
  const clone = mkdtempSync(join(tmpdir(), "friggafrio-secret-clean-clone-"))
  try {
    git(source, ["clone", "--no-local", source, clone])
    const baseline = spawnSync("git", ["cat-file", "-e", "e576de2:apps/storefront/token.txt"], { cwd: clone })
    assert.notEqual(baseline.status, 0)
    const result = scan(clone)
    assert.equal(result.status, 0)
    assert.match(result.stdout, /Reusable secret scan: PASS/)
  } finally {
    cleanup(source)
    cleanup(clone)
  }
})

test("passes in a shallow clone", () => {
  const source = createRepo()
  const clone = mkdtempSync(join(tmpdir(), "friggafrio-secret-shallow-clone-"))
  try {
    const fileUrl = `file:///${source.replace(/\\/g, "/")}`
    execFileSync("git", ["clone", "--depth", "1", fileUrl, clone], { stdio: "pipe" })
    const result = scan(clone)
    assert.equal(result.status, 0)
    assert.match(result.stdout, /Reusable secret scan: PASS/)
  } finally {
    cleanup(source)
    cleanup(clone)
  }
})

test("fails for tracked, staged, and untracked simulated secrets", () => {
  const root = createRepo()
  try {
    writeFileSync(join(root, "tracked.txt"), fakeJwt)
    git(root, ["add", "tracked.txt"])
    git(root, ["commit", "-m", "tracked fixture"])
    let result = scan(root)
    assert.equal(result.status, 1)
    assert.match(result.stdout, /scope=tracked/)

    writeFileSync(join(root, "staged.txt"), fakeJwt)
    git(root, ["add", "staged.txt"])
    result = scan(root)
    assert.equal(result.status, 1)
    assert.match(result.stdout, /scope=staged/)

    writeFileSync(join(root, "untracked.txt"), fakeJwt)
    result = scan(root)
    assert.equal(result.status, 1)
    assert.match(result.stdout, /scope=untracked/)
  } finally {
    cleanup(root)
  }
})

test("fails for a simulated secret retained in reachable history", () => {
  const root = createRepo()
  try {
    writeFileSync(join(root, "history.txt"), fakeJwt)
    git(root, ["add", "history.txt"])
    git(root, ["commit", "-m", "history fixture"])
    writeFileSync(join(root, "history.txt"), "removed from current tree\n")
    git(root, ["add", "history.txt"])
    git(root, ["commit", "-m", "remove fixture"])
    const result = scan(root)
    assert.equal(result.status, 1)
    assert.match(result.stdout, /scope=reachable-history/)
  } finally {
    cleanup(root)
  }
})

test("sanitizes findings and reports infrastructure failures distinctly", () => {
  const root = createRepo()
  const nonRepository = mkdtempSync(join(tmpdir(), "friggafrio-secret-nonrepo-"))
  try {
    writeFileSync(join(root, "secret.txt"), fakeJwt)
    const finding = scan(root)
    assert.equal(finding.status, 1)
    assert.doesNotMatch(`${finding.stdout}${finding.stderr}`, new RegExp(fakeJwt.replace(/[.]/g, "\\.")))
    assert.match(finding.stdout, /category=JWT-like token path=secret.txt/)

    const unavailable = scan(nonRepository)
    assert.equal(unavailable.status, 2)
    assert.match(unavailable.stderr, /SCANNER_INFRASTRUCTURE_FAILURE scope=git/)
  } finally {
    cleanup(root)
    cleanup(nonRepository)
  }
})
