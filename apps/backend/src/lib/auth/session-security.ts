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

const configuredOrigins = (
  values: Array<string | undefined>,
): ReadonlySet<string> => {
  const origins = values
    .flatMap((value) => value?.split(",") ?? [])
    .map((value) => value.trim())
    .filter((value) => value.length > 0)
    .map(normalizeOrigin)
    .filter((value): value is string => value !== null);

  return new Set(origins);
};

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

const LOCAL_STORE_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://[::1]:5173",
];

const LOCAL_AUTH_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://[::1]:5173",
  "http://localhost:9000",
  "http://127.0.0.1:9000",
  "http://[::1]:9000",
];

const getHostname = (value: string | undefined): string | null => {
  if (!value) return null;

  try {
    return new URL(value.includes("://") ? value : `http://${value}`).hostname.replace(/^\[|\]$/g, "");
  } catch {
    return null;
  }
};

export const isLocalDevelopmentRequest = (req?: MedusaRequest): boolean => {
  if (!req) return false;
  const host = getHostname(
    typeof req.headers?.host === "string" ? req.headers.host : undefined,
  );
  const forwardedHost = getHostname(
    typeof req.headers?.["x-forwarded-host"] === "string"
      ? req.headers["x-forwarded-host"]
      : undefined,
  );

  if (!host || !LOCAL_HOSTS.has(host)) {
    return false;
  }

  if (forwardedHost && !LOCAL_HOSTS.has(forwardedHost)) {
    return false;
  }

  return true;
};

// Customer store mutations must never trust the Admin application origin.
export const getTrustedStoreOrigins = (
  req?: MedusaRequest,
): ReadonlySet<string> =>
  configuredOrigins([
    process.env.STORE_CORS,
    ...(isLocalDevelopmentRequest(req) ? LOCAL_STORE_ORIGINS : []),
  ]);

// Medusa's generic /auth session endpoints are shared by customer and Admin.
export const getTrustedAuthOrigins = (
  req?: MedusaRequest,
): ReadonlySet<string> =>
  configuredOrigins([
    process.env.STORE_CORS,
    process.env.ADMIN_CORS,
    process.env.AUTH_CORS,
    ...(isLocalDevelopmentRequest(req) ? LOCAL_AUTH_ORIGINS : []),
  ]);

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
  isLocalDevelopment = false,
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

  if (!isLocalDevelopment && input.secFetchSiteHeader?.toLowerCase() === "cross-site") {
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
  trustedOrigins: ReadonlySet<string>,
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
    trustedOrigins,
    getSessionCookieName(),
    requireOriginWithoutSession,
    isLocalDevelopmentRequest(req),
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
  const result = validateRequest(req, false, getTrustedStoreOrigins(req));
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
  const result = validateRequest(req, true, getTrustedAuthOrigins(req));
  if (!result.allowed) {
    rejectUntrustedRequest(res, result);
    return;
  }

  next();
};

export const requireTrustedCustomerOrigin = (
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction,
): void => {
  const result = validateRequest(req, true, getTrustedStoreOrigins(req));
  if (!result.allowed) {
    rejectUntrustedRequest(res, result);
    return;
  }

  next();
};
