# FriggaFrio MVP - Gap Analysis

## 1. Executive Summary

This Gap Analysis reviews the current state of the FriggaFrio MVP against a production-ready baseline. The core architecture (React 19, Tailwind v4, Medusa v2, TanStack Router) has been successfully implemented and tested locally. Most functional milestones—including the product catalog, custom checkout flows, authentication, and layout—are complete.

However, a few critical gaps remain in the areas of infrastructure, security configuration, content, and dead code cleanup before a production release can be signed off.

## 2. Infrastructure and Backend Gaps

### 2.1. Database Migrations (WSL/Windows)
- **Current State:** The Medusa `db:generate` command fails in the local WSL/Windows environment due to authentication/network issues with the PostgreSQL Docker container (`auth_failed` / SCRAM-SHA-256).
- **Impact:** Blocks full local end-to-end integration testing against a fully migrated database.
- **Remediation:** 
  - Execute database migrations in a native Linux environment, a CI/CD pipeline, or point the local `.env` to a cloud-hosted PostgreSQL instance (e.g., Supabase, Neon) for final local QA.

### 2.2. CORS Configuration
- **Current State:** The backend environment configurations (`STORE_CORS`, `ADMIN_CORS`, `AUTH_CORS` in `.env.example`) use wildcard `*` domains.
- **Impact:** Poses a security risk if deployed to production, potentially allowing malicious cross-origin requests.
- **Remediation:** Hardcode explicit frontend URLs (e.g., `https://friggafrio.com.br`) in the production environment variables and remove the wildcard.

## 3. Frontend Gaps

### 3.1. Dead Code and Technical Debt
- **Current State:** The component `apps/storefront/src/components/footer.tsx` is completely unused, replaced by `public-footer.tsx`. It contains 10 broken `href="#"` links.
- **Impact:** Clutters the codebase and may confuse developers in the future.
- **Remediation:** Delete `footer.tsx` and any unused imports. (Other deleted files like `sidebar.tsx` and `dashboard-page-layout.tsx` were correctly removed in recent commits).

### 3.2. Missing Content (Policies)
- **Current State:** The "Support" column in the footer displays "Área em construção". The links for "Termos de Uso", "Política de Privacidade", and "Política de Trocas" are disabled (`active: false` in `footer-navigation.ts`).
- **Impact:** Legal and trust compliance issue for a commercial storefront.
- **Remediation:** Draft the legal documents, implement their respective pages (`/termos`, `/privacidade`, `/trocas`), and re-enable them in the navigation config.

### 3.3. E2E Tests Realism
- **Current State:** Playwright E2E tests are currently passing by utilizing mocks or isolated environments because the database cannot be fully hydrated locally.
- **Impact:** Mocks can hide integration issues between the frontend and the Medusa API.
- **Remediation:** Once the database migration issue (Gap 2.1) is resolved, run a full suite of E2E tests against the true Medusa backend.

## 4. Product and Commerce Logic Gaps

### 4.1. Transition from Demo to Production Products
- **Current State:** The catalog is populated via a seed script (`seed-frigga-demo-catalog.ts`) where products are flagged with `is_demo_product: true`, `manage_inventory: false`, and have demo multiplier prices.
- **Impact:** Customers cannot purchase real items or see true stock levels.
- **Remediation:** 
  - Sync real pricing via the Medusa Admin.
  - Remove the `is_demo_product: true` metadata flag.
  - Enable inventory management and assign actual stock locations.
  - Update `product_sales_policy` from `QUOTE_ONLY` to `DIRECT` for purchasable items.

### 4.2. CSRF & Auth Cookie Enforcement
- **Current State:** CSRF relies on Medusa's standard cookie mechanics. 
- **Remediation:** For production, ensure the storefront and backend are deployed on the same registrable domain (e.g., `api.friggafrio.com.br` and `friggafrio.com.br`) to leverage `SameSite=Lax` securely, and ensure `Secure` flag is enforced on all auth cookies.

## 5. Conclusion

The application is in a highly mature state for an MVP. Addressing the Database/WSL blocker and configuring proper CORS/Cookies will secure the application infrastructure. Content-wise, implementing the legal pages and swapping demo products for real inventory are the final steps required for launch.