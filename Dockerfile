# Build Stage
FROM node:24-alpine AS builder

WORKDIR /app

# Copy root and workspace package definitions
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/

# Install dependencies for root, frontend, and backend
RUN npm ci && cd frontend && npm ci && cd ../backend && npm ci && cd ..

# Copy application sources
COPY . .

# Build both frontend and backend
RUN npm run build

# Production Stage
FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV ASKMYPDF_DB_PATH=/app/data/askmypdf.db

# Copy package files for backend production
COPY backend/package*.json ./
RUN npm ci --omit=dev

# Copy compiled backend bundle and frontend static distribution
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/frontend/dist ./frontend-dist

# Create volume mount directory for persistent SQLite database
RUN mkdir -p /app/data && chown -R node:node /app

USER node

EXPOSE 3000

VOLUME ["/app/data"]

CMD ["node", "dist/server.cjs"]
