import { defineConfig, loadEnv } from "@medusajs/framework/utils";
import { resolve as resolvePath } from "node:path";
import { getPaymentAvailability } from "./src/utils/payment-availability";
import { getSessionCookieName } from "./src/lib/auth/session-security";
import { getConfiguredStorefrontOrigin } from "./src/lib/auth/storefront-origin";
import {
  assertFileStorageConfigured,
  getLocalFileStorageOptions,
  getFileStorageProvider,
} from "./src/utils/file-storage-config";
import { PAYMENT_ATTEMPT_MODULE } from "./src/modules/payment-attempt";
import { PAYMENT_OPERATION_MODULE } from "./src/modules/payment-operation";

// Resolve the backend env beside this config instead of depending on the
// directory used by pnpm, Turbo, Docker, or a manually launched process.
loadEnv(process.env.NODE_ENV || "development", __dirname);
const backendPath = (relativePath: string) => resolvePath(__dirname, relativePath);

const nodeEnv = process.env.NODE_ENV || "development";
const isSecureSessionEnvironment = ["production", "staging"].includes(nodeEnv);
const sessionTtlMs = Number(process.env.SESSION_TTL_MS || 10 * 60 * 60 * 1000);
const storefrontOrigin = getConfiguredStorefrontOrigin();
const redisOptions = {
  connectTimeout: 1_000,
  maxRetriesPerRequest: 1,
  enableOfflineQueue: false,
  // Allow bounded recovery attempts without queueing requests indefinitely.
  retryStrategy: (attempt: number) => attempt > 10 ? null : Math.min(Math.max(attempt, 1) * 100, 1_000),
};
const googleAuthConfigured =
  !!process.env.GOOGLE_CLIENT_ID &&
  !!process.env.GOOGLE_CLIENT_SECRET &&
  !!process.env.GOOGLE_OAUTH_REDIRECT_URI;

if (!Number.isSafeInteger(sessionTtlMs) || sessionTtlMs <= 0) {
  throw new Error("SESSION_TTL_MS must be a positive integer.");
}

if (!storefrontOrigin) {
  throw new Error(
    "STOREFRONT_URL must be an HTTP(S) origin explicitly listed in STORE_CORS.",
  );
}

if (isSecureSessionEnvironment && !process.env.REDIS_URL) {
  throw new Error(
    "REDIS_URL is required in production and staging to persist authenticated sessions.",
  );
}

const stripeApiKey = process.env.STRIPE_API_KEY;
const isStripeConfigured = !!stripeApiKey;
const mercadoPagoSandboxConfigured =
  process.env.MERCADO_PAGO_ENV === "sandbox" &&
  !!process.env.MERCADO_PAGO_ACCESS_TOKEN &&
  !!process.env.MERCADO_PAGO_WEBHOOK_SECRET;
const paymentAvailability = getPaymentAvailability();
const paymentProviders =
  paymentAvailability.processingEnabled
    ? [
        ...(isStripeConfigured ? [{ resolve: "@medusajs/medusa/payment-stripe", id: "stripe", options: { apiKey: stripeApiKey, webhookSecret: process.env.STRIPE_WEBHOOK_SECRET } }] : []),
        ...(mercadoPagoSandboxConfigured ? [{ resolve: backendPath("src/providers/mercado-pago"), id: "mercado-pago", options: { accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN, webhookSecret: process.env.MERCADO_PAGO_WEBHOOK_SECRET, environment: "sandbox" as const } }] : []),
      ]
    : [];

const fileStorageProvider = assertFileStorageConfigured(process.env);

const localFileStorage = getLocalFileStorageOptions(process.env, backendPath("."));

module.exports = defineConfig({
  admin: {
    // Production storefront nodes can omit the Admin bundle entirely.
    // Local development keeps it enabled unless this environment flag is set.
    disable: process.env.DISABLE_MEDUSA_ADMIN === "true",
    // Medusa injects this allowlisted origin into supported Admin extensions.
    storefrontUrl: storefrontOrigin,
    vite: () => {
      let allowedHosts;
      if (process.env.__MEDUSA_ADDITIONAL_ALLOWED_HOSTS) {
        allowedHosts = [process.env.__MEDUSA_ADDITIONAL_ALLOWED_HOSTS];
      }

      return {
        // Inject only the validated, fixed public origin into the Admin bundle.
        // The logout widget constructs its own fixed /br destination from this.
        define: {
          __STOREFRONT_URL__: JSON.stringify(storefrontOrigin),
        },
        server: {
          allowedHosts,
        },
      };
    },
  },
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    redisOptions,
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
        customer: ["emailpass", ...(googleAuthConfigured ? ["google"] : [])],
      },
      jwtSecret: process.env.JWT_SECRET,
      cookieSecret: process.env.COOKIE_SECRET,
    },
  },
  modules: [
    {
      resolve: "@medusajs/medusa/auth",
      options: {
        providers: [
          { resolve: "@medusajs/medusa/auth-emailpass", id: "emailpass" },
          ...(googleAuthConfigured
            ? [{
                resolve: "@medusajs/medusa/auth-google",
                id: "google",
                options: {
                  clientId: process.env.GOOGLE_CLIENT_ID,
                  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                  callbackUrl: process.env.GOOGLE_OAUTH_REDIRECT_URI,
                },
              }]
            : []),
        ],
      },
    },
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
      resolve: backendPath("src/modules/payment-operation"),
    },
    {
      resolve: backendPath("src/modules/payment-webhook-event"),
    },
    {
      resolve: backendPath("src/modules/fiscal-order"),
    },
    {
      resolve: backendPath("src/modules/fiscal-outbox"),
    },
    {
      resolve: backendPath("src/modules/audit-log"),
    },
    {
      resolve: backendPath("src/modules/product-sales-policy"),
    },
    {
      resolve: backendPath("src/modules/frigga-omie-product-link"),
    },
    {
      resolve: backendPath("src/modules/wishlist"),
    },
    {
      resolve: backendPath("src/modules/password-reset-token"),
    },
    {
      resolve: backendPath("src/modules/product-review"),
    },
    {
      resolve: backendPath("src/modules/newsletter-subscription"),
    },
    {
      resolve: backendPath("src/modules/promotional-broadcast-draft"),
    },
    {
      resolve: "@medusajs/medusa/payment",
      // Payment provider services are instantiated in the payment module's
      // local container, so explicitly bridge the durable operation stores.
      dependencies: [PAYMENT_ATTEMPT_MODULE, PAYMENT_OPERATION_MODULE],
      options: {
        // Providers are opt-in. Mercado Pago additionally requires complete
        // server-only sandbox credentials and never falls back to a mock.
        providers: paymentProviders,
      },
    },
    {
      resolve: "@medusajs/medusa/fulfillment",
      options: {
        providers: [{
          resolve: backendPath("src/providers/frigga-shipping"),
          id: "frigga-shipping",
        }],
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
        providers:
          getFileStorageProvider(process.env) === "local"
            ? [
                {
                  id: "local",
                  resolve: "@medusajs/medusa/file-local",
                  is_default: true,
                  options: {
                    upload_dir: localFileStorage.uploadDir,
                    private_upload_dir: localFileStorage.privateUploadDir,
                    backend_url: localFileStorage.backendUrl,
                  },
                },
              ]
            : [
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
