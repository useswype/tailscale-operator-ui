# Build stage
FROM node:22.14.0-alpine AS base

#### Build
FROM base AS build
ENV NEXT_TELEMETRY_DISABLED=1

RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

RUN npm run build

#### Server
FROM base AS runner

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application from build stage
COPY --from=build --chown=nextjs:nodejs /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static

# Install production dependencies only
RUN npm ci --omit=dev
RUN npm install sharp

# Remove all maps if any
RUN cd .next && find . -name "*.map" -type f -delete

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]