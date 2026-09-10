import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { useEffect } from "react";
import "../lib/admin-language-runtime";
import { getStorefrontHomeUrl } from "../lib/storefront-home";

const LOGOUT_INTENT_KEY = "frigga.admin.logout.pending";
const LOGOUT_COOKIE_NAME = "frigga_admin_logged_out";
const LOGOUT_LABELS = new Set([
  "sair",
  "logout",
  "log out",
  "cerrar sesión",
  "déconnexion",
  "desconectar",
  "encerrar sessão",
  "terminar sessão",
]);

let memoryIntent = false;

export const markLogoutIntent = (): void => {
  memoryIntent = true;
  try {
    window.sessionStorage.setItem(LOGOUT_INTENT_KEY, "1");
  } catch {}
  try {
    window.localStorage.setItem(LOGOUT_INTENT_KEY, "1");
  } catch {}
  try {
    if (typeof document !== "undefined") {
      document.cookie = `${LOGOUT_COOKIE_NAME}=1; Path=/; Max-Age=30; SameSite=Lax`;
    }
  } catch {}
};

export const clearLogoutIntent = (): void => {
  memoryIntent = false;
  try {
    window.sessionStorage.removeItem(LOGOUT_INTENT_KEY);
  } catch {}
  try {
    window.localStorage.removeItem(LOGOUT_INTENT_KEY);
  } catch {}
  try {
    if (typeof document !== "undefined") {
      document.cookie = `${LOGOUT_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
    }
  } catch {}
};

export const hasLogoutIntent = (): boolean => {
  if (memoryIntent) return true;
  try {
    const fromSession = typeof window !== "undefined" && window.sessionStorage.getItem(LOGOUT_INTENT_KEY) === "1";
    const fromLocal = typeof window !== "undefined" && window.localStorage.getItem(LOGOUT_INTENT_KEY) === "1";
    const fromCookie = typeof document !== "undefined" &&
      new RegExp(`(?:^|;\\s*)${LOGOUT_COOKIE_NAME}=1`).test(document.cookie);
    return Boolean(fromSession || fromLocal || fromCookie);
  } catch {
    return false;
  }
};

export const shouldRedirectAfterAdminLogout = (currentPath: string, logoutIntent: boolean): boolean =>
  (currentPath === "/app/login" || currentPath === "/login" || currentPath.endsWith("/login")) && logoutIntent;

// Intercept clicks on any logout action across the admin
const installLogoutIntentListener = (): void => {
  if (typeof document === "undefined") return;
  const marker = "__friggaLogoutIntentListener";
  const root = document as Document & { [marker]?: boolean };
  if (root[marker]) return;
  root[marker] = true;
  document.addEventListener("click", (event) => {
    const target = event.target instanceof Element
      ? event.target.closest<HTMLElement>('[role="menuitem"],button,a')
      : null;
    const label = target?.textContent?.replace(/\s+/g, " ").trim().toLowerCase();
    if (!label) return;
    const isLogoutClick = LOGOUT_LABELS.has(label) ||
      Array.from(LOGOUT_LABELS).some((term) => label.includes(term));
    if (!isLogoutClick) return;
    markLogoutIntent();
  }, true);
};

// Intercept DELETE /auth/session fetch calls from anywhere in the admin application
const installLogoutFetchInterceptor = (): void => {
  if (typeof window === "undefined") return;
  const marker = "__friggaLogoutFetchPatched";
  const win = window as Window & { [marker]?: boolean };
  if (win[marker]) return;
  win[marker] = true;

  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    const [input, init] = args;
    const url = typeof input === "string" ? input : input instanceof Request ? input.url : "";
    const method = (init?.method || (input instanceof Request ? input.method : "GET")).toUpperCase();
    if (method === "DELETE" && url.includes("/auth/session")) {
      markLogoutIntent();
      try {
        const response = await originalFetch.apply(this, args);
        const homeUrl = getStorefrontHomeUrl(__STOREFRONT_URL__, window.location.hostname);
        if (homeUrl) {
          clearLogoutIntent();
          window.location.assign(homeUrl);
        }
        return response;
      } catch (err) {
        const homeUrl = getStorefrontHomeUrl(__STOREFRONT_URL__, window.location.hostname);
        if (homeUrl) {
          clearLogoutIntent();
          window.location.assign(homeUrl);
        }
        throw err;
      }
    }
    return originalFetch.apply(this, args);
  };
};

installLogoutIntentListener();
installLogoutFetchInterceptor();

declare const __STOREFRONT_URL__: string | undefined;

/**
 * Medusa clears the server session before navigating to its login route. This
 * supported login widget replaces that history entry with the public home.
 */
const AdminLogoutRedirect = () => {
  useEffect(() => {
    const intent = hasLogoutIntent();
    if (!shouldRedirectAfterAdminLogout(window.location.pathname, intent)) return;
    clearLogoutIntent();
    const homeUrl = getStorefrontHomeUrl(__STOREFRONT_URL__, window.location.hostname);
    if (homeUrl) {
      window.location.replace(homeUrl);
    }
  }, []);

  return null;
};

export const config = defineWidgetConfig({
  zone: [
    "login.before",
    "order.list.before",
    "product.list.before",
    "customer.list.before",
    "promotion.list.before",
  ],
  id: "friggafrio.admin-logout-redirect",
});

export default AdminLogoutRedirect;
