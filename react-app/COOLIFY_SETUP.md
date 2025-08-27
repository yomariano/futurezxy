# Coolify Setup Guide for ReactV2.signalstrading.app

## Quick Setup Instructions

### Step 1: Access Coolify
1. Open browser and go to your Coolify instance (likely at port 8000)
2. Login with your Coolify credentials

### Step 2: Create New Application
1. Navigate to your **futurezxy** project (or create it if it doesn't exist)
2. Click **"+ New Resource"**
3. Select **"Application"**

### Step 3: Configure Git Source
**Repository Settings:**
```
Source Type: Git Repository
Repository URL: https://github.com/yomariano/futurezxy.git
Branch: feature/react
Root Directory: react-app
```

### Step 4: Application Settings
**Basic Configuration:**
```
Name: futurezxy-react-frontend
Description: React frontend for FutureZXY trading app
```

**Build Settings:**
```
Build Pack: Dockerfile
Dockerfile Path: ./Dockerfile
Port: 80
```

### Step 5: Domain Configuration
**Domain Settings:**
```
Domain: reactv2.signalstrading.app
HTTPS: Enabled (Let's Encrypt)
Force HTTPS: Yes
```

### Step 6: Environment Variables (Optional)
Add these if your app needs them:
```
NODE_ENV=production
VITE_API_URL=https://api.signalstrading.app
```

### Step 7: Deploy
1. Click **"Deploy"** button
2. Monitor build progress in the logs
3. Wait for "Deployment successful" message

## DNS Configuration Required

Before deployment, ensure DNS is configured:
```
Type: A Record
Name: reactv2.signalstrading.app
Value: [Your Server IP]
TTL: 300 (or Auto)
```

## Expected Build Process
1. **Clone**: Coolify clones the `feature/react` branch
2. **Build**: Docker builds the React app using multi-stage build
3. **Deploy**: Nginx serves the static files
4. **SSL**: Let's Encrypt automatically provisions SSL certificate

## Verification Steps
After deployment:
1. Visit https://reactv2.signalstrading.app
2. Verify the React app loads
3. Check browser developer tools for any errors
4. Test navigation between pages

## Troubleshooting

### Build Fails
- Check the build logs in Coolify dashboard
- Ensure the `feature/react` branch exists and is pushed
- Verify Dockerfile syntax

### Domain Issues
- Confirm DNS propagation: `nslookup reactv2.signalstrading.app`
- Check domain configuration in Coolify
- Verify SSL certificate generation

### App Not Loading
- Check if container is running in Coolify
- Verify port 80 is exposed
- Check Nginx configuration

## Resource Requirements
- **Memory**: ~1GB during build, ~128MB runtime
- **CPU**: Moderate during build, minimal runtime
- **Storage**: ~500MB for build cache and static files

## Auto-Deploy Setup (Optional)
To enable automatic deployments on git push:
1. Go to application settings in Coolify
2. Enable "Auto Deploy"
3. Configure webhook in GitHub repository settings

## Monitoring
Monitor your deployment:
- **Coolify Dashboard**: Real-time container status
- **Logs**: Access via Coolify logs section
- **Metrics**: CPU, Memory, Network usage

---

**Next Steps After Deployment:**
1. Test all application features
2. Configure monitoring/alerting
3. Set up backup strategies
4. Update DNS if everything works correctly