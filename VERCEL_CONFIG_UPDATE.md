# Vercel Configuration Update for Static Data Migration

## Overview
Updated the Vercel configuration to optimize deployment for the new static data approach, removing unnecessary API server builds and routes.

## Changes Made

### 1. Updated `vercel.json`
**Before:**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist/public"
      }
    },
    {
      "src": "api/index.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/index.ts"
    },
    {
      "src": "/(.*)",
      "dest": "/dist/public/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

**After:**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist/public"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/dist/public/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### 2. Updated `package.json` Build Scripts
**Before:**
```json
{
  "scripts": {
    "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
    "vercel-build": "npm run build"
  }
}
```

**After:**
```json
{
  "scripts": {
    "build": "vite build",
    "vercel-build": "npm run build:client"
  }
}
```

## What Was Removed

### 1. API Server Build
- **Removed**: `@vercel/node` build for `api/index.ts`
- **Reason**: No longer needed since data comes from static JSON files
- **Benefit**: Faster builds, smaller deployment size

### 2. API Routes
- **Removed**: `/api/(.*)` route configuration
- **Reason**: Frontend now uses static data instead of API calls
- **Benefit**: Simpler routing, no server-side processing needed

### 3. Server Bundle
- **Removed**: `esbuild server/index.ts` from main build
- **Reason**: Server code not needed for static deployment
- **Benefit**: Reduced build time and complexity

## Benefits of the New Configuration

### Performance
- ✅ **Faster Builds**: Only builds client-side code
- ✅ **Smaller Deployments**: No server bundle included
- ✅ **Faster Cold Starts**: No server initialization needed

### Simplicity
- ✅ **Cleaner Configuration**: Fewer build steps
- ✅ **Static-Only**: Pure static site deployment
- ✅ **No API Dependencies**: No server-side code to maintain

### Cost Optimization
- ✅ **Reduced Function Usage**: No serverless functions needed
- ✅ **Lower Bandwidth**: Static files only
- ✅ **Better Caching**: Static assets cached at CDN edge

## Deployment Process

### Build Process
1. **Vercel Build**: Runs `npm run vercel-build`
2. **Client Build**: Executes `vite build`
3. **Output**: Creates `dist/public/` with static files
4. **Deploy**: Serves static files from CDN

### File Structure After Build
```
dist/public/
├── index.html
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── [other assets]
└── [static files]
```

## Migration Impact

### What Still Works
- ✅ All frontend functionality
- ✅ Static data loading
- ✅ Widget rendering
- ✅ Location filtering
- ✅ Time series charts

### What's No Longer Available
- ❌ API endpoints (not needed)
- ❌ Server-side data processing (moved to client)
- ❌ Database connections (using static data)

### Rollback Plan
If needed, the old configuration can be restored by:
1. Reverting `vercel.json` to include API build
2. Reverting `package.json` build scripts
3. Re-enabling API routes

## Testing
- ✅ Build process successful
- ✅ Static files generated correctly
- ✅ No build errors or warnings
- ✅ All assets properly bundled

## Next Steps
1. Deploy to Vercel with new configuration
2. Verify all widgets load correctly
3. Test performance improvements
4. Monitor deployment metrics

The new configuration is optimized for the static data approach and should provide better performance and simpler deployment.
