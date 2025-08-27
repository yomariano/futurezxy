# Coolify Deployment Guide

## Prerequisites
- Coolify instance running on server
- DNS record for `reactv2.signalstrading.app` pointing to server

## Deployment Steps in Coolify

### 1. Access Coolify Dashboard
- Navigate to your Coolify instance at `http://your-server:8000`
- Login to your Coolify dashboard

### 2. Create New Resource
1. Go to "Projects" → Select "futurezxy" project (or create if doesn't exist)
2. Click "New Resource" 
3. Select "Application"

### 3. Configure Application
**Basic Settings:**
- **Name**: `futurezxy-react-app`
- **Description**: `React frontend for FutureZXY trading application`

**Source Configuration:**
- **Source Type**: Git Repository
- **Repository**: `https://github.com/yomariano/futurezxy.git`
- **Branch**: `feature/react`
- **Root Directory**: `react-app`

**Build Configuration:**
- **Build Pack**: Dockerfile
- **Dockerfile**: `./Dockerfile` (uses our custom multi-stage build)
- **Build Command**: (leave empty, handled by Dockerfile)
- **Start Command**: (leave empty, handled by Dockerfile)

**Network Configuration:**
- **Port**: `80`
- **Domain**: `reactv2.signalstrading.app`
- **HTTPS**: Enable (Let's Encrypt)

### 4. Environment Variables
Add these environment variables if needed:
```
NODE_ENV=production
VITE_API_URL=https://api.signalstrading.app
```

### 5. Deploy
1. Click "Deploy" button
2. Monitor build logs
3. Wait for deployment to complete

## Build Process
The Dockerfile uses a multi-stage build:
1. **Builder stage**: Installs dependencies and builds React app
2. **Production stage**: Serves built files with Nginx

## Troubleshooting

### If Build Fails
1. Check build logs in Coolify
2. Ensure Node.js 18 compatibility
3. Verify all dependencies are compatible

### If App Doesn't Load
1. Check that port 80 is exposed
2. Verify domain DNS is pointing to server
3. Check Nginx configuration for SPA routing

### Common Issues
- **Build timeout**: Increase build timeout in Coolify settings
- **Memory issues**: Increase build memory allocation
- **Dependency conflicts**: Use the `package-node18.json` for compatibility

## Manual Build Test
To test the build locally:
```bash
cd react-app
docker build -t futurezxy-react .
docker run -p 3000:80 futurezxy-react
```

## Production URLs
- **Frontend**: https://reactv2.signalstrading.app
- **API**: https://api.signalstrading.app (existing)