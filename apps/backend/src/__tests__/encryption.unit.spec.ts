import { encrypt, decrypt, hashValue } from "../lib/encryption"

describe("Encryption", () => {
  beforeAll(() => {
    process.env.DATA_ENCRYPTION_KEY = "testkeytestkeytestkeytestkeytestkey"
  })

  it("should encrypt and decrypt correctly", () => {
    const text = "12345678900"
    const { encryptedData, iv, authTag } = encrypt(text)

    expect(encryptedData).not.toBe(text)

    const decrypted = decrypt(encryptedData, iv, authTag)
    expect(decrypted).toBe(text)
  })

  it("should hash a value deterministically", () => {
    const text = "12345678900"
    const hash1 = hashValue(text)
    const hash2 = hashValue(text)

    expect(hash1).toBe(hash2)
    expect(hash1).not.toBe(text)
  })
})
