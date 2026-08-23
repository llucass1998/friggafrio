import { config } from "./admin-logout-redirect";

describe("Admin logout redirect widget", () => {
  it("uses Medusa's supported login extension point", () => {
    expect(config).toMatchObject({
      id: "friggafrio.admin-logout-redirect",
      zone: "login.before",
    });
  });
});
