import { defineConfig, loadEnv } from "@medusajs/framework/utils";
import { resolve as resolvePath } from "node:path";
import { getPaymentAvailability } from "./src/utils/payment-availability";
import { getSessionCookieName } from "./src/lib/auth/session-security";

// Resolve the backend env beside this config instead of depending on the
// directory used by pnpm, Turbo, Docker, or a manually launched process.
loadEnv(process.env.NODE_ENV || "development", __dirname);
const backendPath = (relativePath: string) => resolvePath(__dirname, relativePath);

const nodeEnv = process.env.NODE_ENV || "development";
const isSecureSessionEnvironment = ["production", "staging"].includes(nodeEnv);
const sessionTtlMs = Number(process.env.SESSION_TTL_MS || 10 * 60 * 60 * 1000);

if (!Number.isSafeInteger(sessionTtlMs) || sessionTtlMs <= 0) {
  throw new Error("SESSION_TTL_MS must be a positive integer.");
}

if (isSecureSessionEnvironment && !process.env.REDIS_URL) {
  throw new Error(
    "REDIS_URL is required in production and staging to persist authenticated sessions.",
  );
}

const stripeApiKey = process.env.STRIPE_API_KEY;
const isStripeConfigured = !!stripeApiKey;
const paymentAvailability = getPaymentAvailability();
const paymentProviders =
  paymentAvailability.processingEnabled && isStripeConfigured
    ? [
        {
          resolve: "@medusajs/medusa/payment-stripe",
          id: "stripe",
          options: {
            apiKey: stripeApiKey,
            webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
          },
        },
      ]
    : [];

module.exports = defineConfig({
  admin: {
    // Production storefront nodes can omit the Admin bundle entirely.
    // Local development keeps it enabled unless this environment flag is set.
    disable: process.env.DISABLE_MEDUSA_ADMIN === "true",
    vite: () => {
      let hmrServer;
      if (process.env.HMR_BIND_HOST) {
        const { createServer } = require("http");
        hmrServer = createServer();
        const hmrPort = parseInt(process.env.HMR_PORT || "9001");
        hmrServer.listen(hmrPort, process.env.HMR_BIND_HOST);
      }

      let allowedHosts;
      if (process.env.__MEDUSA_ADDITIONAL_ALLOWED_HOSTS) {
        allowedHosts = [process.env.__MEDUSA_ADDITIONAL_ALLOWED_HOSTS];
      }

      return {
        server: {
          allowedHosts,
          hmr: {
            server: hmrServer,
          },
        },
      };
    },
  },
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    sessionOptions: {
      name: getSessionCookieName(),
      resave: false,
      rolling: true,
      saveUninitialized: false,
      ttl: sessionTtlMs,
    },
    cookieOptions: {
      httpOnly: true,
      secure: isSecureSessionEnvironment,
      sameSite: "lax",
      path: "/",
      priority: "high",
    },

    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      // Public email/password login is actor-neutral through the BFF route.
      // Google remains customer-only and is enabled only with provider config.
      authMethodsPerActor: {
        user: ["emailpass"],
        // Google has no registered auth provider in this deployment yet.
        customer: ["emailpass"],
      },
      jwtSecret: process.env.JWT_SECRET,
      cookieSecret: process.env.COOKIE_SECRET,
    },
  },
  modules: [
    {
      resolve: backendPath("src/modules/company"),
    },
    {
      resolve: backendPath("src/modules/quote"),
    },
    {
      resolve: backendPath("src/modules/customer-profile"),
    },
    {
      resolve: backendPath("src/modules/payment-attempt"),
    },
    {
      resolve: backendPath("src/modules/payment-webhook-event"),
    },
    {
      resolve: backendPath("src/modules/audit-log"),
    },
    {
      resolve: backendPath("src/modules/product-sales-policy"),
    },
    {
      resolve: backendPath("src/modules/wishlist"),
    },
    {
      resolve: backendPath("src/modules/password-reset-token"),
    },
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        // Mercado Pago remains quarantined until its provider and webhook are
        // implemented and homologated. No provider is registered by default.
        providers: paymentProviders,
      },
    },
    {
      // Inventory reservations must serialize across backend processes. The
      // PostgreSQL provider is the durable lock used by Medusa's reservation
      // workflows instead of the in-memory development fallback.
      resolve: "@medusajs/medusa/locking",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/locking-postgres",
            id: "locking-postgres",
            is_default: true,
          },
        ],
      },
    },
    {
      resolve: "@medusajs/medusa/file",
      options: {
        providers: [
          {
            id: "s3",
            resolve: "@medusajs/medusa/file-s3",
            is_default: true,
            options: process.env.R2_FILE_URL
              ? {
                  file_url: process.env.R2_FILE_URL,
                  prefix: process.env.R2_PREFIX,
                  bucket: process.env.R2_BUCKET,
                  endpoint: process.env.R2_ENDPOINT,
                  access_key_id: process.env.R2_ACCESS_KEY_ID,
                  secret_access_key: process.env.R2_SECRET_ACCESS_KEY,
                  session_token: process.env.R2_SESSION_TOKEN,
                  region: "auto",
                  additional_client_config: {
                    forcePathStyle: false,
                    requestChecksumCalculation: "WHEN_REQUIRED",
                  },
                }
              : {
                  authentication_method: "s3-iam-role",
                  file_url: process.env.S3_FILE_URL,
                  prefix: process.env.S3_PREFIX,
                  bucket: process.env.S3_BUCKET,
                  endpoint: process.env.S3_ENDPOINT,
                  region: process.env.S3_REGION,
                },
          },
        ],
      },
    },
  ],
});
