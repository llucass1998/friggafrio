import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { useEffect } from "react";
import { getStorefrontHomeUrl } from "../lib/storefront-home";

/** The native logout ends the session before the Dashboard reaches login. */
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
