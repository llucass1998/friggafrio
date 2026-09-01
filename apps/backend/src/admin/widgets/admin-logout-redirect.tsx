import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { useEffect } from "react";
import { getStorefrontHomeUrl } from "../lib/storefront-home";

/**
 * Medusa clears the server session before navigating to its login route. This
 * supported login widget replaces that history entry with the public home.
 */
const AdminLogoutRedirect = () => {
  useEffect(() => {
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
