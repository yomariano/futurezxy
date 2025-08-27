# Multi-stage build for React app
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache git python3 make g++

# Copy package files for Node 18 compatibility
COPY package-node18.json ./package.json

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage with nginx
FROM nginx:alpine

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration for SPA
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    \
    # Handle client-side routing \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    \
    # Cache static assets \
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ { \
        expires 1y; \
        add_header Cache-Control "public, immutable"; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]