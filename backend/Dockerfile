# ---- Build Stage ----
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files and install ALL dependencies (including dev)
COPY package*.json ./
RUN npm install

# Copy Prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy the rest of the source code
COPY . .

# Build TypeScript (now with all type definitions available)
RUN npm run build

# ---- Production Stage ----
FROM node:20-alpine
WORKDIR /app

# Copy only production dependencies from builder (optional, but keeps image smaller)
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production

# Copy compiled output
COPY --from=builder /app/dist ./dist
# If you need Prisma client at runtime (e.g., for migrations), copy the generated client
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
# Also copy prisma folder if you run migrations in production
COPY --from=builder /app/prisma ./prisma

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

CMD ["node", "dist/server.js"]
