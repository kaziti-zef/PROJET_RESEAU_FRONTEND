# ============================================================
#  NidiRoom — Dockerfile (Frontend Next.js)
#  Build multi-stage optimisé pour la production
#  Stage 1 : deps     → installation des dépendances
#  Stage 2 : builder  → compilation Next.js
#  Stage 3 : runner   → image finale légère (Alpine)
# ============================================================

# ── Stage 1 : Installation des dépendances ─────────────────
FROM node:22-alpine AS deps

# Outils nécessaires pour certains packages natifs
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copie uniquement les fichiers de dépendances
# (optimise le cache Docker : rebuild seulement si package.json change)
COPY package.json package-lock.json* ./

RUN npm ci --only=production --frozen-lockfile

# ── Stage 2 : Build de l'application ───────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Récupère les node_modules du stage précédent
COPY --from=deps /app/node_modules ./node_modules

# Copie tout le code source
COPY . .

# Variables d'environnement pour le build
# NEXT_PUBLIC_* sont intégrées au bundle au moment du build
ARG NEXT_PUBLIC_API_URL=http://localhost:8080
ARG NEXT_PUBLIC_WS_URL=http://localhost:8080/ws

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Active le output standalone de Next.js
# (produit un dossier .next/standalone avec uniquement le nécessaire)
RUN npm run build

# ── Stage 3 : Image de production légère ───────────────────
FROM node:22-alpine AS runner

WORKDIR /app

# Sécurité : exécution en tant qu'utilisateur non-root
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Copie les fichiers publics
COPY --from=builder /app/public ./public

# Copie le build standalone
# (Next.js standalone inclut uniquement les fichiers serveur nécessaires)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Bascule sur l'utilisateur non-root
USER nextjs

# Expose le port 3000
EXPOSE 3000

# Démarre l'application
CMD ["node", "server.js"]
