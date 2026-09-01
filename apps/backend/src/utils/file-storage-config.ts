import { isAbsolute, resolve as resolvePath } from "node:path"
import { tmpdir } from "node:os"

export type FileStorageProvider = "local" | "s3"

export type LocalFileStorageOptions = {
  uploadDir: string
  privateUploadDir: string
  backendUrl: string
}

type FileStorageEnvironment = NodeJS.ProcessEnv & {
  NODE_ENV?: string
  FILE_STORAGE_PROVIDER?: string
  FILE_LOCAL_UPLOAD_DIR?: string
  FILE_LOCAL_PRIVATE_UPLOAD_DIR?: string
  FILE_LOCAL_BACKEND_URL?: string
  // Backwards-compatible development aliases retained for existing .env files.
  LOCAL_FILE_UPLOAD_DIR?: string
  LOCAL_FILE_PRIVATE_UPLOAD_DIR?: string
  LOCAL_FILE_UPLOAD_URL?: string
  R2_FILE_URL?: string
  S3_FILE_URL?: string
}

const isDevelopmentLike = (nodeEnv: string | undefined): boolean =>
  nodeEnv === undefined || nodeEnv === "development" || nodeEnv === "test"

const firstConfigured = (...values: Array<string | undefined>): string | undefined =>
  values.map((value) => value?.trim()).find((value) => Boolean(value))

const normalizedPath = (value: string): string =>
  resolvePath(value).replaceAll("\\", "/").replace(/\/+$/, "").toLowerCase()

const isWithin = (candidate: string, root: string): boolean =>
  candidate === root || candidate.startsWith(`${root}/`)

const isPersistentLocalPath = (value: string, backendBaseDir: string): boolean => {
  if (!isAbsolute(value)) return false

  const candidate = normalizedPath(value)
  const backendRoot = normalizedPath(backendBaseDir)
  const temporaryRoots = [tmpdir(), "/tmp", "/var/tmp"].map(normalizedPath)
  if (temporaryRoots.some((root) => isWithin(candidate, root))) return false
  if (isWithin(candidate, backendRoot)) return false
  if (/(^|\/)\.(?:medusa|git)(?:\/|$)/.test(candidate)) return false
  if (/(^|\/)(?:node_modules|releases|maestro-deploy)(?:\/|$)/.test(candidate)) return false
  return true
}

const isPublicBackendUrl = (value: string, nodeEnv: string | undefined): boolean => {
  try {
    const parsed = new URL(value)
    if (isDevelopmentLike(nodeEnv)) {
      return parsed.protocol === "https:" ||
        (parsed.protocol === "http:" &&
          (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1"))
    }
    return parsed.protocol === "https:" &&
      parsed.hostname !== "localhost" &&
      parsed.hostname !== "127.0.0.1"
  } catch {
    return false
  }
}

export const getFileStorageProvider = (
  env: FileStorageEnvironment = process.env,
): FileStorageProvider => {
  const configured = env.FILE_STORAGE_PROVIDER?.trim().toLowerCase()
  if (configured === "local" || configured === "s3") return configured
  return isDevelopmentLike(env.NODE_ENV) ? "local" : "s3"
}

export const assertFileStorageConfigured = (
  env: FileStorageEnvironment = process.env,
): FileStorageProvider => {
  const provider = getFileStorageProvider(env)
  if (provider === "local" && !isDevelopmentLike(env.NODE_ENV)) {
    const uploadDir = firstConfigured(env.FILE_LOCAL_UPLOAD_DIR, env.LOCAL_FILE_UPLOAD_DIR)
    const privateUploadDir = firstConfigured(
      env.FILE_LOCAL_PRIVATE_UPLOAD_DIR,
      env.LOCAL_FILE_PRIVATE_UPLOAD_DIR,
      uploadDir,
    )
    const backendUrl = firstConfigured(env.FILE_LOCAL_BACKEND_URL, env.LOCAL_FILE_UPLOAD_URL)
    const backendBaseDir = process.cwd()

    if (!uploadDir || !isPersistentLocalPath(uploadDir, backendBaseDir)) {
      throw new Error(
        "File storage is not configured: FILE_LOCAL_UPLOAD_DIR must be an absolute persistent directory outside the release.",
      )
    }
    if (!privateUploadDir || !isPersistentLocalPath(privateUploadDir, backendBaseDir)) {
      throw new Error(
        "File storage is not configured: FILE_LOCAL_PRIVATE_UPLOAD_DIR must be an absolute persistent directory outside the release.",
      )
    }
    if (!backendUrl || !isPublicBackendUrl(backendUrl, env.NODE_ENV)) {
      throw new Error(
        "File storage is not configured: FILE_LOCAL_BACKEND_URL must be a valid public HTTP(S) URL.",
      )
    }
  }
  if (provider === "s3" && !env.R2_FILE_URL && !env.S3_FILE_URL) {
    throw new Error(
      "File storage is not configured: set R2_FILE_URL/S3_FILE_URL or use FILE_STORAGE_PROVIDER=local only in development/test.",
    )
  }
  return provider
}

export const getLocalFileStorageOptions = (
  env: FileStorageEnvironment = process.env,
  backendBaseDir = process.cwd(),
): LocalFileStorageOptions => {
  const uploadDir = firstConfigured(env.FILE_LOCAL_UPLOAD_DIR, env.LOCAL_FILE_UPLOAD_DIR)
  const privateUploadDir = firstConfigured(
    env.FILE_LOCAL_PRIVATE_UPLOAD_DIR,
    env.LOCAL_FILE_PRIVATE_UPLOAD_DIR,
    uploadDir,
  )
  const backendUrl = firstConfigured(env.FILE_LOCAL_BACKEND_URL, env.LOCAL_FILE_UPLOAD_URL)

  return {
    // file-local returns keys relative to this directory. It must match the
    // backend's /static mount or successful uploads become unreachable.
    uploadDir: uploadDir || resolvePath(backendBaseDir, "static"),
    privateUploadDir: privateUploadDir || resolvePath(backendBaseDir, "static"),
    backendUrl: backendUrl || "http://localhost:9000/static",
  }
}
