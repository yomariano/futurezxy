# Coolify Environment Variables Configuration

## Copy-Paste Ready Environment Variables

### Minimum Required Variables
```
VITE_API_URL=https://api.signalstrading.app
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
VITE_ONESIGNAL_APP_ID=your-onesignal-app-id
```

### Full Production Configuration
```
# Core API
VITE_API_URL=https://api.signalstrading.app

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Stripe (Publishable Key Only)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_51234567890...

# OneSignal Push Notifications
VITE_ONESIGNAL_APP_ID=12345678-1234-1234-1234-123456789012

# App Branding
VITE_APP_NAME=FutureZXY
VITE_APP_DESCRIPTION=Trading Signals Platform
VITE_APP_VERSION=1.0.0

# Feature Toggles
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_NOTIFICATIONS=true
VITE_ENABLE_CHAT=true
VITE_DEBUG_MODE=false
```

## How to Add in Coolify

### Step 1: Access Environment Variables
1. Go to your application in Coolify
2. Click on "Configuration" or "Environment" tab
3. Look for "Environment Variables" section

### Step 2: Add Variables
For each variable above:
1. Click "Add Variable" or "+"
2. **Key**: `VITE_API_URL`
3. **Value**: `https://api.signalstrading.app`
4. Click "Save" or "Add"

### Step 3: Deploy
After adding all variables:
1. Click "Deploy" button
2. The build process will embed these variables
3. Variables are available as `import.meta.env.VITE_*`

## Where to Get These Values

### VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to Settings → API
4. Copy "Project URL" and "anon public" key

### VITE_STRIPE_PUBLISHABLE_KEY
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Go to Developers → API keys
3. Copy "Publishable key" (starts with `pk_`)
4. **Never use Secret key in frontend!**

### VITE_ONESIGNAL_APP_ID
1. Go to [OneSignal Dashboard](https://onesignal.com)
2. Select your app
3. Go to Settings → Keys & IDs
4. Copy "OneSignal App ID"

## Validation

### Check Variables Are Set
In your app, you can verify:
```javascript
console.log('API URL:', import.meta.env.VITE_API_URL)
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL)
```

### Build-time Verification
Variables are embedded during build. Check build logs for:
```
✓ Environment variables loaded successfully
```

## Troubleshooting

### Variables Not Working
- ✅ Ensure they start with `VITE_`
- ✅ Redeploy after adding variables
- ✅ Check for typos in variable names
- ✅ Values should not be wrapped in quotes in Coolify

### Build Failures
- Check if required variables are missing
- Ensure Supabase/Stripe keys are valid
- Look for error messages in build logs

### Runtime Errors
- Variables are embedded at build time
- Changes require rebuild/redeploy
- Check browser console for undefined values

## Optional Variables for Enhanced Features

```
# Firebase (if migrating from Firebase)
VITE_FIREBASE_API_KEY=AIzaSyC...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id

# Analytics
VITE_GOOGLE_ANALYTICS_ID=GA-XXXXXXXXX

# Error Tracking
VITE_SENTRY_DSN=https://...@sentry.io/...
```