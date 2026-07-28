FROM node:20-alpine AS base

# Definir as variáveis de ambiente
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Instalar pnpm globalmente
RUN corepack enable

WORKDIR /app

# Stage 1: Instalação e Build
FROM base AS builder
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# Copiar os packages individuais necessários
COPY apps/storefront/package.json ./apps/storefront/
# A instalação requer pnpm-workspace para reconhecer o monorepo
RUN pnpm install --frozen-lockfile

# Copiar todo o código-fonte
COPY . .
# Realizar o build específico do storefront
RUN pnpm --filter storefront build

# Stage 2: Servidor Web de Produção (NGINX)
FROM nginx:alpine AS runner

# Remover as configurações default do NGINX
RUN rm -rf /usr/share/nginx/html/*

# Copiar os arquivos gerados no Stage 1
COPY --from=builder /app/apps/storefront/dist /usr/share/nginx/html

# Configuração customizada do NGINX para SPA (Single Page Application)
# Garante que as rotas caem no index.html e lida com o React Router
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    \
    # Cache otimizado para assets do Vite \
    location ~* \.(?:css|js|woff2?|eot|ttf|otf|webp|avif|png|jpg|jpeg|gif|ico|svg)$ { \
        expires 1y; \
        access_log off; \
        add_header Cache-Control "public, max-age=31536000, immutable"; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
