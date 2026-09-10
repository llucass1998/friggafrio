import { getStorefrontHomeUrl } from "./storefront-home";

describe("Admin Storefront home redirect", () => {
  it("uses the configured origin and a fixed public path", () => {
    expect(getStorefrontHomeUrl("https://store.example/other?unsafe=1#hash")).toBe(
      "https://store.example/br",
    );
  });

  it("redirects to local port 5173 when on local development hostnames", () => {
    expect(getStorefrontHomeUrl("https://store.example", "localhost")).toBe(
      "http://localhost:5173/br",
    );
    expect(getStorefrontHomeUrl("https://store.example", "127.0.0.1")).toBe(
      "http://127.0.0.1:5173/br",
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
