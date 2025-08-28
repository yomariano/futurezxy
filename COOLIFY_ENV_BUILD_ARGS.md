# Coolify Environment Variables - Build Time Configuration

## IMPORTANT: Environment Variables Must Be Set at Build Time

Vite replaces `import.meta.env.VITE_*` variables during the build process. This means environment variables must be available when Docker builds your image, NOT when the container runs.

## In Coolify Dashboard:

### 1. Go to Environment Variables Section
Navigate to your application → Environment Variables

### 2. Add These Variables:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_API_URL=https://api.signalstrading.app
VITE_OPENBB_API_KEY=your_openbb_key_here
```

### 3. CRITICAL: Enable "Build Arguments"
- **Check the "Build Arguments" checkbox** for EACH variable
- This tells Coolify to pass these as Docker build args
- Without this, the variables won't be available during build

### 4. Docker Build Configuration
The Dockerfile is configured to:
1. Accept these as build arguments (ARG)
2. Set them as environment variables (ENV)
3. Use them during the Vite build process

### 5. Rebuild and Deploy
- After setting variables with "Build Arguments" enabled
- Click "Redeploy" to trigger a fresh build

## Why This Is Required:

1. **Static Builds**: React apps are built into static files
2. **Build-Time Replacement**: Vite replaces env vars during build, not runtime
3. **No Runtime Variables**: Once built, the app can't read new env vars

## Verification:

After deployment, check the browser console. If you still see "supabaseUrl is required", it means:
- Variables weren't set as build arguments
- Or the build cache needs to be cleared

## If Still Not Working:

### Option 1: Force Rebuild
In Coolify, use "Force Rebuild" option to clear cache

### Option 2: Check Build Logs
Look for these lines in build logs:
```
Step X/Y : ARG VITE_SUPABASE_URL
Step X/Y : ENV VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
```

### Option 3: Manual Build Command (if Coolify supports it)
```bash
docker build \
  --build-arg VITE_SUPABASE_URL=https://your-project.supabase.co \
  --build-arg VITE_SUPABASE_ANON_KEY=your_key \
  --build-arg VITE_API_URL=https://api.signalstrading.app \
  -t your-app .
```

## Current Setup:

The Dockerfile now includes:
```dockerfile
# Accept build arguments
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_API_URL
ARG VITE_OPENBB_API_KEY

# Set as environment variables for build
ENV VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
ENV VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_OPENBB_API_KEY=${VITE_OPENBB_API_KEY}

# Build with these variables available
RUN npx vite build --mode production
```

This ensures Vite can access the variables during build time.