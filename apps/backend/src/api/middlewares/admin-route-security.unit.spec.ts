import { ADMIN_API_AUTH_METHODS, isAdminApiPath } from "./admin-route-security";

describe("Admin API route security", () => {
  it("requires user authentication for API methods but leaves OPTIONS to CORS", () => {
    expect(ADMIN_API_AUTH_METHODS).toContain("GET");
    expect(ADMIN_API_AUTH_METHODS).toContain("HEAD");
    expect(ADMIN_API_AUTH_METHODS).toContain("DELETE");
    expect(ADMIN_API_AUTH_METHODS).not.toContain("OPTIONS");
  });

  it("matches only the Admin API namespace", () => {
    expect(isAdminApiPath("/admin/users")).toBe(true);
    expect(isAdminApiPath("/store/customers/me")).toBe(false);
  });
});
