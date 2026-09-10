import {
  authRateLimit,
  registerRateLimit,
  globalApiRateLimit,
  newsletterRateLimit,
  googleIntegrationRateLimit,
  secureHeaders,
} from "./middlewares/rate-limiting";
import { authenticate, defineMiddlewares } from "@medusajs/medusa";
import { validateDemoPriceCheckout } from "./middlewares/validate-demo-price";
import { releaseCartLineInventoryReservation } from "./middlewares/release-cart-inventory-reservation";
import {
  invalidateCartCheckoutPreparation,
  requireCheckoutPreparation,
} from "./middlewares/invalidate-checkout-preparation";
import { companyMiddlewares } from "./store/company/middlewares";
import { employeesMiddlewares } from "./store/employees/middlewares";
import { customersMiddlewares } from "./store/customers/middlewares";
import { googleMiddlewares } from "./store/google/middlewares";
import { meMiddlewares } from "./store/me/middlewares";
import { storeQuotesMiddlewares } from "./store/quotes/middlewares";
import {
  blockOrderCompletionUntilGate8,
  blockPaymentsWhenDisabled,
  blockUnsafePaymentConfirmation,
} from "./middlewares/payment-containment";
import {
  protectSessionMutation,
  requireTrustedAuthOrigin,
} from "../lib/auth/session-security";
import { wishlistMiddlewares } from "./store/wishlists/middlewares";
import { forceBrazilCheckoutCountry } from "./middlewares/force-brazil-checkout-country";
import { ADMIN_API_AUTH_METHODS, ADMIN_API_MATCHER } from "./middlewares/admin-route-security";
import { adminCompaniesMiddlewares } from "./admin/companies/middlewares";
import { adminQuotesMiddlewares } from "./admin/quotes/middlewares";
import { productReviewAdminMiddlewares } from "./admin/product-reviews/middlewares";
import { requireOwnedCheckoutCart } from "./middlewares/require-owned-checkout-cart";
import { allowLocalDevelopmentCors } from "./middlewares/local-development-cors";
import { getStorefrontHomeUrl } from "../admin/lib/storefront-home";
import type { MedusaNextFunction, MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

const attachAdminLogoutCookie = (
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction,
): void => {
  if (req.method === "DELETE") {
    res.cookie("frigga_admin_logged_out", "1", {
      path: "/",
      maxAge: 30000,
      httpOnly: false,
      sameSite: "lax",
    });
  }
  next();
};

const redirectLoggedOutAdmin = (
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction,
): void => {
  const isLoginPath = req.path === "/app/login" || req.path === "/app/login/" || req.path === "/login";
  const cookies = (req.headers as Record<string, string | undefined>)?.cookie || "";
  const hasCookie = /frigga_admin_logged_out=1/.test(cookies);
  if (isLoginPath && hasCookie) {
    res.clearCookie("frigga_admin_logged_out", { path: "/" });
    const host = typeof req.headers?.host === "string" ? req.headers.host.split(":")[0] : "localhost";
    const homeUrl = getStorefrontHomeUrl(process.env.STOREFRONT_URL, host);
    if (homeUrl) {
      res.redirect(302, homeUrl);
      return;
    }
  }
  next();
};

export default defineMiddlewares({
  routes: [
    {
      matcher: /.*/,
      middlewares: [secureHeaders],
    },
    {
      matcher: /.*/,
      middlewares: [redirectLoggedOutAdmin],
    },
    {
      matcher: /.*/,
      middlewares: [allowLocalDevelopmentCors],
    },
    {
      matcher: "^/store(?:/|$)",
      middlewares: [globalApiRateLimit],
    },
    {
      matcher: /^\/store(?:\/|$)/,
      methods: ["POST", "PUT", "PATCH", "DELETE"],
      middlewares: [protectSessionMutation],
    },
    {
      // Customer sessions cannot authorize custom Admin API routes.
      matcher: ADMIN_API_MATCHER,
      methods: ADMIN_API_AUTH_METHODS,
      middlewares: [authenticate("user", ["session", "bearer"])],
    },
    {
      matcher: /^\/auth\/(?:session|token\/refresh)$/,
      methods: ["POST", "DELETE"],
      middlewares: [requireTrustedAuthOrigin, authRateLimit, attachAdminLogoutCookie],
    },
    {
      matcher: "/auth/unified/emailpass",
      method: "POST",
      middlewares: [requireTrustedAuthOrigin, authRateLimit],
    },
    {
      matcher: "/store/newsletter/subscriptions",
      method: "POST",
      middlewares: [newsletterRateLimit],
    },
    {
      matcher: "/store/newsletter/unsubscribe",
      method: "POST",
      middlewares: [newsletterRateLimit],
    },
    {
      // Svix verification requires the exact signed request bytes.
      matcher: "/webhooks/resend",
      method: "POST",
      bodyParser: { preserveRawBody: true },
    },
    {
      // Protect the state-changing Google start flow without throttling the
      // anonymous readiness probe used by the login page.
      matcher: /^\/auth\/customer\/google\/start(?:\/|$)/,
      method: "POST",
      middlewares: [requireTrustedAuthOrigin, authRateLimit],
    },
    {
      matcher: /^\/auth\/customer\/google\/(?:start|callback)(?:\/|$)/,
      method: "GET",
      middlewares: [authRateLimit],
    },
    {
      matcher: "/store/google/*",
      method: "GET",
      middlewares: [googleIntegrationRateLimit],
    },
    {
      matcher: "/store/products/:productId/reviews/eligibility",
      method: "GET",
      middlewares: [authenticate("customer", ["session", "bearer"])],
    },
    {
      matcher: "/store/products/:productId/reviews",
      method: "POST",
      middlewares: [authenticate("customer", ["session", "bearer"])],
    },
    {
      matcher: "/store/products/:productId/reviews/:reviewId",
      method: "PATCH",
      middlewares: [authenticate("customer", ["session", "bearer"])],
    },
    {
      method: "POST",
      matcher: "/store/customers/me/orders/:id/pay",
      middlewares: [blockUnsafePaymentConfirmation],
    },
    {
      method: "POST",
      matcher: "/store/customers/me/orders/:id/payment-session",
      middlewares: [blockPaymentsWhenDisabled],
    },
    {
      method: "POST",
      matcher: "/store/company/initiate-checkout-session",
      middlewares: [blockPaymentsWhenDisabled],
    },
    {
      method: "POST",
      matcher: "/store/checkout",
      middlewares: [blockPaymentsWhenDisabled],
    },
    {
      method: "POST",
      matcher: "/admin/orders/:id/refund",
      middlewares: [blockPaymentsWhenDisabled],
    },
    {
      method: "POST",
      matcher: "/webhooks/mercado-pago",
      middlewares: [blockPaymentsWhenDisabled],
    },
    {
      method: "POST",
      matcher: "/store/company/payment-methods",
      middlewares: [blockPaymentsWhenDisabled],
    },
    {
      method: "POST",
      matcher: "/store/payment-collections/:id/payment-sessions",
      middlewares: [blockPaymentsWhenDisabled],
    },
    {
      method: "POST",
      matcher: "/store/carts/:id/payment-collections",
      middlewares: [blockPaymentsWhenDisabled, validateDemoPriceCheckout],
    },
    {
      method: "POST",
      matcher: "/store/carts/:id/complete",
      middlewares: [
        authenticate("customer", ["session", "bearer"]),
        requireOwnedCheckoutCart,
        blockOrderCompletionUntilGate8,
        blockPaymentsWhenDisabled,
        requireCheckoutPreparation,
        validateDemoPriceCheckout,
      ],
    },
    {
      method: "POST",
      matcher: "/store/carts/:id/prepare",
      middlewares: [authenticate("customer", ["session", "bearer"])],
    },
    {
      method: "POST",
      matcher: "/store/carts/:id/checkout-ready",
      middlewares: [authenticate("customer", ["session", "bearer"])],
    },
    {
      method: "POST",
      matcher: "/store/carts/:id/line-items",
      middlewares: [invalidateCartCheckoutPreparation],
    },
    {
      method: "POST",
      matcher: "/store/carts/:id/line-items/:line_id",
      middlewares: [invalidateCartCheckoutPreparation, releaseCartLineInventoryReservation],
    },
    {
      method: "DELETE",
      matcher: "/store/carts/:id/line-items/:line_id",
      middlewares: [invalidateCartCheckoutPreparation, releaseCartLineInventoryReservation],
    },
    {
      method: "POST",
      matcher: "/store/carts/:id",
      middlewares: [forceBrazilCheckoutCountry, invalidateCartCheckoutPreparation],
    },
    {
      method: "POST",
      matcher: "/store/carts/:id/shipping-methods",
      middlewares: [invalidateCartCheckoutPreparation],
    },
    {
      method: "POST",
      matcher: "/store/carts/:id/taxes",
      middlewares: [invalidateCartCheckoutPreparation],
    },
    {
      method: "POST",
      matcher: "/store/carts/:id/customer",
      middlewares: [invalidateCartCheckoutPreparation],
    },
    {
      method: ["POST", "DELETE"],
      matcher: "/store/carts/:id/promotions",
      middlewares: [invalidateCartCheckoutPreparation],
    },
    {
      method: "POST",
      matcher: "/store/carts/:id/payment-collections",
      middlewares: [invalidateCartCheckoutPreparation],
    },
    ...companyMiddlewares,
    ...employeesMiddlewares,
    ...customersMiddlewares,
    ...meMiddlewares,
    ...storeQuotesMiddlewares,
    ...wishlistMiddlewares,
    ...adminCompaniesMiddlewares,
    ...adminQuotesMiddlewares,
    ...productReviewAdminMiddlewares,
    ...googleMiddlewares,
  ],
});
