# Coolify 502 Error Fix

The 502 error occurs when Coolify's proxy (Traefik/Caddy) cannot connect to your container. Here's how to fix it:

## In Coolify Dashboard:

1. **Port Configuration:**
   - Go to your application settings
   - Set "Port" to: `80`
   - Set "Exposed Port" to: `80` (if available)
   - Save changes

2. **Network Configuration:**
   - Ensure the application is on the correct network
   - Check that "Network" is set to the default Coolify network

3. **Advanced Settings:**
   - Add these labels (if there's a labels section):
   ```
   traefik.http.services.YOUR_APP_NAME.loadbalancer.server.port=80
   traefik.http.routers.YOUR_APP_NAME.rule=Host(`reactv2.signalstrading.app`)
   ```

4. **Health Check:**
   - Path: `/`
   - Port: `80`
   - Interval: `30`
   - Timeout: `3`
   - Retries: `3`

5. **Build Pack:**
   - Ensure it's set to "Dockerfile"
   - NOT "Nixpacks" or "Docker Compose"

## Files Added to Fix the Issue:

1. **docker-compose.yml** - Contains proper Traefik labels
2. **coolify.json** - Explicitly sets port configuration
3. **Updated Dockerfile** - Improved nginx configuration

## If Still Getting 502:

1. **Check Container Logs in Coolify:**
   - Look for any nginx errors
   - Verify the container is running

2. **Check Proxy Labels:**
   - In Coolify, go to "Deployments" 
   - Click on the latest deployment
   - Check "Container Labels" to ensure Traefik labels are present

3. **Manual Port Mapping:**
   - In Coolify settings, try adding port mapping: `80:80`

4. **Restart Services:**
   - Redeploy the application
   - Or restart from Coolify dashboard

## Verification:

Once deployed, the healthcheck should show the container is healthy and you should be able to access:
- https://reactv2.signalstrading.app

The nginx server is configured to:
- Serve the React SPA from port 80
- Handle client-side routing (all routes go to index.html)
- Include proper caching and compression
- Add security headers