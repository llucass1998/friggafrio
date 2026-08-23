import { getStorefrontHomeUrl } from "./storefront-home";

describe("Admin Storefront home redirect", () => {
  it("uses the configured origin and a fixed public path", () => {
    expect(getStorefrontHomeUrl("https://store.example/other?unsafe=1#hash")).toBe(
      "https://store.example/br",
    );
  });

  it.each([
    "javascript:alert(1)",
    "//store.example",
    "https://user:password@store.example",
  ])("rejects unsafe origins", (value) => {
    expect(getStorefrontHomeUrl(value)).toBeNull();
  });
});
