import { getConfiguredStorefrontOrigin } from "./storefront-origin";

const originalStoreCors = process.env.STORE_CORS;

describe("configured Storefront origin", () => {
  beforeEach(() => {
    process.env.STORE_CORS = "https://store.example,http://localhost:5173";
  });

  afterAll(() => {
    if (originalStoreCors === undefined) {
      delete process.env.STORE_CORS;
      return;
    }

    process.env.STORE_CORS = originalStoreCors;
  });

  it("accepts an explicitly trusted HTTP(S) origin", () => {
    expect(getConfiguredStorefrontOrigin("https://store.example/br")).toBe(
      "https://store.example",
    );
  });

  it.each([
    "https://attacker.example",
    "https://user:password@store.example",
    "javascript:alert(1)",
    "//store.example",
  ])("rejects an untrusted or malformed redirect origin", (value) => {
    expect(getConfiguredStorefrontOrigin(value)).toBeNull();
  });
});
