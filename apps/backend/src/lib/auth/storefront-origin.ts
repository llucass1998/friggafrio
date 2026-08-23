import { getTrustedStoreOrigins } from "./session-security";

const supportedProtocols = new Set(["http:", "https:"]);

/** Restricts Admin-provided navigation to an existing Store API origin. */
export const getConfiguredStorefrontOrigin = (
  value = process.env.STOREFRONT_URL,
): string | null => {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  try {
    const url = new URL(value.trim());
    if (!supportedProtocols.has(url.protocol) || url.username || url.password) {
      return null;
    }

    return getTrustedStoreOrigins().has(url.origin) ? url.origin : null;
  } catch {
    return null;
  }
};
