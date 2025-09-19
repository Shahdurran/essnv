# Deployment Guide for MDS AI Analytics

This guide will help you deploy your application to Vercel and connect it to your Hostinger subdomain.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com) (free tier available)
2. **GitHub Account**: Your code should be in a GitHub repository
3. **Hostinger Subdomain**: You should have a subdomain ready (e.g., `analytics.yourdomain.com`)

## Step 1: Prepare Your Repository

1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "Add Vercel deployment configuration"
   git push origin main
   ```

2. **Environment Variables**: You'll need to set these in Vercel:
   - `DATABASE_URL` (if using a database)
   - `OPENAI_API_KEY` (for AI features)
   - Any other environment variables your app needs

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. **Go to [vercel.com](https://vercel.com)** and sign in
2. **Click "New Project"**
3. **Import your GitHub repository**:
   - Select your repository from the list
   - Vercel will automatically detect it's a Node.js project
4. **Configure the project**:
   - **Framework Preset**: Other
   - **Root Directory**: `./` (leave as default)
   - **Build Command**: `npm run build:client`
   - **Output Directory**: `dist/public`
   - **Install Command**: `npm install`
5. **Add Environment Variables**:
   - Click "Environment Variables"
   - Add each variable from your `.env` file
6. **Click "Deploy"**

### Option B: Deploy via Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```

4. **Follow the prompts**:
   - Link to existing project or create new
   - Set up environment variables
   - Deploy

## Step 3: Configure Custom Domain (Hostinger Subdomain)

### In Vercel Dashboard:

1. **Go to your project** in Vercel dashboard
2. **Click "Settings"** tab
3. **Click "Domains"** in the left sidebar
4. **Add your subdomain**:
   - Enter your subdomain (e.g., `analytics.yourdomain.com`)
   - Click "Add"

### In Hostinger Control Panel:

1. **Log into your Hostinger account**
2. **Go to "Domains"** section
3. **Find your domain** and click "Manage"
4. **Go to "DNS Zone Editor"**
5. **Add a CNAME record**:
   - **Type**: CNAME
   - **Name**: `analytics` (or whatever your subdomain prefix is)
   - **Value**: `cname.vercel-dns.com`
   - **TTL**: 3600 (or leave default)

### Alternative: A Record Method

If CNAME doesn't work, you can use A records:

1. **In Vercel**, note the IP address shown for your domain
2. **In Hostinger DNS Zone Editor**, add an A record:
   - **Type**: A
   - **Name**: `analytics`
   - **Value**: The IP address from Vercel
   - **TTL**: 3600

## Step 4: SSL Certificate

Vercel automatically provides SSL certificates for custom domains. After adding your domain:

1. **Wait 24-48 hours** for DNS propagation
2. **Vercel will automatically issue an SSL certificate**
3. **Check the domain status** in Vercel dashboard - it should show "Valid"

## Step 5: Verify Deployment

1. **Visit your subdomain** (e.g., `https://analytics.yourdomain.com`)
2. **Test all functionality**:
   - Login system
   - API endpoints
   - Dashboard features
   - AI assistant

## Troubleshooting

### Common Issues:

1. **Domain not resolving**:
   - Wait 24-48 hours for DNS propagation
   - Check DNS records in Hostinger
   - Verify domain is added correctly in Vercel

2. **SSL certificate issues**:
   - Ensure domain is properly configured
   - Wait for automatic SSL provisioning
   - Check domain status in Vercel

3. **Build failures**:
   - Check build logs in Vercel dashboard
   - Ensure all dependencies are in `package.json`
   - Verify environment variables are set

4. **API endpoints not working**:
   - Check that routes are properly configured in `vercel.json`
   - Verify server functions are deployed
   - Check server logs in Vercel dashboard

### Environment Variables Checklist:

Make sure these are set in Vercel:
- `NODE_ENV=production`
- `DATABASE_URL` (if using database)
- `OPENAI_API_KEY` (for AI features)
- Any other variables your app needs

## Monitoring and Updates

1. **Automatic deployments**: Vercel will automatically redeploy when you push to your main branch
2. **Preview deployments**: Each pull request gets its own preview URL
3. **Analytics**: Vercel provides built-in analytics for your deployments
4. **Logs**: Check function logs in Vercel dashboard for debugging

## Cost Considerations

- **Vercel Free Tier**: Includes 100GB bandwidth, 100 serverless function executions
- **Custom domains**: Free on Vercel
- **SSL certificates**: Free and automatic
- **Upgrade**: Only needed if you exceed free tier limits

## Support

- **Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
- **Vercel Community**: [github.com/vercel/vercel/discussions](https://github.com/vercel/vercel/discussions)
- **Hostinger Support**: Available through your Hostinger control panel

---

Your application should now be live at your custom subdomain! 🚀
