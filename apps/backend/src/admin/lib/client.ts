import Medusa from "@medusajs/js-sdk";

declare const __BACKEND_URL__: string | undefined;

export const sdk = new Medusa({
  baseUrl: typeof __BACKEND_URL__ !== "undefined" ? __BACKEND_URL__ : "/",
  debug: false,
  auth: {
    type: "session",
    fetchCredentials: "include",
    jwtTokenStorageMethod: "memory",
  },
});
