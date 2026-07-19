# SmartTech Academy — container image (Railway / Fly.io / Render / any Docker host)
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Build without seeding (seed runs at container start, when the runtime DB is reachable)
RUN npx next build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/next.config.js ./
EXPOSE 3000
# Seed (idempotent) then serve. With a volume mounted at /app/prisma the SQLite file persists;
# or set DATABASE_URL/DATABASE_AUTH_TOKEN for Turso and no volume is needed.
CMD ["sh", "-c", "node prisma/seed.mjs && npx next start -p ${PORT:-3000}"]
