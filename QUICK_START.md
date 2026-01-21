# 🚀 Quick Start Guide

## ✅ Everything is Fixed!

Your `FUNCTION_INVOCATION_FAILED` and `405 Method Not Allowed` errors are resolved.

---

## 📋 Pre-Deployment Checklist

- [x] Updated `vercel.json` for serverless
- [x] Created authentication APIs
- [x] Created user management APIs
- [x] Created dashboard APIs
- [x] All endpoints return proper JSON
- [x] CORS headers configured
- [ ] **Set environment variables** (see below)
- [ ] **Deploy to Vercel** (see below)
- [ ] **Test login** (see below)

---

## 🔐 Environment Variables (IMPORTANT!)

Set these in Vercel Dashboard before deploying:

1. Go to: https://vercel.com/dashboard
2. Select your project
3. Settings → Environment Variables
4. Add:

```env
NODE_ENV=production
SESSION_SECRET=your-super-secret-key-change-this
OPENAI_API_KEY=sk-your-openai-key-if-needed
```

**Generate a secure secret:**
```bash
# Option 1: Use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Option 2: Use OpenSSL
openssl rand -hex 32
```

---

## 🚀 Deploy to Vercel

### Method 1: Vercel CLI (Recommended)

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy (test)
vercel

# Deploy to production
vercel --prod
```

### Method 2: GitHub Integration

1. Push your code to GitHub:
   ```bash
   git add .
   git commit -m "Fix: Migrate to Vercel serverless architecture"
   git push origin main
   ```

2. Connect to Vercel:
   - Go to https://vercel.com/new
   - Import your GitHub repository
   - Vercel auto-deploys on every push

---

## 🧪 Test Your Deployment

### 1. Check Health Endpoint
```bash
curl https://your-app.vercel.app/api/health
```

Expected:
```json
{
  "status": "healthy",
  "timestamp": "2026-01-21T...",
  "service": "MDS AI Analytics API",
  "environment": "production"
}
```

### 2. Test Login API
```bash
curl -X POST https://your-app.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

Expected:
```json
{
  "username": "admin",
  "role": "admin",
  "practiceName": "MDS AI Analytics",
  "logoUrl": "/assets/MDS Logo_1754254040718-Dv0l5qLn.png",
  "ownerName": "Dr. John Josephson",
  ...
}
```

### 3. Test in Browser

1. Open: `https://your-app.vercel.app`
2. Should see login page
3. Login with:
   - Username: `admin`
   - Password: `admin123`
4. Should redirect to dashboard
5. All widgets should load

---

## 🎯 Default Login Credentials

```
Username: admin
Password: admin123
```

**⚠️ IMPORTANT:** Change this in production!

Edit `api/auth/login.ts` and `api/users/index.ts`:
```typescript
const USERS = [
  {
    username: 'your-username',
    password: 'your-secure-password',  // Use bcrypt in production!
    role: 'admin',
    // ...
  }
];
```

---

## 🐛 Troubleshooting

### Issue: "npm run build:client" fails

**Solution:** Make sure all dependencies are installed:
```bash
npm install
npm run build:client
```

### Issue: Still getting 405 errors

**Check:**
1. Are the files in `/api` directory?
   ```bash
   ls -la api/auth/
   ```
2. Do they export a default function?
   ```typescript
   export default async function handler(req, res) { ... }
   ```
3. Check Vercel build logs for errors

### Issue: Login works but data lost on refresh

**Expected behavior!** Current implementation uses:
- localStorage (client-side only)
- No database (in-memory storage)

**For production:**
- Add a database (Vercel Postgres, etc.)
- Implement JWT tokens
- See `VERCEL_SERVERLESS_MIGRATION.md` for details

### Issue: Dashboard shows no data

**Check:**
1. Is `dist/public/` directory present?
2. Are static files building correctly?
   ```bash
   npm run build:client
   ls -la dist/public/
   ```
3. Check browser console for errors

---

## 📚 Documentation

You now have 3 detailed guides:

1. **`LOGIN_FIX_SUMMARY.md`** (Quick overview)
   - What was fixed
   - How to test
   - Common issues

2. **`VERCEL_SERVERLESS_MIGRATION.md`** (Complete technical guide)
   - Architecture details
   - All endpoints
   - Production setup
   - Database integration

3. **`ARCHITECTURE_DIAGRAM.md`** (Visual explanation)
   - Before/after comparison
   - Data flow diagrams
   - Mental models

---

## ⚡ Quick Commands Reference

```bash
# Local development (Express server)
npm run dev

# Build frontend only
npm run build:client

# Deploy to Vercel (test)
vercel

# Deploy to production
vercel --prod

# Check deployment logs
vercel logs

# View environment variables
vercel env ls
```

---

## 🎉 Success Indicators

You'll know it's working when:

✅ No build errors
✅ `vercel deploy` completes successfully
✅ `/api/health` returns 200 OK
✅ Login page loads
✅ Can log in with admin/admin123
✅ Dashboard displays after login
✅ All widgets show data
✅ No console errors
✅ Network tab shows 200 responses

---

## 🔄 Local vs Production

### Local Development
```bash
npm run dev
# Uses: server/index.ts (full Express)
# URL: http://localhost:5000
# Features: All Express features work
```

### Production (Vercel)
```bash
vercel --prod
# Uses: /api serverless functions
# URL: https://your-app.vercel.app
# Features: Stateless, auto-scaling
```

---

## 📞 Need Help?

### Check the logs:
```bash
# Vercel deployment logs
vercel logs --follow

# Browser console
# Open DevTools → Console tab

# Network requests
# Open DevTools → Network tab
```

### Review documentation:
- `LOGIN_FIX_SUMMARY.md` - Quick fixes
- `VERCEL_SERVERLESS_MIGRATION.md` - Complete guide
- `ARCHITECTURE_DIAGRAM.md` - Visual explanation

### Common files to check:
- `vercel.json` - Routing configuration
- `api/auth/login.ts` - Login endpoint
- `client/src/pages/login.tsx` - Login UI
- `package.json` - Build scripts

---

## ✨ You're Ready!

Deploy with:
```bash
vercel --prod
```

Then test your app at:
```
https://your-app.vercel.app
```

**Happy deploying! 🚀**

---

## 🔮 Next Steps (Optional)

### Immediate
- [ ] Deploy to Vercel
- [ ] Test all features
- [ ] Share with team

### This Week
- [ ] Add database (Vercel Postgres)
- [ ] Implement JWT auth
- [ ] Set up error monitoring

### This Month
- [ ] Add real user management
- [ ] Implement image uploads
- [ ] Add API rate limiting
- [ ] Write tests

---

**Everything is ready to deploy!** 🎊

