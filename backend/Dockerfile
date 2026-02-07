# Build Stage
FROM node:24-slim AS builder
WORKDIR /usr/src/app

# Install OpenSSL (Debian)
RUN apt-get update -y && apt-get install -y openssl

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
# Standard npm ci should work fine on Debian
RUN npm ci --ignore-scripts

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
RUN npm ci --only=production --ignore-scripts

# Copy built files from builder
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/src/generated ./dist/generated

EXPOSE 3000

# Start app
CMD ["node", "dist/server.js"]