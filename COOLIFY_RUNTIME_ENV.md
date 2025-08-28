# Coolify Runtime Environment Variables Solution

## What Changed:

We've switched from build-time to **runtime** environment variable injection. This means:
- Environment variables are injected when the container starts
- No need for "Build Arguments" checkbox
- Variables can be changed without rebuilding

## How It Works:

1. **config.js** - Contains placeholders for environment variables
2. **entrypoint.sh** - Replaces placeholders with actual values at container startup
3. **Supabase client** - Reads from window.ENV (runtime) or import.meta.env (fallback)

## In Coolify Dashboard:

### 1. Environment Variables Section
Add these as regular environment variables (NOT build arguments):
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_API_URL=https://api.signalstrading.app
VITE_OPENBB_API_KEY=your_openbb_key_here
```

### 2. Do NOT Check "Build Arguments"
- These are now runtime variables
- Leave "Build Arguments" unchecked

### 3. Redeploy
- Just click "Redeploy" (no need for force rebuild)

## Verification:

After deployment, check browser console:
1. Open Developer Tools (F12)
2. Go to Console
3. Type: `window.ENV`
4. You should see your actual environment values

## How Runtime Injection Works:

1. Container starts
2. entrypoint.sh runs
3. Replaces `__VITE_SUPABASE_URL__` with actual value
4. Starts the serve process
5. Browser loads config.js with real values

## Benefits:

- ✅ Change env vars without rebuilding
- ✅ Faster deployments
- ✅ Works with Coolify's standard env var system
- ✅ No build-time configuration needed

## Debugging:

If still seeing errors:
1. Check container logs for "Environment variables injected"
2. In browser, check: `window.ENV`
3. Verify values aren't placeholders (starting/ending with __)

## Files Modified:

- **entrypoint.sh** - Runtime injection script
- **public/config.js** - Placeholder file
- **index.html** - Loads config.js
- **supabaseClient.ts** - Uses runtime config
- **Dockerfile** - Uses entrypoint script