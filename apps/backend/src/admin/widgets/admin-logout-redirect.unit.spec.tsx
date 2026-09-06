import { config, shouldRedirectAfterAdminLogout } from "./admin-logout-redirect";

describe("Admin logout redirect widget", () => {
  it("uses Medusa's supported login extension point", () => {
    expect(config).toMatchObject({
      id: "friggafrio.admin-logout-redirect",
      zone: "login.before",
    });
  });

  it("does not redirect a direct login visit", () => {
    expect(shouldRedirectAfterAdminLogout("/app/login", false)).toBe(false)
    expect(shouldRedirectAfterAdminLogout("/app/login", false)).toBe(false)
  })

  it("redirects only after an explicit logout intent", () => {
    expect(shouldRedirectAfterAdminLogout("/app/login", true)).toBe(true)
    expect(shouldRedirectAfterAdminLogout("/app/products", true)).toBe(false)
  })
});
