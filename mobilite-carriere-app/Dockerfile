# Image de production. better-sqlite3 est un module natif : la première étape
# installe les outils de compilation nécessaires, les étapes suivantes ne les
# embarquent pas dans l'image finale.

FROM node:20-bookworm-slim AS deps
WORKDIR /app
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs conseiller

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.mjs ./next.config.mjs

# Amorçage livré à l'image (catalogue de dispositifs, notice) ; les données
# réelles (base, documents ingérés) vivent dans le volume monté ci-dessous.
COPY --from=builder /app/data/dispositifs.seed.json ./data/dispositifs.seed.json
COPY --from=builder /app/data/documents/README.md ./data/documents/README.md
RUN mkdir -p /app/data/documents && chown -R conseiller:nodejs /app/data

VOLUME ["/app/data"]
USER conseiller
EXPOSE 3000
ENV MCC_DB_PATH=/app/data/app.db

CMD ["npm", "run", "start"]
