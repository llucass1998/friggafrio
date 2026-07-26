import crypto from "crypto";
import { MedusaError } from "@medusajs/framework/utils";

const algorithm = "aes-256-gcm";

const getEncryptionKey = (): Buffer => {
  const configuredKey = process.env.DATA_ENCRYPTION_KEY?.trim();

  if (!configuredKey) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "DATA_ENCRYPTION_KEY is required",
    );
  }

  if (/^[a-f\d]{64}$/i.test(configuredKey)) {
    return Buffer.from(configuredKey, "hex");
  }

  const decodedKey = Buffer.from(configuredKey, "base64");
  if (decodedKey.length === 32) {
    return decodedKey;
  }

  throw new MedusaError(
    MedusaError.Types.INVALID_DATA,
    "DATA_ENCRYPTION_KEY must be 32 bytes encoded as 64 hexadecimal characters or Base64",
  );
};

export function encrypt(text: string): {
  encryptedData: string;
  iv: string;
  authTag: string;
} {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, getEncryptionKey(), iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  return {
    encryptedData: encrypted,
    iv: iv.toString("hex"),
    authTag: authTag,
  };
}

export function decrypt(
  encryptedData: string,
  iv: string,
  authTag: string,
): string {
  const decipher = crypto.createDecipheriv(
    algorithm,
    getEncryptionKey(),
    Buffer.from(iv, "hex"),
  );
  decipher.setAuthTag(Buffer.from(authTag, "hex"));

  let decrypted = decipher.update(encryptedData, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

export function hashValue(text: string): string {
  return crypto
    .createHmac("sha256", getEncryptionKey())
    .update(text)
    .digest("hex");
}
