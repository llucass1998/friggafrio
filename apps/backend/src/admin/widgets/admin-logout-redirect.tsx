import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { useEffect } from "react";
import "../lib/admin-language-runtime";
import { getStorefrontHomeUrl } from "../lib/storefront-home";

const LOGOUT_INTENT_KEY = "frigga.admin.logout.pending";
const LOGOUT_LABELS = new Set(["sair", "logout", "log out", "cerrar sesión", "déconnexion"]);

const readLogoutIntent = (): boolean => {
  try {
    return window.sessionStorage.getItem(LOGOUT_INTENT_KEY) === "1";
  } catch {
    return false;
  }
};

export const shouldRedirectAfterAdminLogout = (currentPath: string, logoutIntent: boolean): boolean =>
  currentPath === "/app/login" && logoutIntent;

// The Dashboard owns the actual mutation. This capture listener only records
// that the user initiated it, which survives the SPA navigation to /login.
const installLogoutIntentListener = (): void => {
  if (typeof document === "undefined") return;
  const marker = "__friggaLogoutIntentListener";
  const root = document as Document & { [marker]?: boolean };
  if (root[marker]) return;
  root[marker] = true;
  document.addEventListener("click", (event) => {
    const target = event.target instanceof Element
      ? event.target.closest<HTMLElement>('[role="menuitem"],button')
      : null;
    const label = target?.textContent?.replace(/\s+/g, " ").trim().toLowerCase();
    if (!label || !LOGOUT_LABELS.has(label)) return;
    try {
      window.sessionStorage.setItem(LOGOUT_INTENT_KEY, "1");
    } catch {
      // A blocked sessionStorage must not interfere with the official logout.
    }
  }, true);
};

installLogoutIntentListener();

/**
 * Medusa clears the server session before navigating to its login route. This
 * supported login widget replaces that history entry with the public home.
 */
const AdminLogoutRedirect = () => {
  useEffect(() => {
    const intent = readLogoutIntent();
    if (!shouldRedirectAfterAdminLogout(window.location.pathname, intent)) return;
    try {
      window.sessionStorage.removeItem(LOGOUT_INTENT_KEY);
    } catch {
      // Best effort cleanup; the marker is session-scoped and harmless.
    }
    const homeUrl = getStorefrontHomeUrl(__STOREFRONT_URL__);
    if (homeUrl) {
      window.location.replace(homeUrl);
    }
  }, []);

  return null;
};

export const config = defineWidgetConfig({
  zone: "login.before",
  id: "friggafrio.admin-logout-redirect",
});

export default AdminLogoutRedirect;
