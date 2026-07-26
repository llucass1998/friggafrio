FROM node:26-alpine AS base

# Definir as variáveis de ambiente
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Instalar pnpm globalmente
RUN corepack enable

WORKDIR /app

# Stage 1: Dependências
FROM base AS builder
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/
RUN pnpm install --frozen-lockfile

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

RUN pnpm install --frozen-lockfile --prod

USER nodejs

EXPOSE 9000

ENV NODE_ENV=production

# Graceful shutdown e healthcheck via compose
CMD ["pnpm", "--filter", "backend", "start"]
