#!/bin/bash

# MDS AI Analytics Deployment Script
# This script helps prepare and deploy your application to Vercel

echo "🚀 MDS AI Analytics Deployment Script"
echo "======================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Error: Git repository not initialized. Please run 'git init' first."
    exit 1
fi

echo "✅ Project structure looks good!"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install Vercel CLI. Please install manually: npm install -g vercel"
        exit 1
    fi
    echo "✅ Vercel CLI installed successfully!"
else
    echo "✅ Vercel CLI is already installed"
fi

# Build the project
echo "🔨 Building the project..."
npm run build:client
if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please check for errors and try again."
    exit 1
fi
echo "✅ Build completed successfully!"

# Check if user is logged into Vercel
echo "🔐 Checking Vercel authentication..."
if ! vercel whoami &> /dev/null; then
    echo "🔑 Please log in to Vercel..."
    vercel login
    if [ $? -ne 0 ]; then
        echo "❌ Failed to log in to Vercel. Please try again."
        exit 1
    fi
else
    echo "✅ Already logged in to Vercel"
fi

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod
if [ $? -ne 0 ]; then
    echo "❌ Deployment failed. Please check the error messages above."
    exit 1
fi

echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Go to your Vercel dashboard to configure your custom domain"
echo "2. Add your Hostinger subdomain in Vercel project settings"
echo "3. Update DNS records in Hostinger to point to Vercel"
echo "4. Wait for DNS propagation (24-48 hours)"
echo ""
echo "📖 For detailed instructions, see DEPLOYMENT.md"
echo ""
echo "🌐 Your app should be available at the Vercel URL shown above!"
