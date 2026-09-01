FROM node:20-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

WORKDIR /app

ARG VITE_MEDUSA_BACKEND_URL=http://localhost:9000
ENV VITE_MEDUSA_BACKEND_URL=$VITE_MEDUSA_BACKEND_URL

FROM base AS dependencies

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/storefront/package.json ./apps/storefront/

# Git hooks are development-only; omit lifecycle scripts in the image build.
RUN pnpm install --frozen-lockfile --ignore-scripts

FROM dependencies AS builder

COPY . .
RUN pnpm --filter storefront build

FROM base AS runner

WORKDIR /app

RUN addgroup -S nodejs && adduser -S nodejs -G nodejs

COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=builder /app/apps/storefront/package.json ./apps/storefront/
COPY --from=builder /app/apps/storefront/dist ./apps/storefront/dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/storefront/node_modules ./apps/storefront/node_modules

ENV NODE_ENV=production

USER nodejs

EXPOSE 5173

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:5173/br || exit 1

CMD ["pnpm", "--dir", "apps/storefront", "exec", "vite", "preview", "--host", "0.0.0.0", "--port", "5173", "--strictPort"]
