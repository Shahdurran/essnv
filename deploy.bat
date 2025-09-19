@echo off
echo 🚀 MDS AI Analytics Deployment Script
echo ======================================

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: package.json not found. Please run this script from the project root.
    pause
    exit /b 1
)

REM Check if git is initialized
if not exist ".git" (
    echo ❌ Error: Git repository not initialized. Please run 'git init' first.
    pause
    exit /b 1
)

echo ✅ Project structure looks good!

REM Check if Vercel CLI is installed
vercel --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 📦 Installing Vercel CLI...
    npm install -g vercel
    if %errorlevel% neq 0 (
        echo ❌ Failed to install Vercel CLI. Please install manually: npm install -g vercel
        pause
        exit /b 1
    )
    echo ✅ Vercel CLI installed successfully!
) else (
    echo ✅ Vercel CLI is already installed
)

REM Build the project
echo 🔨 Building the project...
call npm run build:client
if %errorlevel% neq 0 (
    echo ❌ Build failed. Please check for errors and try again.
    pause
    exit /b 1
)
echo ✅ Build completed successfully!

REM Check if user is logged into Vercel
echo 🔐 Checking Vercel authentication...
vercel whoami >nul 2>&1
if %errorlevel% neq 0 (
    echo 🔑 Please log in to Vercel...
    vercel login
    if %errorlevel% neq 0 (
        echo ❌ Failed to log in to Vercel. Please try again.
        pause
        exit /b 1
    )
) else (
    echo ✅ Already logged in to Vercel
)

REM Deploy to Vercel
echo 🚀 Deploying to Vercel...
vercel --prod
if %errorlevel% neq 0 (
    echo ❌ Deployment failed. Please check the error messages above.
    pause
    exit /b 1
)

echo.
echo 🎉 Deployment completed successfully!
echo.
echo 📋 Next steps:
echo 1. Go to your Vercel dashboard to configure your custom domain
echo 2. Add your Hostinger subdomain in Vercel project settings
echo 3. Update DNS records in Hostinger to point to Vercel
echo 4. Wait for DNS propagation (24-48 hours)
echo.
echo 📖 For detailed instructions, see DEPLOYMENT.md
echo.
echo 🌐 Your app should be available at the Vercel URL shown above!
pause
