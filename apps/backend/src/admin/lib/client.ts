import Medusa from "@medusajs/js-sdk";

declare const __BACKEND_URL__: string | undefined;

// Use process.env as fallback if import.meta is not available during standard compilation
const getAuthType = () => {
  try {
    // @ts-ignore - handled dynamically to avoid TS1470 in CJS mode
    return (import.meta.env?.VITE_ADMIN_AUTH_TYPE) as "jwt" | "session";
  } catch (e) {
    return "jwt";
  }
};

export const sdk = new Medusa({
  baseUrl: typeof __BACKEND_URL__ !== "undefined" ? __BACKEND_URL__ : "/",
  debug: true,
  auth: {
    type: getAuthType() || "jwt",
  },
});