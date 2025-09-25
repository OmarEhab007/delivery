# syntax=docker/dockerfile:1

# Stage 1 - install only production dependencies
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Stage 2 - runtime image
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Install curl for container healthchecks
RUN apk add --no-cache curl

# Copy production dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy application sources with secure ownership
COPY --chown=node:node package*.json ./
COPY --chown=node:node src ./src
COPY --chown=node:node docs ./docs
COPY --chown=node:node env.sample ./env.sample

# Ensure runtime directories exist with proper ownership
RUN mkdir -p uploads logs && \
    chown -R node:node /app

USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 CMD curl -fsS http://localhost:${PORT}/health || exit 1
CMD ["node", "src/server.js"]
