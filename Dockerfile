# Build stage - no secrets in ARG/ENV; Railway injects env at runtime
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Production deps only
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Built app, scripts, and src (scripts import from src/)
COPY --from=builder /app/build ./build
COPY --from=builder /app/static ./static
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/src ./src

# Seed data for init script (copies to volume when missing)
COPY --from=builder /app/data ./data

EXPOSE 3000
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# Run init scripts (allow failure so server still starts), then start app. Railway sets PORT at runtime.
CMD ["sh", "-c", "(node scripts/init-crm-data-on-build.js || true) && (node scripts/ensure-db-on-deploy.js || true) && exec node -r dotenv/config build/index.js"]
