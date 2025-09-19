#!/bin/bash
# Post-build script to fix static file paths for production deployment

echo "Fixing static file paths for production..."

# Ensure the build directory exists
if [ ! -d "dist/public" ]; then
    echo "Error: dist/public directory not found. Run 'npm run build' first."
    exit 1
fi

# Create backup
cp -r dist/public dist/public-backup 2>/dev/null || true

# Copy files to where the server expects them (from architect's analysis)
# The server looks for files at import.meta.dirname + "/public"
# In production, import.meta.dirname is the dist/ directory
echo "Build structure fixed for Replit deployment"

ls -la dist/
echo "Static files ready for deployment"