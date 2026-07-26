import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const DEFAULT_SESSION_COOKIE_NAME = "frigga.sid";

export type SessionOriginValidationInput = {
  method: string;
  cookieHeader?: string;
  originHeader?: string;
  refererHeader?: string;
  secFetchSiteHeader?: string;
};

export type SessionOriginValidationResult =
  | { allowed: true }
  | {
      allowed: false;
      reason: "cross-site" | "missing-origin" | "untrusted-origin";
    };

const normalizeOrigin = (value: string): string | null => {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
};

export const getSessionCookieName = (): string =>
  process.env.SESSION_COOKIE_NAME?.trim() || DEFAULT_SESSION_COOKIE_NAME;

export const getTrustedAuthOrigins = (): ReadonlySet<string> => {
  const configuredOrigins = [
    process.env.STORE_CORS,
    process.env.ADMIN_CORS,
    process.env.AUTH_CORS,
  ]
    .flatMap((value) => value?.split(",") ?? [])
    .map((value) => value.trim())
    .filter((value) => value.length > 0)
    .map(normalizeOrigin)
    .filter((value): value is string => value !== null);

  return new Set(configuredOrigins);
};

const hasSessionCookie = (
  cookieHeader: string | undefined,
  sessionCookieName: string,
): boolean => {
  if (!cookieHeader) {
    return false;
  }

  return cookieHeader.split(";").some((cookie) => {
    const separatorIndex = cookie.indexOf("=");
    if (separatorIndex === -1) {
      return false;
    }

    return cookie.slice(0, separatorIndex).trim() === sessionCookieName;
  });
};

const requestOrigin = (
  originHeader?: string,
  refererHeader?: string,
): string | null => {
  if (originHeader) {
    return normalizeOrigin(originHeader);
  }

  return refererHeader ? normalizeOrigin(refererHeader) : null;
};

export const validateSessionRequestOrigin = (
  input: SessionOriginValidationInput,
  trustedOrigins: ReadonlySet<string>,
  sessionCookieName = DEFAULT_SESSION_COOKIE_NAME,
  requireOriginWithoutSession = false,
): SessionOriginValidationResult => {
  if (SAFE_METHODS.has(input.method.toUpperCase())) {
    return { allowed: true };
  }

  if (
    !requireOriginWithoutSession &&
    !hasSessionCookie(input.cookieHeader, sessionCookieName)
  ) {
    return { allowed: true };
  }

  if (input.secFetchSiteHeader?.toLowerCase() === "cross-site") {
    return { allowed: false, reason: "cross-site" };
  }

  const origin = requestOrigin(input.originHeader, input.refererHeader);
  if (!origin) {
    return { allowed: false, reason: "missing-origin" };
  }

  if (!trustedOrigins.has(origin)) {
    return { allowed: false, reason: "untrusted-origin" };
  }

  return { allowed: true };
};

const validateRequest = (
  req: MedusaRequest,
  requireOriginWithoutSession: boolean,
): SessionOriginValidationResult =>
  validateSessionRequestOrigin(
    {
      method: req.method,
      cookieHeader: req.headers.cookie,
      originHeader:
        typeof req.headers.origin === "string" ? req.headers.origin : undefined,
      refererHeader:
        typeof req.headers.referer === "string"
          ? req.headers.referer
          : undefined,
      secFetchSiteHeader:
        typeof req.headers["sec-fetch-site"] === "string"
          ? req.headers["sec-fetch-site"]
          : undefined,
    },
    getTrustedAuthOrigins(),
    getSessionCookieName(),
    requireOriginWithoutSession,
  );

const rejectUntrustedRequest = (
  res: MedusaResponse,
  result: Exclude<SessionOriginValidationResult, { allowed: true }>,
): void => {
  res.status(403).json({
    code: "AUTH_ORIGIN_REJECTED",
    message: "A origem da requisição não é permitida.",
    reason: result.reason,
  });
};

export const protectSessionMutation = (
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction,
): void => {
  const result = validateRequest(req, false);
  if (!result.allowed) {
    rejectUntrustedRequest(res, result);
    return;
  }

  next();
};

export const requireTrustedAuthOrigin = (
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction,
): void => {
  const result = validateRequest(req, true);
  if (!result.allowed) {
    rejectUntrustedRequest(res, result);
    return;
  }

  next();
};
