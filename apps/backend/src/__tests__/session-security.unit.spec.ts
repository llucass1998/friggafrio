import { validateSessionRequestOrigin } from "../lib/auth/session-security";

const trustedOrigins = new Set([
  "https://www.friggafrio.com.br",
  "https://admin.friggafrio.com.br",
]);

describe("session request origin validation", () => {
  it("allows safe methods", () => {
    expect(
      validateSessionRequestOrigin(
        {
          method: "GET",
          cookieHeader: "frigga.sid=session-id",
        },
        trustedOrigins,
        "frigga.sid",
      ),
    ).toEqual({ allowed: true });
  });

  it("allows public mutations without a session cookie", () => {
    expect(
      validateSessionRequestOrigin(
        {
          method: "POST",
          originHeader: "https://attacker.example",
        },
        trustedOrigins,
        "frigga.sid",
      ),
    ).toEqual({ allowed: true });
  });

  it("allows a session mutation from a trusted origin", () => {
    expect(
      validateSessionRequestOrigin(
        {
          method: "POST",
          cookieHeader: "other=value; frigga.sid=session-id",
          originHeader: "https://www.friggafrio.com.br/path",
          secFetchSiteHeader: "same-site",
        },
        trustedOrigins,
        "frigga.sid",
      ),
    ).toEqual({ allowed: true });
  });

  it("rejects a cross-site session mutation", () => {
    expect(
      validateSessionRequestOrigin(
        {
          method: "DELETE",
          cookieHeader: "frigga.sid=session-id",
          originHeader: "https://www.friggafrio.com.br",
          secFetchSiteHeader: "cross-site",
        },
        trustedOrigins,
        "frigga.sid",
      ),
    ).toEqual({ allowed: false, reason: "cross-site" });
  });

  it("rejects a session mutation without an origin", () => {
    expect(
      validateSessionRequestOrigin(
        {
          method: "PATCH",
          cookieHeader: "frigga.sid=session-id",
        },
        trustedOrigins,
        "frigga.sid",
      ),
    ).toEqual({ allowed: false, reason: "missing-origin" });
  });

  it("rejects an auth bootstrap from an untrusted origin", () => {
    expect(
      validateSessionRequestOrigin(
        {
          method: "POST",
          originHeader: "https://attacker.example",
        },
        trustedOrigins,
        "frigga.sid",
        true,
      ),
    ).toEqual({ allowed: false, reason: "untrusted-origin" });
  });
});
