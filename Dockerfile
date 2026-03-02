# ===============================================================================
# MCP SERVER DOCKERFILE
# ===============================================================================
#
# Multi-stage Dockerfile for building and running the Russian Law MCP server.
#
# IMPORTANT: The database must be pre-built BEFORE running docker build.
# It is NOT built during the Docker build because the DB includes ingested
# data that requires network access to pravo.gov.ru.
#
# Build:
#   npm run build
#   docker build -t russian-law-mcp .
#
# ===============================================================================

# -------------------------------------------------------------------------------
# STAGE 1: BUILD
# -------------------------------------------------------------------------------
# Compiles TypeScript to JavaScript
# -------------------------------------------------------------------------------

FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first (for better caching)
COPY package*.json ./

# Install ALL dependencies (including dev)
# --ignore-scripts prevents postinstall from running
RUN npm ci --ignore-scripts

# Copy TypeScript config and source
COPY tsconfig.json ./
COPY src ./src

# Compile TypeScript
RUN npm run build

# -------------------------------------------------------------------------------
# STAGE 2: PRODUCTION
# -------------------------------------------------------------------------------
# Minimal image with only production dependencies
# -------------------------------------------------------------------------------

FROM node:20-alpine AS production

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy compiled JavaScript from builder stage
COPY --from=builder /app/dist ./dist

# Copy pre-built database
# This file MUST exist — run ingestion first
COPY data/database.db ./data/database.db

# -------------------------------------------------------------------------------
# SECURITY
# -------------------------------------------------------------------------------
# Create and use non-root user
# -------------------------------------------------------------------------------

RUN addgroup -S nodejs && adduser -S nodejs -G nodejs \
 && chown -R nodejs:nodejs /app/data
USER nodejs

# -------------------------------------------------------------------------------
# ENVIRONMENT
# -------------------------------------------------------------------------------

# Production mode
ENV NODE_ENV=production

# Database path (matches the COPY destination above)
ENV RUSSIAN_LAW_DB_PATH=/app/data/database.db

# -------------------------------------------------------------------------------
# ENTRY POINT
# -------------------------------------------------------------------------------
# MCP servers use stdio, so we run node directly
# -------------------------------------------------------------------------------

CMD ["node", "dist/http-server.js"]
