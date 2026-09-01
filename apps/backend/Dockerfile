FROM node:20-alpine AS base

# Definir as variáveis de ambiente
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Instalar pnpm globalmente
RUN corepack enable

WORKDIR /app

# Build-time public origins keep config validation deterministic. Runtime
# secrets and deployment-specific values are supplied by the environment.
ARG STOREFRONT_URL=http://localhost:5173
ARG STORE_CORS=http://localhost:5173
ENV STOREFRONT_URL=$STOREFRONT_URL
ENV STORE_CORS=$STORE_CORS

# Stage 1: Dependências
FROM base AS builder
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/
# Git hooks are development-only; omit lifecycle scripts in the image build.
RUN pnpm install --frozen-lockfile --ignore-scripts

# Stage 2: Build
COPY . .
RUN pnpm --filter backend build

# Stage 3: Produção Enxuta
FROM base AS runner

WORKDIR /app

# Usuário não root
RUN addgroup -S nodejs && adduser -S nodejs -G nodejs

COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=builder /app/apps/backend/package.json ./apps/backend/
COPY --from=builder /app/apps/backend/medusa-config.ts ./apps/backend/
COPY --from=builder /app/apps/backend/.medusa ./apps/backend/.medusa/

RUN pnpm install --frozen-lockfile --prod --ignore-scripts

USER nodejs

EXPOSE 9000

ENV NODE_ENV=production

# Healthcheck local da imagem; o Compose mantém a política de dependências.
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:9000/health/live || exit 1

CMD ["pnpm", "--filter", "backend", "start"]
