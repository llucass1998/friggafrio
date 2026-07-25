import crypto from "crypto"

const algorithm = "aes-256-gcm"
// It's important to use the env variable for decryption and encryption, otherwise fallback in memory will fail across instances
const encryptionKey = process.env.DATA_ENCRYPTION_KEY || crypto.randomBytes(32).toString("hex")

export function encrypt(text: string): { encryptedData: string; iv: string; authTag: string } {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(
    algorithm,
    Buffer.from(encryptionKey.padEnd(32, "0").slice(0, 32)),
    iv
  )

  let encrypted = cipher.update(text, "utf8", "hex")
  encrypted += cipher.final("hex")
  const authTag = cipher.getAuthTag().toString("hex")

  return {
    encryptedData: encrypted,
    iv: iv.toString("hex"),
    authTag: authTag,
  }
}

export function decrypt(encryptedData: string, iv: string, authTag: string): string {
  const decipher = crypto.createDecipheriv(
    algorithm,
    Buffer.from(encryptionKey.padEnd(32, "0").slice(0, 32)),
    Buffer.from(iv, "hex")
  )
  decipher.setAuthTag(Buffer.from(authTag, "hex"))

  let decrypted = decipher.update(encryptedData, "hex", "utf8")
  decrypted += decipher.final("utf8")
  return decrypted
}

export function hashValue(text: string): string {
  return crypto.createHash("sha256").update(text).digest("hex")
}
