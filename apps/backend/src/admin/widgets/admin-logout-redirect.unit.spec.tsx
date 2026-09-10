import {
  config,
  shouldRedirectAfterAdminLogout,
  markLogoutIntent,
  clearLogoutIntent,
  hasLogoutIntent,
} from "./admin-logout-redirect";

describe("Admin logout redirect widget", () => {
  afterEach(() => {
    clearLogoutIntent();
  });

  it("uses Medusa's supported login extension point and active admin zones", () => {
    expect(config.id).toBe("friggafrio.admin-logout-redirect");
    const zones = Array.isArray(config.zone) ? config.zone : [config.zone];
    expect(zones).toContain("login.before");
  });

  it("does not redirect a direct login visit", () => {
    expect(shouldRedirectAfterAdminLogout("/app/login", false)).toBe(false);
  });

  it("redirects only after an explicit logout intent", () => {
    expect(shouldRedirectAfterAdminLogout("/app/login", true)).toBe(true);
    expect(shouldRedirectAfterAdminLogout("/app/products", true)).toBe(false);
  });

  it("detects logout intent when marked", () => {
    expect(hasLogoutIntent()).toBe(false);
    markLogoutIntent();
    expect(hasLogoutIntent()).toBe(true);
    clearLogoutIntent();
    expect(hasLogoutIntent()).toBe(false);
  });
});
