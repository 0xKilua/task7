# Image de production. better-sqlite3 (>= 13) livre ses binaires précompilés
# (Node-API) : aucun outil de compilation n'est nécessaire.

FROM node:24-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
RUN npm ci

FROM node:24-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:24-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs conseiller

COPY --from=builder --chown=conseiller:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.mjs ./next.config.mjs
# Commandes d'administration (sauvegarde, comptes, catalogue) utilisables sur le serveur :
# docker compose exec app npm run comptes:lister
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig.json ./tsconfig.json

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
