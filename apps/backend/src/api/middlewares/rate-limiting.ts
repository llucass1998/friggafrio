import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { createHash } from "node:crypto";
import Redis from "ioredis";
import type { NextFunction, Request, Response } from "express";

/**
 * Helmet adds secure HTTP headers.
 * We disable some strict rules in dev/local environments to allow Admin/Dashboard to work properly without strict CSP blocking assets.
 */
export const secureHeaders = helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: false,
});

/**
 * Rate limiter para Login e Token Refresh
 * Máximo de 15 requisições por 15 minutos.
 */
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: {
    message: "Muitas tentativas de login. Tente novamente após 15 minutos.",
    type: "rate_limit_exceeded"
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter estrito para Criação de Contas e Convites
 * Máximo de 5 requisições por 15 minutos.
 */
export const registerRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    message: "Limite de criação de contas atingido. Tente novamente mais tarde.",
    type: "rate_limit_exceeded"
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const NEWSLETTER_RATE_WINDOW_MS = 15 * 60 * 1000;
const NEWSLETTER_RATE_MAX = 10;
let newsletterRedis: Redis | undefined;

const opaqueIdentifier = (value: string): string =>
  createHash("sha256").update(value, "utf8").digest("hex");

const newsletterRedisClient = (): Redis | null => {
  const url = process.env.REDIS_URL?.trim();
  if (!url) return null;
  if (!newsletterRedis) {
    newsletterRedis = new Redis(url, {
      lazyConnect: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      connectTimeout: 750,
    });
  }
  return newsletterRedis;
};

const incrementNewsletterWindow = async (client: Redis, key: string): Promise<number> => {
  const value = await client.eval(
    "local count=redis.call('INCR',KEYS[1]); if count==1 then redis.call('PEXPIRE',KEYS[1],ARGV[1]) end; return count",
    1,
    key,
    String(NEWSLETTER_RATE_WINDOW_MS),
  );
  return Number(value);
};

/**
 * Subscriber creation is distributed-rate-limited through the configured
 * Redis instance. Requests fail closed if that security dependency is absent
 * or unavailable; neither e-mail addresses nor IP addresses are stored as
 * Redis key material.
 */
export const newsletterRateLimit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const client = newsletterRedisClient();
  if (!client) {
    res.status(503).json({ message: "Newsletter temporarily unavailable", type: "rate_limit_unavailable" });
    return;
  }

  try {
    if (client.status === "wait") await client.connect();
    const requestBody = req.body as { email?: unknown } | undefined;
    const email = typeof requestBody?.email === "string" ? requestBody.email.trim().toLowerCase() : "";
    const identity = `${req.ip || "unknown"}:${email || "no-email"}`;
    const [ipCount, emailCount] = await Promise.all([
      incrementNewsletterWindow(client, `newsletter:subscribe:ip:${opaqueIdentifier(req.ip || "unknown")}`),
      incrementNewsletterWindow(client, `newsletter:subscribe:identity:${opaqueIdentifier(identity)}`),
    ]);

    res.setHeader("RateLimit-Limit", String(NEWSLETTER_RATE_MAX));
    if (Math.max(ipCount, emailCount) > NEWSLETTER_RATE_MAX) {
      res.status(429).json({
        message: "Muitas tentativas de cadastro. Tente novamente mais tarde.",
        type: "rate_limit_exceeded",
      });
      return;
    }
    next();
  } catch {
    res.status(503).json({ message: "Newsletter temporarily unavailable", type: "rate_limit_unavailable" });
  }
};

/**
 * Rate limiter padrão para a API (evitar Data Scraping Massivo)
 * Máximo de 300 requisições a cada 5 minutos por IP.
 */
export const globalApiRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 300,
  message: {
    message: "Limite de requisições excedido.",
    type: "rate_limit_exceeded"
  },
  standardHeaders: true,
  legacyHeaders: false,
});
