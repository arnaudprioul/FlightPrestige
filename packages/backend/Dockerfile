# Build context must be the monorepo root (see docker-compose.yml)
FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace manifests first for layer caching
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/backend/package.json ./packages/backend/

# Install ALL deps (including devDeps) so tsc is available during build
RUN npm ci --workspace=packages/shared --workspace=packages/backend

# Copy sources
COPY packages/shared/src ./packages/shared/src
COPY packages/shared/tsconfig.json ./packages/shared/
COPY packages/backend/src ./packages/backend/src
COPY packages/backend/tsconfig.json ./packages/backend/

# Build shared then backend
RUN npm run build -w packages/shared && npm run build -w packages/backend

# Prune devDependencies after build
RUN npm prune --omit=dev --workspace=packages/shared --workspace=packages/backend

# ── Runtime image ─────────────────────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/packages/backend/dist ./packages/backend/dist
COPY --from=builder /app/packages/backend/package.json ./packages/backend/

WORKDIR /app/packages/backend

EXPOSE 4000

CMD ["node", "dist/index.js"]
