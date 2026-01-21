@echo off
echo ========================================
echo  Quick Deploy to Vercel via Git
echo ========================================
echo.

cd /d D:\ESSNV

echo Checking git status...
git status
echo.

echo Adding all changes...
git add .
echo.

echo Committing changes...
git commit -m "Fix: Add catch-all routes for auth, users, and dashboard to resolve 405 errors"
echo.

echo Pushing to remote (this triggers Vercel deployment)...
git push
echo.

echo ========================================
echo  Deployment initiated!
echo  Check Vercel dashboard for progress:
echo  https://vercel.com/dashboard
echo ========================================
echo.

pause

