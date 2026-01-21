# Vercel Serverless Migration Guide

## 🎯 Problem Solved

**Original Error:** `FUNCTION_INVOCATION_FAILED`

**Root Cause:** Attempting to deploy a full Express.js server (`server/index.ts`) as a Vercel serverless function. Express servers expect to run continuously, but Vercel functions are stateless, short-lived request handlers.

**Solution:** Migrated to Vercel's serverless function architecture using the `/api` directory pattern.

---

## 📁 New Architecture

### Before (Broken)
```
├── server/index.ts          ← Full Express server (incompatible with Vercel)
├── vercel.json              ← Routes all requests to Express server
└── api/                     ← Unused serverless functions
```

### After (Working)
```
├── api/                     ← Serverless functions (Vercel native)
│   ├── auth/
│   │   ├── login.ts
│   │   ├── logout.ts
│   │   └── me.ts
│   ├── dashboard/
│   │   └── customization.ts
│   ├── users/
│   │   ├── index.ts
│   │   └── [username].ts
│   ├── locations.ts
│   ├── health.ts
│   └── analytics.ts
├── dist/public/             ← Static frontend files
└── vercel.json              ← Routes static files + API functions
```

---

## 🔧 Configuration Changes

### `vercel.json` (Updated)
```json
{
  "version": 2,
  "buildCommand": "npm run build:client",
  "outputDirectory": "dist/public",
  "routes": [
    {
      "src": "/assets/(.*)",
      "dest": "/assets/$1"
    },
    {
      "handle": "filesystem"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

**What this does:**
- Builds only the static frontend (`npm run build:client`)
- Serves static files from `dist/public/`
- Routes `/api/*` automatically to serverless functions in `/api` directory
- Falls back to `index.html` for client-side routing

---

## 🔐 API Endpoints Created

### Authentication Endpoints

#### `POST /api/auth/login`
- **Purpose:** Authenticate user and return user configuration
- **Body:** `{ username: string, password: string }`
- **Response:** User object (without password)
- **Status Codes:**
  - `200` - Success
  - `400` - Missing credentials
  - `401` - Invalid credentials
  - `500` - Server error

**Default Credentials:**
- Username: `admin`
- Password: `admin123`

#### `POST /api/auth/logout`
- **Purpose:** Clear user session
- **Response:** `{ message: "Logged out successfully" }`

#### `GET /api/auth/me`
- **Purpose:** Get current authenticated user
- **Response:** User object or 401 if not authenticated

---

### User Management Endpoints

#### `GET /api/users`
- **Purpose:** List all users (admin only)
- **Response:** Array of user objects (without passwords)

#### `POST /api/users`
- **Purpose:** Create new user (admin only)
- **Body:** User object with `username` and `password` required
- **Response:** Created user object (201)

#### `GET /api/users/[username]`
- **Purpose:** Get specific user details
- **Response:** User object

#### `PUT /api/users/[username]`
- **Purpose:** Update user configuration
- **Body:** Partial user object with fields to update
- **Response:** Updated user object

#### `DELETE /api/users/[username]`
- **Purpose:** Delete user (cannot delete admin)
- **Response:** `{ message: "User deleted successfully" }`

---

### Dashboard Endpoints

#### `GET /api/dashboard/customization`
- **Purpose:** Get dashboard customization settings
- **Response:** Configuration object with logo, practice name, titles, etc.

#### `PUT /api/dashboard/customization`
- **Purpose:** Update dashboard settings
- **Body:** Partial configuration object
- **Response:** Updated configuration

#### `POST /api/dashboard/customization/upload-image`
- **Purpose:** Upload custom logo/photo
- **Status:** Not yet implemented (returns 501)
- **Note:** Use Vercel Blob Storage or similar service in production

---

### Data Endpoints

#### `GET /api/locations`
- **Purpose:** Get all practice locations
- **Response:** Array of location objects

#### `GET /api/health`
- **Purpose:** Health check endpoint
- **Response:** `{ status: "healthy", timestamp, service, environment }`

#### `GET /api/analytics.ts`
- **Purpose:** Placeholder for analytics endpoints
- **Note:** Most analytics data comes from embedded data via `dataService`

---

## 🚀 Deployment Process

### 1. Build Locally (Test)
```bash
npm run build:client
```

This creates `dist/public/` with your static frontend.

### 2. Deploy to Vercel
```bash
vercel deploy
```

Or push to GitHub if connected to Vercel.

### 3. Set Environment Variables
In Vercel Dashboard → Settings → Environment Variables:
- `NODE_ENV=production`
- `SESSION_SECRET=your-secret-key-here`
- `OPENAI_API_KEY=your-openai-key-here` (if using AI features)

---

## 🔄 Data Flow Architecture

### Static Data (Embedded)
Most data queries use the embedded data service:

```
Frontend Component
  ↓
TanStack Query (queryClient.ts)
  ↓
dataService.ts (embedded data)
  ↓
Static JSON files
```

**Routes using embedded data:**
- `/api/analytics/key-metrics/*`
- `/api/financial/revenue/*`
- `/api/financial/expenses/*`
- `/api/financial/cashflow/*`
- `/api/analytics/revenue-trends/*`
- `/api/analytics/ar-buckets/*`
- All other analytics endpoints

### Dynamic Data (Serverless APIs)
Authentication and user management use serverless functions:

```
Frontend
  ↓
fetch('/api/auth/login')
  ↓
Vercel Serverless Function
  ↓
In-memory user store (or database in production)
```

---

## ⚠️ Known Limitations

### 1. **No Persistent State**
Serverless functions don't maintain state between requests.

**Impact:** User data resets on every deployment.

**Solution for Production:** 
- Connect to a database (PostgreSQL, MongoDB, etc.)
- Use Vercel KV for simple key-value storage
- Use Vercel Postgres for relational data

### 2. **No Session Management**
Current implementation doesn't have true sessions.

**Impact:** Users need to log in on each page refresh.

**Solution for Production:**
- Implement JWT tokens
- Use Vercel Edge Config for session storage
- Use third-party auth (Auth0, Clerk, NextAuth)

### 3. **No File Uploads**
Image upload endpoint not implemented.

**Impact:** Cannot upload custom logos/photos.

**Solution for Production:**
- Use Vercel Blob Storage
- Use AWS S3
- Use Cloudinary for images

### 4. **Cold Starts**
First request after inactivity may be slow (1-3 seconds).

**Impact:** Occasional slow login/API calls.

**Solution:** 
- Keep functions warm with monitoring
- Upgrade to Vercel Pro (faster cold starts)
- Optimize function bundle size

---

## 🎓 Key Learnings

### What NOT to Do in Vercel Functions

❌ **Don't use `app.listen()` or `server.listen()`**
```typescript
// BAD - This doesn't work in serverless
const server = app.listen(5000);
```

❌ **Don't use persistent timers**
```typescript
// BAD - Function terminates after response
setInterval(() => { ... }, 60000);
```

❌ **Don't expect filesystem writes to persist**
```typescript
// BAD - Filesystem is ephemeral
fs.writeFileSync('data.json', data);
```

❌ **Don't maintain connection pools**
```typescript
// BAD - Connections don't persist
const pool = new Pool({ max: 20 });
```

### What TO Do in Vercel Functions

✅ **Export a default handler function**
```typescript
// GOOD - Vercel native pattern
export default function handler(req: VercelRequest, res: VercelResponse) {
  return res.json({ data: 'hello' });
}
```

✅ **Keep functions lightweight**
```typescript
// GOOD - Quick to start, fast to execute
export default async function handler(req, res) {
  const data = await quickQuery();
  return res.json(data);
}
```

✅ **Use environment variables**
```typescript
// GOOD - Configure via Vercel dashboard
const apiKey = process.env.OPENAI_API_KEY;
```

✅ **Connect to databases per-request**
```typescript
// GOOD - Create connection, use it, close it
const client = new Client(process.env.DATABASE_URL);
await client.connect();
// ... do work ...
await client.end();
```

---

## 🐛 Troubleshooting

### Error: "405 Method Not Allowed"
**Cause:** Function doesn't handle the HTTP method you're using.

**Fix:** Check that your handler supports the method:
```typescript
if (req.method !== 'POST') {
  return res.status(405).json({ message: 'Use POST' });
}
```

### Error: "Unexpected end of JSON input"
**Cause:** Empty response body or response not JSON.

**Fix:** Always return JSON:
```typescript
return res.status(200).json({ message: 'Success' });
```

### Error: "Function timeout"
**Cause:** Function taking too long (>10s on Hobby plan).

**Fix:**
- Optimize queries
- Reduce computation
- Upgrade Vercel plan (60s timeout on Pro)

### Error: "Module not found"
**Cause:** Importing server-only modules in API functions.

**Fix:** Only import what's available in Node.js runtime:
- ✅ Built-in modules (`fs`, `path`, `crypto`)
- ✅ Dependencies in `package.json`
- ❌ Your `/server` directory code

---

## 📊 Performance Comparison

| Metric | Express Server | Vercel Serverless |
|--------|---------------|-------------------|
| Cold Start | N/A (always running) | 1-3 seconds |
| Warm Response | 50-200ms | 50-200ms |
| Scaling | Manual | Automatic |
| Cost | Fixed (server always on) | Pay-per-use |
| Deployment | Complex (Docker/PM2) | One command |
| CDN | Need separate setup | Built-in |

---

## 🔮 Future Improvements

### Short-term (1-2 weeks)
- [ ] Add database connection (Vercel Postgres)
- [ ] Implement JWT authentication
- [ ] Add request validation with Zod
- [ ] Enable image upload with Vercel Blob

### Medium-term (1 month)
- [ ] Add rate limiting
- [ ] Implement audit logging
- [ ] Add API documentation (Swagger/OpenAPI)
- [ ] Set up monitoring (Sentry)

### Long-term (3+ months)
- [ ] Migrate to Next.js for better DX
- [ ] Add real-time features with Pusher
- [ ] Implement multi-tenancy
- [ ] Add automated testing for API

---

## 📚 Additional Resources

- [Vercel Serverless Functions Docs](https://vercel.com/docs/functions)
- [Vercel Edge Functions](https://vercel.com/docs/functions/edge-functions)
- [Vercel Blob Storage](https://vercel.com/docs/storage/vercel-blob)
- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
- [TanStack Query Docs](https://tanstack.com/query/latest)

---

## ✅ Deployment Checklist

Before deploying to production:

- [x] Updated `vercel.json` to serverless architecture
- [x] Created all necessary API endpoints
- [x] Tested authentication flow
- [x] Verified static file serving
- [ ] Set environment variables in Vercel dashboard
- [ ] Test deployment with `vercel --prod`
- [ ] Connect to real database (optional but recommended)
- [ ] Set up error monitoring (Sentry, LogRocket)
- [ ] Configure custom domain (if needed)
- [ ] Enable analytics (Vercel Analytics)

---

## 🆘 Getting Help

If you encounter issues:

1. Check Vercel deployment logs: `vercel logs`
2. Review browser console for frontend errors
3. Check Network tab for API response details
4. Verify environment variables are set correctly
5. Test API endpoints directly with Postman/curl

---

**Migration completed successfully! 🎉**

Your application now uses Vercel's native serverless architecture and should deploy without the `FUNCTION_INVOCATION_FAILED` error.

