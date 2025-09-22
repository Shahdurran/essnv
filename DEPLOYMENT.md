# MDS AI Analytics - Deployment Guide

## Production Deployment to Vercel

This application is configured to use **embedded financial data** instead of requiring a database connection, making deployment simple and reliable.

### Key Configuration Changes

1. **Unified Server Architecture**: The application uses a single Express server that handles both API routes and serves the React frontend.

2. **Embedded Data**: All financial data is embedded in the application (`server/data/embedded-financial-data.ts`) instead of requiring a database.

3. **Vercel Configuration**: Updated `vercel.json` to use the unified server approach instead of individual API functions.

### Deployment Steps

1. **Build the Application**:
   ```bash
   npm run build
   ```
   This builds both the React frontend and the Express server.

2. **Deploy to Vercel**:
   ```bash
   vercel --prod
   ```
   Or push to your connected Git repository.

### What's Included in Production

- ✅ **Embedded Financial Data**: All P&L, cash flow, and revenue data
- ✅ **Practice Locations**: Fairfax and Gainesville locations
- ✅ **API Endpoints**: All analytics and financial endpoints
- ✅ **React Frontend**: Complete dashboard with charts and analytics
- ✅ **AI Assistant**: Ready for OpenAI API key configuration

### Environment Variables (Optional)

- `OPENAI_API_KEY`: For AI assistant functionality (optional)
- `NODE_ENV`: Automatically set to "production" by Vercel

### No Database Required

The application does **NOT** require:
- ❌ PostgreSQL database
- ❌ DATABASE_URL environment variable
- ❌ Database migrations
- ❌ External data sources

### Testing Production Build Locally

```bash
# Build the application
npm run build

# Start production server
npm start

# Test endpoints
curl http://localhost:5000/health
curl http://localhost:5000/api/locations
curl http://localhost:5000/api/financial/revenue/all/1Y
```

### Troubleshooting

If you encounter database-related errors:
1. Ensure the `csvImport.ts` imports are conditional (already fixed)
2. Verify `vercel.json` uses the unified server approach
3. Check that `vercel-build` script runs the full build process

The application is now ready for production deployment with embedded data!