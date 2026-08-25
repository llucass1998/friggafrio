import { posix } from "node:path"
import { MedusaError } from "@medusajs/framework/utils"

const MIME_TYPES: Record<string, string> = {
  avif: "image/avif",
  gif: "image/gif",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
  svg: "image/svg+xml",
  webp: "image/webp",
}

export function normalizePublicUploadKey(value: unknown): string {
  const key = decodeURIComponent(String(value || "")).replace(/\\/gu, "/")
  const normalized = posix.normalize(key).replace(/^\.\//u, "")

  if (
    !normalized ||
    normalized.startsWith("/") ||
    normalized === "." ||
    normalized.split("/").includes("..")
  ) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Invalid upload key")
  }

  return normalized
}

export function contentTypeForUploadKey(key: string): string {
  const extension = key.split(".").pop()?.toLowerCase() || ""
  return MIME_TYPES[extension] || "application/octet-stream"
}
