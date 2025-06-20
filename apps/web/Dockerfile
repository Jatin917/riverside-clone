FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy root package files
COPY package.json yarn.lock* .yarnrc.yml turbo.json ./
COPY .yarn ./.yarn

# Copy all workspace package.json files (create directories first)
RUN mkdir -p apps/web apps/api packages/db packages/typescript-config packages/ui packages/eslint-config
COPY apps/*/package.json ./apps/
COPY packages/*/package.json ./packages/
COPY apps/web/next.config.js ./apps/web/next.config.js
COPY apps/web/postcss.config.mjs ./apps/web/postcss.config.mjs
# COPY apps/web/tailwind.config.js ./apps/web/tailwind.config.js

RUN corepack enable && corepack prepare yarn@3.6.1 --activate

# Install dependencies
RUN yarn install

# Build the app
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/.yarn ./.yarn
COPY . .

# Ensure config files exist for Tailwind and PostCSS in the build context
COPY apps/web/next.config.js ./apps/web/next.config.js
COPY apps/web/postcss.config.mjs ./apps/web/postcss.config.mjs
# COPY apps/web/tailwind.config.js ./apps/web/tailwind.config.js

# Generate Prisma client first
RUN corepack enable && corepack prepare yarn@3.6.1 --activate
RUN yarn workspace @repo/db db:generate

# Then build the web app
RUN yarn workspace web build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Static and public assets
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/public ./standalone/public

# Required config files for runtime (if needed)
COPY apps/web/next.config.js ./apps/web/next.config.js
COPY apps/web/postcss.config.mjs ./apps/web/postcss.config.mjs
# COPY apps/web/tailwind.config.js ./apps/web/ .config.js

# Set correct permission for prerender cache
RUN mkdir -p ./apps/web/.next
RUN chown nextjs:nodejs ./apps/web/.next

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./standalone
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./standalone/apps/web/.next/static

# Copy generated Prisma client
COPY --from=builder /app/packages/db/generated/prisma /app/standalone/apps/web/generated/prisma

USER nextjs

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "standalone/apps/web/server.js"]
