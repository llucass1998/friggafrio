import type { MiddlewareVerb } from "@medusajs/framework/http";

export const ADMIN_API_MATCHER = /^\/admin(?:\/|$)/;

// Preflight must reach CORS before authentication; browsers never attach the
// Admin session to OPTIONS requests.
export const ADMIN_API_AUTH_METHODS: MiddlewareVerb[] = [
  "GET",
  "HEAD",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
];

export const isAdminApiPath = (path: string): boolean => ADMIN_API_MATCHER.test(path);
