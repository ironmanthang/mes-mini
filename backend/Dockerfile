# Build Stage
FROM node:24-alpine AS builder
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma Client
# Prisma 7 requires env vars to be present when loading config
RUN DIRECT_URL="postgresql://dummy" DATABASE_URL="postgresql://dummy" npx prisma generate

# Build TypeScript
RUN npm run build

# Production Stage (smaller image)
FROM node:24-alpine AS production
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install production dependencies only
RUN npm ci --only=production

# Copy built files from builder
COPY --from=builder /usr/src/app/dist ./dist
# Compiled JS expects relative path ../../generated to exist in dist/
COPY --from=builder /usr/src/app/src/generated ./dist/generated

# Expose port
EXPOSE 3000

# Start app
CMD ["node", "dist/server.js"]