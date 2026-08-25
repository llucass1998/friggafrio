import {
  contentTypeForUploadKey,
  normalizePublicUploadKey,
} from "./public-upload"

describe("public upload path handling", () => {
  it("normalizes a safe public image key", () => {
    expect(normalizePublicUploadKey("2026/photo.png")).toBe("2026/photo.png")
  })

  it("rejects traversal and absolute paths", () => {
    expect(() => normalizePublicUploadKey("../secret.png")).toThrow("Invalid upload key")
    expect(() => normalizePublicUploadKey("/secret.png")).toThrow("Invalid upload key")
    expect(() => normalizePublicUploadKey("folder/../../secret.png")).toThrow("Invalid upload key")
  })

  it("returns a safe content type", () => {
    expect(contentTypeForUploadKey("photo.webp")).toBe("image/webp")
    expect(contentTypeForUploadKey("unknown.bin")).toBe("application/octet-stream")
  })
})
