import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { readFile } from "node:fs/promises"
import { isAbsolute, relative, resolve } from "node:path"
import {
  contentTypeForUploadKey,
  normalizePublicUploadKey,
} from "../public-upload"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  let fileKey: string
  try {
    fileKey = normalizePublicUploadKey(req.params.file_key)
  } catch {
    res.status(400).json({ type: "invalid_data", message: "Invalid upload key" })
    return
  }

  try {
    if ((process.env.FILE_STORAGE_PROVIDER || "local").toLowerCase() !== "local") {
      res.status(404).json({ type: "not_found", message: "Upload route is not enabled for this provider" })
      return
    }

    const uploadDir = process.env.FILE_LOCAL_UPLOAD_DIR
    if (!uploadDir) {
      res.status(404).json({ type: "not_found", message: "Upload storage is not configured" })
      return
    }

    const baseDir = resolve(uploadDir)
    const filePath = resolve(baseDir, fileKey)
    const relativePath = relative(baseDir, filePath)
    if (!relativePath || relativePath.startsWith("..") || isAbsolute(relativePath)) {
      res.status(400).json({ type: "invalid_data", message: "Invalid upload key" })
      return
    }

    const contents = await readFile(filePath)
    res.setHeader("Content-Type", contentTypeForUploadKey(fileKey))
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable")
    res.status(200).send(contents)
  } catch {
    res.status(404).json({ type: "not_found", message: "Upload not found" })
  }
}
