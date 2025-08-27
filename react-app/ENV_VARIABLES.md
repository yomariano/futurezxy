# Environment Variables Guide

## Important Notes
- **Vite Prefix Required**: All environment variables must start with `VITE_` to be accessible in the React app
- **Client-Side Exposure**: All `VITE_` variables are exposed to the browser - never put secrets here
- **Build Time**: Environment variables are embedded at build time, not runtime

## Required Environment Variables

### 🔧 Core API Configuration
```bash
VITE_API_URL=https://api.signalstrading.app
```
- The base URL for your API backend
- This should point to your existing Next.js API or new backend

### 🔐 Supabase Configuration
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
- Get these from your Supabase project dashboard
- The anon key is safe to expose (it's public)

### 💳 Stripe Configuration
```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_51234567890abcdef...
```
- Use publishable key (starts with `pk_`)
- **Never use secret key** in frontend

### 📱 OneSignal (Push Notifications)
```bash
VITE_ONESIGNAL_APP_ID=12345678-1234-1234-1234-123456789012
```
- Get from OneSignal dashboard

## Optional Environment Variables

### 🔥 Firebase (if used)
```bash
VITE_FIREBASE_API_KEY=AIzaSyC123...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

### ⚙️ App Configuration
```bash
VITE_APP_NAME=FutureZXY
VITE_APP_VERSION=1.0.0
VITE_DEBUG_MODE=false
```

## Setting Up Environment Variables

### For Local Development
1. Copy `.env.example` to `.env.local`
2. Fill in your actual values
3. Restart your dev server

### For Coolify Deployment
In Coolify dashboard, add these environment variables:

**Required:**
```
VITE_API_URL=https://api.signalstrading.app
VITE_SUPABASE_URL=https://your-project.supabase.co  
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_key
VITE_ONESIGNAL_APP_ID=your_onesignal_app_id
```

**Optional:**
```
VITE_APP_NAME=FutureZXY
VITE_DEBUG_MODE=false
VITE_ENABLE_ANALYTICS=true
```

## Security Best Practices

### ✅ Safe to Include (Client-Side)
- API base URLs
- Supabase anon keys
- Stripe publishable keys
- OneSignal app IDs
- Firebase config (public values)
- Feature flags

### ❌ Never Include (Keep Secret)
- Database passwords
- Stripe secret keys
- Private API keys
- JWT secrets
- Service account keys

## Usage in Code

```typescript
// Access environment variables in your React components
const apiUrl = import.meta.env.VITE_API_URL
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL

// With default values
const debugMode = import.meta.env.VITE_DEBUG_MODE === 'true' || false
```

## Environment-Specific Configurations

### Development
```bash
VITE_API_URL=http://localhost:3001
VITE_DEBUG_MODE=true
VITE_LOG_LEVEL=debug
```

### Production
```bash
VITE_API_URL=https://api.signalstrading.app
VITE_DEBUG_MODE=false
VITE_LOG_LEVEL=error
```

## Troubleshooting

### Variables Not Loading
1. Ensure they start with `VITE_`
2. Restart development server
3. Check for typos in variable names

### Build Issues
1. Variables are embedded at build time
2. Changing variables requires rebuilding
3. Use build args for dynamic values

### In Coolify
1. Add variables in application settings
2. Redeploy after adding/changing variables
3. Check build logs for variable substitution