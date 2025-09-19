/*
 * VERCEL SERVERLESS FUNCTION ENTRY POINT
 * ======================================
 * 
 * This file serves as the entry point for Vercel serverless functions.
 * It handles both API routes and serves the React frontend.
 */

import express from "express";
import path from "path";
import { fileURLToPath } from "url";

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();

// Configure Express for Vercel
app.set('trust proxy', true);

// Parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Simple health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "MDS AI Analytics API",
    environment: process.env.NODE_ENV || "development"
  });
});

// Simple test endpoint
app.get("/api/test", (req, res) => {
  res.json({
    message: "API is working!",
    timestamp: new Date().toISOString()
  });
});

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  // Try multiple possible static file paths
  const possibleStaticPaths = [
    path.join(__dirname, "../dist/public"),
    path.join(__dirname, "../client/dist"),
    path.join(__dirname, "../dist"),
    path.join(process.cwd(), "dist/public"),
    path.join(process.cwd(), "client/dist")
  ];
  
  let staticPath = possibleStaticPaths[0];
  let staticPathExists = false;
  
  // Check which static path exists
  try {
    const fs = require("fs");
    for (const testPath of possibleStaticPaths) {
      try {
        if (fs.existsSync(testPath)) {
          staticPath = testPath;
          staticPathExists = true;
          break;
        }
      } catch {
        // Continue to next path
      }
    }
  } catch (error) {
    console.log(`Static path detection error: ${error}`);
  }
  
  console.log(`Static files found: ${staticPathExists} at ${staticPath}`);
  
  if (staticPathExists) {
    // Serve static files
    app.use(express.static(staticPath));
    
    // SPA fallback - serve index.html for all non-API routes
    app.get("*", (req, res) => {
      if (!req.path.startsWith("/api")) {
        const indexPath = path.join(staticPath, "index.html");
        res.sendFile(indexPath, (err) => {
          if (err) {
            console.error(`Failed to serve index.html: ${err.message}`);
            res.status(500).send("Application not available - static files missing");
          }
        });
      } else {
        res.status(404).json({ message: "API endpoint not found" });
      }
    });
  } else {
    // Fallback HTML if no static files found
    app.get("*", (req, res) => {
      if (!req.path.startsWith("/api")) {
        res.send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>MDS AI Analytics</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; text-align: center; }
              .container { max-width: 600px; margin: 0 auto; }
              .error { color: #d32f2f; margin: 20px 0; }
              .info { color: #1976d2; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>MDS AI Analytics</h1>
              <div class="error">Application is starting up...</div>
              <div class="info">The frontend application is being prepared. Please check back in a moment.</div>
              <div class="info">API endpoints are available at <a href="/api/health">/api/health</a></div>
            </div>
          </body>
          </html>
        `);
      } else {
        res.status(404).json({ message: "API endpoint not found" });
      }
    });
  }
}

// Export the app for Vercel
export default app;
