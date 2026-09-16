FROM node:20-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
RUN corepack enable

FROM base AS deps
WORKDIR /app
COPY pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/types/package.json packages/types/package.json
COPY packages/catalog-data/package.json packages/catalog-data/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/ai-engine/package.json packages/ai-engine/package.json
RUN pnpm install --frozen-lockfile

FROM deps AS build
WORKDIR /app
COPY . .
RUN pnpm --filter @relook/db generate

EXPOSE 4000
CMD ["pnpm", "--filter", "@relook/api", "start"]
