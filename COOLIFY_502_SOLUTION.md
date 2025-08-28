# Coolify 502 Error - Complete Solution

The 502 error happens because Coolify's proxy can't connect to your container. I've changed the approach to use Node.js with `serve` instead of nginx, which works better with Coolify.

## What Changed:

1. **Switched from nginx to Node.js serve** (port 3000)
   - Coolify handles Node apps better than nginx
   - Port 3000 is more standard for Node apps

2. **Updated all port references to 3000**
   - Dockerfile now exposes port 3000
   - coolify.json updated to use port 3000
   - Health check on port 3000

## In Coolify Dashboard:

### 1. Update Port Settings:
- Go to your application settings
- Change "Port" from 80 to **3000**
- Change "Exposed Port" to **3000**
- Save changes

### 2. Environment Variables (if needed):
```
PORT=3000
HOST=0.0.0.0
```

### 3. Build Pack:
- Make sure it's set to "Dockerfile"
- NOT "Nixpacks" or "Docker Compose"

### 4. Redeploy:
- Click "Redeploy" to use the new configuration

## Why This Works:

1. **Node.js serve** is more compatible with Coolify's proxy
2. **Port 3000** is standard for Node apps and Coolify expects it
3. **Simpler stack** - no nginx complexity
4. **Better logging** - serve provides clearer output

## If You Still Get 502:

### Option 1: Use Dockerfile.coolify
```bash
# Rename to use the alternative Dockerfile
mv Dockerfile Dockerfile.backup
mv Dockerfile.coolify Dockerfile
```

### Option 2: Check Container Logs
In Coolify, go to "Logs" and look for:
- "Accepting connections at http://localhost:3000"
- Any error messages

### Option 3: Manual Port Configuration
In Coolify's Advanced Settings, add:
- Port mapping: `3000:3000`
- Or in "Ports" field: `3000`

### Option 4: Check Network
Ensure the container is on the correct network:
- Should be on Coolify's default network
- Check "Network" setting in Coolify

## Files Created:

- **Dockerfile** - Updated to use Node.js serve on port 3000
- **Dockerfile.coolify** - Backup simplified version
- **Dockerfile.nginx-alternative** - Alternative nginx config if needed
- **coolify.json** - Port configuration for Coolify
- **.env.coolify** - Environment variables for port binding

The app should now be accessible at https://reactv2.signalstrading.app after redeployment.