import { resolve as resolvePath } from "node:path"

import {
  assertFileStorageConfigured,
  getLocalFileStorageOptions,
  getFileStorageProvider,
} from "./file-storage-config"

describe("file storage configuration", () => {
  it("defaults development and test to the official local provider", () => {
    expect(getFileStorageProvider({ NODE_ENV: "development" })).toBe("local")
    expect(getFileStorageProvider({ NODE_ENV: "test" })).toBe("local")
  })

  it("fails closed outside development when local storage is selected", () => {
    expect(() => assertFileStorageConfigured({ NODE_ENV: "production", FILE_STORAGE_PROVIDER: "local" }))
      .toThrow("development/test")
  })

  it("fails closed when S3/R2 is selected without a public file URL", () => {
    expect(() => assertFileStorageConfigured({ NODE_ENV: "production" }))
      .toThrow("R2_FILE_URL/S3_FILE_URL")
  })

  it("accepts configured S3/R2 storage in production", () => {
    expect(assertFileStorageConfigured({ NODE_ENV: "production", R2_FILE_URL: "https://cdn.example.test" }))
      .toBe("s3")
  })

  it("aligns the local provider directory with the backend static mount", () => {
    expect(getLocalFileStorageOptions({ NODE_ENV: "development" }, "C:/workspace/apps/backend"))
      .toEqual({
        uploadDir: resolvePath("C:/workspace/apps/backend", "static"),
        privateUploadDir: resolvePath("C:/workspace/apps/backend", "static"),
        backendUrl: "http://localhost:9000/static",
      })
  })
})
