# Complete Environment Variables for Coolify

## Runtime Environment Variables (Current Solution)

The app now uses **runtime injection** of environment variables, which means you can change them without rebuilding.

### Required Variables in Coolify:

Add these as regular environment variables (NOT build arguments):

```bash
# Required - Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Required - API Configuration  
VITE_API_URL=https://api.signalstrading.app
VITE_APP_URL=https://test.signalstrading.app

# Optional - Push Notifications
VITE_VAPID_PUBLIC_KEY=BDY9PUZxO1S3O9bJ7-nekjUIFcmQj2ViMYy6Gk30Kytfr4p3l5ii4g55YNqvyqqvvDS938raycn57HzhVinmcJc

# Optional - Additional Services
VITE_OPENBB_API_KEY=your_openbb_key_here
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_key_here
VITE_WS_URL=wss://your-websocket-url
```

### Default Values:

If not provided, these defaults are used:
- `VITE_VAPID_PUBLIC_KEY`: The key shown above (for push notifications)
- `VITE_APP_URL`: https://test.signalstrading.app

## How It Works:

1. **Container starts** → entrypoint.sh runs
2. **Environment variables injected** → Replaces placeholders in config.js
3. **App loads** → Reads from window.ENV
4. **No rebuild needed** → Just update env vars and restart container

## In Coolify Dashboard:

1. Go to **Environment Variables**
2. Add the variables above as regular env vars
3. **DO NOT** check "Build Arguments" 
4. Click **Redeploy**

## Verification:

After deployment, check in browser console:
```javascript
window.ENV
// Should show all your configured values
```

## Push Notification Setup:

For push notifications to work:
1. Set `VITE_VAPID_PUBLIC_KEY` (use the default above if you don't have one)
2. Set `VITE_APP_URL` to your actual domain
3. Ensure your API endpoints handle push subscription at `/api/notifications/subscribe`

## Troubleshooting:

### If variables aren't loading:
1. Check container logs for "Environment variables check:"
2. Verify config.js is being created/updated
3. Check browser console for `window.ENV`

### If push notifications fail:
1. Ensure VAPID key is set
2. Check API endpoint is accessible
3. Verify browser has notification permissions

## Benefits of Runtime Injection:

✅ Change variables without rebuilding  
✅ Faster deployments  
✅ Same Docker image for different environments  
✅ Easy debugging (check window.ENV)  

## Files Involved:

- `entrypoint.sh` - Injects variables at runtime
- `public/config.js` - Contains placeholders
- `src/lib/env.ts` - Centralized env access
- `index.html` - Loads config.js before app