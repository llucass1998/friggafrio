const supportedProtocols = new Set(["http:", "https:"]);
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

/** Builds the fixed public landing page after the backend has ended a session. */
export const getStorefrontHomeUrl = (value: unknown, currentHostname?: string): string | null => {
  const hostname = currentHostname ?? (typeof window !== "undefined" ? window.location.hostname : undefined);
  if (hostname && LOCAL_HOSTS.has(hostname.toLowerCase().replace(/^\[|\]$/g, ""))) {
    return `http://${hostname}:5173/br`;
  }

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
