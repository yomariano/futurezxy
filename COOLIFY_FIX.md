# Coolify Deployment Fix Guide

## 🔧 **Two Options to Fix the Deployment**

### **Option 1: Use Root Directory Setting (Recommended)**
1. In Coolify → Application → **Configuration**
2. Set **Root Directory**: `react-app`
3. Set **Build Pack**: `Dockerfile`
4. Set **Dockerfile Path**: `./Dockerfile`
5. **Deploy**

### **Option 2: Use Root Dockerfile (Fallback)**
If Option 1 doesn't work:
1. Keep **Root Directory**: empty (root)
2. Set **Build Pack**: `Dockerfile`  
3. Set **Dockerfile Path**: `./Dockerfile` (uses the root-level Dockerfile)
4. **Deploy**

## 🎯 **Correct Settings Summary**

**Application Settings:**
```
Name: futurezxy-react-app
Build Pack: Dockerfile
Root Directory: react-app  (Option 1) OR empty (Option 2)
Dockerfile Path: ./Dockerfile
Port: 80
Domain: reactv2.signalstrading.app
HTTPS: Enabled
```

**Environment Variables:**
```
VITE_API_URL=https://api.signalstrading.app
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_key
VITE_ONESIGNAL_APP_ID=your_app_id
```

## 🚨 **Why the Previous Deploy Failed**

1. **Auto-detection issue**: Coolify detected it as Next.js instead of React
2. **Wrong directory**: Built from root instead of `react-app/`
3. **Missing dependencies**: `react-router-dom` not in root package.json

## ✅ **What's Fixed**

1. **Root Dockerfile**: Builds from `react-app/` subdirectory
2. **Node 18 compatibility**: Uses `package-node18.json`
3. **Nginx setup**: Proper SPA routing with `try_files`
4. **Multi-stage build**: Optimized production image

## 🔄 **Next Steps**

1. Update Coolify settings as above
2. **Deploy** again
3. Check build logs for success
4. Visit https://reactv2.signalstrading.app

The deployment should now work! 🚀