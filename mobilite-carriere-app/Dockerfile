# Image de production. better-sqlite3 (>= 13) livre ses binaires précompilés
# (Node-API) : aucun outil de compilation n'est nécessaire.

FROM node:24-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
RUN npm ci

# Modèle de la recherche par le sens, téléchargé une fois à la construction de l'image (~135 Mo).
# Sans accès à Hugging Face, l'image se construit quand même : la recherche se fait alors par
# les mots seulement, et le modèle peut être ajouté plus tard (voir DEPLOIEMENT.md).
FROM node:24-bookworm-slim AS modele
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY scripts/installer-modele.mjs ./scripts/
RUN node scripts/installer-modele.mjs || mkdir -p modeles

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

# Contenus livrés (catalogue, textes officiels) hors du volume de données : une nouvelle
# image les met à jour, ce que le volume monté sur /app/data empêcherait.
COPY --from=builder /app/contenus ./contenus
COPY --from=modele /app/modeles ./modeles
COPY --from=builder /app/data/documents/README.md ./data/documents/README.md
RUN mkdir -p /app/data/documents && chown -R conseiller:nodejs /app/data

VOLUME ["/app/data"]
USER conseiller
EXPOSE 3000
ENV MCC_DB_PATH=/app/data/app.db
# Télémétrie d'onnxruntime (recherche par le sens) coupée : aucune donnée ne quitte le serveur.
ENV ORT_DISABLE_TELEMETRY=1
# Limite la fragmentation mémoire des fils de calcul : ~0,7 Go au lieu de 1,5 Go mesurés.
ENV MALLOC_ARENA_MAX=2

CMD ["npm", "run", "start"]
