FROM node:20-slim AS base
RUN corepack enable

FROM base AS deps
WORKDIR /app
COPY pnpm-workspace.yaml package.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/api/package.json apps/api/package.json
COPY packages/types/package.json packages/types/package.json
COPY packages/catalog-data/package.json packages/catalog-data/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/ai-engine/package.json packages/ai-engine/package.json
RUN pnpm install --frozen-lockfile

FROM deps AS build
WORKDIR /app
COPY . .
ARG NEXT_PUBLIC_API_URL=http://localhost:4000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN pnpm --filter @relook/web build

EXPOSE 3000
CMD ["pnpm", "--filter", "@relook/web", "start"]
