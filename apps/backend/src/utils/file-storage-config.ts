import { resolve as resolvePath } from "node:path"

export type FileStorageProvider = "local" | "s3"

export type LocalFileStorageOptions = {
  uploadDir: string
  privateUploadDir: string
  backendUrl: string
}

type FileStorageEnvironment = NodeJS.ProcessEnv & {
  NODE_ENV?: string
  FILE_STORAGE_PROVIDER?: string
  R2_FILE_URL?: string
  S3_FILE_URL?: string
}

const isDevelopmentLike = (nodeEnv: string | undefined): boolean =>
  nodeEnv === undefined || nodeEnv === "development" || nodeEnv === "test"

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
    throw new Error("Local file storage is allowed only in development/test.")
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
  const uploadDir = env.LOCAL_FILE_UPLOAD_DIR?.trim()
  const backendUrl = env.LOCAL_FILE_UPLOAD_URL?.trim()

  return {
    // file-local returns keys relative to this directory. It must match the
    // backend's /static mount or successful uploads become unreachable.
    uploadDir: uploadDir || resolvePath(backendBaseDir, "static"),
    privateUploadDir: uploadDir || resolvePath(backendBaseDir, "static"),
    backendUrl: backendUrl || "http://localhost:9000/static",
  }
}
