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

  it("allows production local storage only with persistent machine-owned settings", () => {
    expect(
      assertFileStorageConfigured({
        NODE_ENV: "production",
        FILE_STORAGE_PROVIDER: "local",
        FILE_LOCAL_UPLOAD_DIR: "/var/lib/friggafrio/uploads",
        FILE_LOCAL_PRIVATE_UPLOAD_DIR: "/var/lib/friggafrio/private-uploads",
        FILE_LOCAL_BACKEND_URL: "https://friggafrio.istigestao.com.br/static",
      }),
    ).toBe("local")
  })

  it("fails closed when production local storage is incomplete or release-scoped", () => {
    expect(() =>
      assertFileStorageConfigured({
        NODE_ENV: "production",
        FILE_STORAGE_PROVIDER: "local",
      }),
    ).toThrow("FILE_LOCAL_UPLOAD_DIR")
    expect(() =>
      assertFileStorageConfigured({
        NODE_ENV: "production",
        FILE_STORAGE_PROVIDER: "local",
        FILE_LOCAL_UPLOAD_DIR: "/var/lib/friggafrio/uploads",
        FILE_LOCAL_BACKEND_URL: "http://friggafrio.istigestao.com.br/static",
      }),
    ).toThrow("FILE_LOCAL_BACKEND_URL")
    expect(() =>
      assertFileStorageConfigured({
        NODE_ENV: "production",
        FILE_STORAGE_PROVIDER: "local",
        FILE_LOCAL_UPLOAD_DIR: "/home/workspace/releases/current/uploads",
        FILE_LOCAL_BACKEND_URL: "https://friggafrio.istigestao.com.br/static",
      }),
    ).toThrow("FILE_LOCAL_UPLOAD_DIR")
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

  it("prefers the deployed FILE_LOCAL names while retaining development aliases", () => {
    expect(
      getLocalFileStorageOptions({
        FILE_LOCAL_UPLOAD_DIR: "/var/lib/friggafrio/uploads",
        FILE_LOCAL_PRIVATE_UPLOAD_DIR: "/var/lib/friggafrio/private-uploads",
        FILE_LOCAL_BACKEND_URL: "https://friggafrio.istigestao.com.br/static",
        LOCAL_FILE_UPLOAD_DIR: "/tmp/legacy",
        LOCAL_FILE_UPLOAD_URL: "http://localhost:9000/legacy",
      }),
    ).toEqual({
      uploadDir: "/var/lib/friggafrio/uploads",
      privateUploadDir: "/var/lib/friggafrio/private-uploads",
      backendUrl: "https://friggafrio.istigestao.com.br/static",
    })
  })
})
