FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json* ./
COPY server/package.json ./server/
COPY worker/package.json ./worker/
COPY web/package.json ./web/
RUN npm ci

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY server/ ./server/
WORKDIR /app/server
RUN npx prisma generate
RUN npx tsc

FROM base AS production
WORKDIR /app/server
COPY --from=build /app/server/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY server/prisma ./prisma
COPY server/package.json ./package.json

RUN mkdir -p /app/uploads

ENV NODE_ENV=production
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
