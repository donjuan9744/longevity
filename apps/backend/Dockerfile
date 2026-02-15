FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json tsconfig.base.json ./
COPY apps/backend/package.json ./apps/backend/package.json
COPY packages/engine/package.json ./packages/engine/package.json
COPY prisma ./prisma

RUN npm install

COPY apps/backend ./apps/backend
COPY packages/engine ./packages/engine

RUN npm --workspace packages/engine run build
RUN npm --workspace apps/backend run prisma:generate
RUN npm --workspace apps/backend run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/backend/package.json ./apps/backend/package.json
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000
CMD ["node", "apps/backend/dist/index.js"]
