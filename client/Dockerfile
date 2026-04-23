FROM node:20-slim AS base

WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json* ./
# Note: Since the user is using pnpm locally, package-lock.json might not exist.
# npm install will create one if it's missing.
RUN npm install

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["npm", "start"]
