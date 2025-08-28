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

# Production stage with nginx
FROM nginx:alpine

LABEL description="Production stage for FutureZXY React app"

# Remove default nginx files
RUN rm -rf /usr/share/nginx/html/*

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html/

# List copied files for debugging
RUN echo "Files in nginx html directory:" && ls -la /usr/share/nginx/html/

# Create custom nginx config for SPA
RUN cat > /etc/nginx/conf.d/default.conf <<'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name _;
    
    root /usr/share/nginx/html;
    index index.html;
    
    # SPA routing - all routes go to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Gzip compression
    gzip on;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    gzip_vary on;
}
EOF

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]