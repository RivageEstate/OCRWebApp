# ---------- builder ----------
FROM node:22-slim AS builder

WORKDIR /app

# Copy manifests for all workspaces (apps/web is needed for npm workspace graph)
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/worker/package.json apps/worker/package.json
COPY packages/domain/package.json packages/domain/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/providers/package.json packages/providers/package.json

RUN npm ci

# Copy source (worker + shared packages only; apps/web not needed)
COPY packages/ packages/
COPY apps/worker/ apps/worker/

# Generate Prisma client for linux
RUN npx prisma generate --schema packages/db/prisma/schema.prisma

# Bundle worker into a single file (esbuild; @prisma/client stays external)
RUN npm --workspace apps/worker run build

# ---------- runtime ----------
FROM node:22-slim

WORKDIR /app

# Only the Prisma client (platform-specific binary) is needed at runtime;
# everything else is bundled into dist/main.js
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/apps/worker/dist/main.js ./main.js

EXPOSE 8080

CMD ["node", "main.js"]
