import rateLimit from "express-rate-limit";
import helmet from "helmet";

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
