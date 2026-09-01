# ===================================================
# Multi-stage Dockerfile for iChatWorld (Full-Stack)
# Node.js + Express + Socket.io + Vite React
# ===================================================

# --- 1. Build Stage ---
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root & package definitions
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY server/ ./server/
COPY client/ ./client/

# Build both server (TypeScript) and client (Vite)
RUN npm run build

# --- 2. Production Runner Stage ---
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Copy package files for production dependency install
COPY package*.json ./
COPY server/package*.json ./server/

# Install only production server dependencies
RUN npm ci --omit=dev --workspace=server

# Copy built dist artifacts from builder
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/client/dist ./client/dist

# Expose port (default 3001)
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health || exit 1

# Start the unified Node.js WebSocket & HTTP server
CMD ["node", "server/dist/server.js"]
