# Link and Navigation Audit - FriggaFrio Storefront

## 1. Executive Summary

This document details the navigation, links, and security audit for the FriggaFrio MVP storefront. A systematic sweep of all route definitions, component files, and navigation configurations was conducted to verify consistency and identify broken references.

## 2. Findings

### 2.1. Dead Links (`href="#"`)
- The file `apps/storefront/src/components/footer.tsx` contains 10 instances of `href="#"`. 
- **Note:** This component is currently **dead code** and unused. The application relies on `public-footer.tsx` which manages links properly via `footerNavigation` mapping.
- **Action Required:** Remove `footer.tsx` to prevent technical debt.

### 2.2. Route Mappings and 404s
- **Missing `/us/account` Links:** Found localized account fallback issues where specific logic pointed directly to non-localized `/account` endpoints without properly stripping `/us/` or other country codes in certain edge cases. However, `routeTree.gen.ts` successfully maps `/$countryCode/account/*` ensuring most fallbacks are covered.
- **`public-footer.tsx` & `footer-navigation.ts`:**
  - `footerNavigation.ts` defines navigation structure correctly.
  - Links to `/termos`, `/privacidade`, and `/trocas` are currently set to `active: false`, meaning they will not render and therefore do not cause 404s.
  - Social media and WhatsApp links are correctly populated via `storeConfig`.

### 2.3. Empty or Broken Image Links
- Only `src="/favicon.png"` was identified in header elements.
- Image assets (brands, locations) rely on absolute local paths or URLs and appear properly mapped.

## 3. Security Analysis (CORS & CSRF)

### 3.1. CORS
- **Current State:** The Medusa backend configuration (`medusa-config.ts` and `.env.example`) implements `STORE_CORS`, `ADMIN_CORS`, and `AUTH_CORS`.
- **Issue:** The `.env.example` file contains wildcard (`*`) domains for CORS, which is insecure for a production deployment.
- **Action Required:** For production, restrict CORS domains explicitly to the frontend's deployed URL (e.g., `https://friggafrio.com.br`) and admin dashboard URL, rejecting any `*` origins.

### 3.2. CSRF (Cross-Site Request Forgery)
- **Current State:** CSRF protection currently relies heavily on Medusa's standard authentication cookie implementations with `SameSite=Lax`.
- **Issue:** No explicit CSRF token implementation was found on the frontend (`apps/storefront/`).
- **Action Required:** Validate that Medusa backend cookies are explicitly marked `HttpOnly`, `Secure` (in production), and `SameSite=Lax` or `Strict` across all auth endpoints. Ensure `fetch` or `axios` instances do not inadvertently leak credentials cross-domain.

## 4. Conclusion

The navigation state is healthy with no user-facing broken internal links present on active components. Unused components should be pruned. Security implementations require tightening for CORS and ensuring cookie flags are robust for production CSRF defense.