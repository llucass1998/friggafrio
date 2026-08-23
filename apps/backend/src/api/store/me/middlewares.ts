import { MiddlewareRoute, authenticate } from "@medusajs/framework/http";

export const meMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/store/auth/session",
    method: "GET",
    middlewares: [authenticate("*", ["session"])],
  },
  {
    matcher: "/store/auth/status",
    method: "GET",
    middlewares: [authenticate("*", ["session"], { allowUnauthenticated: true })],
  },
  {
    matcher: "/store/me",
    method: "GET",
    middlewares: [authenticate("customer", ["session"])],
  },
  {
    matcher: "/store/customers/me/orders*",
    middlewares: [authenticate("customer", ["session"])],
  },
];
