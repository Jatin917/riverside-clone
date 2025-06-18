FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files and workspace structure
COPY package.json yarn.lock* .yarnrc.yml ./
COPY .yarn ./.yarn
COPY turbo.json ./

# Copy all workspace package.json files
COPY apps/web/package.json ./apps/web/
COPY apps/api/package.json ./apps/api/
COPY packages/db/package.json ./packages/db/
COPY packages/*/package.json ./packages/*/

RUN corepack enable && corepack prepare yarn@3.6.1 --activate

# Install dependencies
RUN yarn install 

# Build the app
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/.yarn ./.yarn
COPY . .

# Generate Prisma client first
RUN yarn workspace db generate

# Then build the API
RUN yarn workspace api build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 apiuser

# Copy built application
COPY --from=builder --chown=apiuser:nodejs /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=apiuser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=apiuser:nodejs /app/packages ./packages
COPY --from=builder --chown=apiuser:nodejs /app/apps/api/package.json ./apps/api/

USER apiuser

EXPOSE 3001

ENV PORT 3001

CMD ["node", "apps/api/dist/index.js"]