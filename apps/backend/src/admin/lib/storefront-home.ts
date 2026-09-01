const supportedProtocols = new Set(["http:", "https:"]);

/** Builds the fixed public landing page after the backend has ended a session. */
export const getStorefrontHomeUrl = (value: unknown): string | null => {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  try {
    const url = new URL(value.trim());
    if (!supportedProtocols.has(url.protocol) || url.username || url.password) {
      return null;
    }

    url.pathname = "/br";
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
};
