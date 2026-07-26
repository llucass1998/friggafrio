# FRIGGAFRIO SYSTEM BASELINE

## 1. Environment & Architecture
- **Monorepo Structure**: Identified `apps/storefront` (React 19, TanStack Router, Vite) and `apps/backend` (Medusa v2).
- **Styling**: Tailwind CSS 4 with Radix UI primitives.
- **Authentication**: Medusa SDK (`auth: { type: "session" }`), relying on HTTP-only `connect.sid` cross-origin cookies.
- **State Management**: TanStack Query and React Context (`AuthContext`, `CartContext`).

## 2. Security & Session Integrity
- **CORS & SameSite**: Local dev operates on `localhost:9000` and `localhost:5173`. Playwright E2E tests strictly target `localhost` to preserve `SameSite=Lax` cross-origin capabilities.
- **Payload Privacy**: B2C and B2B registrations separate and sanitize metadata.
- **Google OAuth**: Implementado no frontend (`@react-oauth/google`) mas aguardando a configuração da variável `VITE_GOOGLE_CLIENT_ID` no `.env` para operar corretamente. Atualmente documentado como pendência.

## 3. End-to-End Testing (Playwright)
- Playwright properly executes both Chromium and Mobile Chrome.
- Responsive locators must account for component conditionally hiding (e.g., `HeaderActions` hiding text via `hidden lg:block` on mobile). Tests rely on layout-agnostic verifications (like `"Você está logado."` in `home.tsx`) for robust assertions.