FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json* ./
COPY worker/package.json ./worker/
COPY server/prisma ./server/prisma/
RUN npm ci --workspace=worker

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/worker/node_modules ./worker/node_modules
COPY worker/ ./worker/
COPY server/prisma ./server/prisma/
WORKDIR /app/worker
RUN npx prisma generate --schema=../server/prisma/schema.prisma
RUN npm run build

FROM base AS production
WORKDIR /app/worker
COPY --from=build /app/worker/dist ./dist
COPY --from=build /app/worker/node_modules ./node_modules
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma
COPY worker/package.json ./package.json

ENV NODE_ENV=production
CMD ["node", "dist/index.js"]
