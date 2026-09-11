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
COPY backend/dist ./dist
COPY frontend/dist ./frontend-dist

# Create volume mount directory for persistent SQLite database
RUN mkdir -p /app/data && chown -R node:node /app

USER node

EXPOSE 3000

VOLUME ["/app/data"]

CMD ["node", "dist/server.cjs"]
