# Build Stage
FROM node:24-slim AS builder
WORKDIR /usr/src/app

# Install OpenSSL (Debian)
RUN apt-get update -y && apt-get install -y openssl

# Upgrade npm to latest stable (11.13.0) to fix optional-dep lockfile bug in npm 11.3.0-11.6.2
RUN npm install -g npm@11.13.0

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
# Build stage needs ALL deps (including dev) for TypeScript compilation via tsx
# We use npm install (not npm ci) to bypass lockfile optional-dep bugs in npm 11.3.0-11.6.2
RUN npm install --ignore-scripts

# Copy source code
COPY . .

# Generate Prisma Client
# Provide dummy env vars for safety
RUN DIRECT_URL="postgresql://dummy" DATABASE_URL="postgresql://dummy" npx prisma generate

# Build TypeScript
RUN npm run build

# Production Stage
FROM node:24-slim AS production
WORKDIR /usr/src/app

# Install OpenSSL (Debian)
RUN apt-get update -y && apt-get install -y openssl

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install production dependencies only
# Upgrade npm inside the production stage too for consistency
RUN npm install -g npm@11.13.0 && \
npm install --omit=dev --ignore-scripts

# Copy built files from builder
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/src/generated ./dist/generated

EXPOSE 3000

# Start app
CMD ["node", "dist/server.js"]