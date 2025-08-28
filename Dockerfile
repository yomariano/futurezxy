# Dockerfile for FutureZXY React App
# This builds the React app from the react-app subdirectory

FROM node:18-alpine AS builder

LABEL description="Build stage for FutureZXY React app"

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache git python3 make g++ curl

# Copy package files from react-app directory  
COPY react-app/package-node18.json ./package.json

# Install dependencies (including dev dependencies for build)
RUN npm install

# Copy react-app source code
COPY react-app/ .

# Build the application (skip TypeScript checks for now)
RUN npx vite build --mode production && \
    echo "Build complete, checking output:" && \
    ls -la /app/dist/

# Production stage - Using Node with serve for better Coolify compatibility
FROM node:18-alpine

LABEL description="Production stage for FutureZXY React app"

WORKDIR /app

# Install serve globally
RUN npm install -g serve

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

# List copied files for debugging
RUN echo "Files in dist directory:" && ls -la /app/dist/

# Use port 3000 which Coolify handles better
EXPOSE 3000

# Health check on port 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

# Start serve on port 3000 with SPA mode
CMD ["serve", "-s", "dist", "-l", "3000"]