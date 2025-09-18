/*
 * MAIN SERVER ENTRY POINT
 * =======================
 * 
 * This file sets up the Express.js server that powers our medical analytics application.
 * It handles both API routes (for data) and serves the React frontend in development.
 * 
 * MODERN FULL-STACK ARCHITECTURE:
 * This is a "monolith" approach where one server handles both:
 * - Backend API endpoints (/api/*)
 * - Frontend React application (served as static files)
 * 
 * BENEFITS OF THIS APPROACH:
 * - Simpler deployment (one server instead of separate frontend/backend)
 * - No CORS issues (same origin for API and UI)
 * - Easier development setup
 * - Replit deployment works seamlessly
 * 
 * TYPESCRIPT IMPORT SYNTAX:
 * - `import express` imports the default export from the express package
 * - `{ type Request, Response, NextFunction }` imports TypeScript type definitions
 * - The "type" keyword tells TypeScript these are just for type checking, not runtime values
 * - This helps with autocompletion and catches errors during development
 */

// Import Express framework for building the web server
import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import { fileURLToPath } from "url";
// Import our custom API route definitions
import { registerRoutes } from "./routes";

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple logging helper (replaces vite.ts import)
const log = (message: string) => {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${timestamp} [express] ${message}`);
};

// Create the main Express application instance
const app = express();

// Configure Express for Cloud Run deployment
app.set('trust proxy', true); // Honor X-Forwarded-* headers for correct req.ip/secure detection

// PRODUCTION ERROR HANDLING - Catch any startup failures without premature exits
if (process.env.NODE_ENV === 'production') {
  console.log(`🔥 [PROD STARTUP] Setting up error handlers...`);
  
  process.on('uncaughtException', (error) => {
    console.error(`🔥 [PROD FATAL] Uncaught Exception: ${error.message}`);
    console.error(`🔥 [PROD FATAL] Stack: ${error.stack}`);
    console.error(`🔥 [PROD FATAL] Continuing execution to maintain server availability`);
    // Don't exit - let Cloud Run handle container health
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error(`🔥 [PROD FATAL] Unhandled Rejection: ${reason}`);
    console.error(`🔥 [PROD FATAL] Promise: ${promise}`);
    console.error(`🔥 [PROD FATAL] Continuing execution to maintain server availability`);
    // Don't exit - let Cloud Run handle container health
  });

  // Keep SIGTERM and SIGINT handlers for graceful shutdown, but add delay
  let isShuttingDown = false;
  
  process.on('SIGTERM', () => {
    if (!isShuttingDown) {
      isShuttingDown = true;
      console.log(`🔥 [PROD SHUTDOWN] SIGTERM received, shutting down gracefully in 5s`);
      setTimeout(() => process.exit(0), 5000);
    }
  });

  process.on('SIGINT', () => {
    if (!isShuttingDown) {
      isShuttingDown = true;
      console.log(`🔥 [PROD SHUTDOWN] SIGINT received, shutting down gracefully in 5s`);
      setTimeout(() => process.exit(0), 5000);
    }
  });
}

/*
 * MIDDLEWARE CONFIGURATION
 * ========================
 * 
 * Middleware functions run on every request before it reaches our route handlers.
 * They modify the request/response objects or perform common operations.
 * 
 * ORDER MATTERS: Middleware runs in the order it's defined with app.use()
 */

// Parse JSON request bodies (for POST/PUT requests with JSON data)
// This lets us access req.body as a JavaScript object
app.use(express.json());

// Parse URL-encoded form data (for traditional HTML form submissions)
// extended: false uses the 'querystring' library (simpler, faster)
// extended: true uses the 'qs' library (supports nested objects)
app.use(express.urlencoded({ extended: false }));

/*
 * CUSTOM LOGGING MIDDLEWARE
 * =========================
 * 
 * This middleware intercepts API requests and logs detailed information about them.
 * It's extremely helpful for debugging and monitoring the application.
 * 
 * WHAT THIS MIDDLEWARE DOES:
 * 1. Records when each request starts
 * 2. Captures the JSON response data
 * 3. Logs request details when the response finishes
 * 4. Only logs API routes (not static file requests)
 * 
 * ADVANCED JAVASCRIPT TECHNIQUES USED:
 */
app.use((req, res, next) => {
  // Record the start time to calculate request duration
  const start = Date.now();
  const path = req.path;

  // PRODUCTION DEBUGGING LOGS ONLY
  if (process.env.NODE_ENV === 'production' || app.get('env') === 'production') {
    console.log(`🚀 [PROD REQUEST START] ${new Date().toISOString()} - ${req.method} ${path}`);
    console.log(`🚀 [PROD HEADERS] UA: ${req.get('User-Agent')?.substring(0, 50) || 'None'}`);
    console.log(`🚀 [PROD HEADERS] Accept: ${req.get('Accept') || 'None'}`);
    console.log(`🚀 [PROD HEADERS] Cache: ${req.get('Cache-Control') || 'None'}`);
    console.log(`🚀 [PROD HEADERS] Auth: ${req.get('Authorization') ? 'Present' : 'None'}`);
    console.log(`🚀 [PROD CLIENT] IP: ${req.ip}, Real-IP: ${req.get('X-Real-IP') || 'None'}`);
    console.log(`🚀 [PROD SESSION] ${(req as any).session ? 'Active' : 'None'}`);

    // Memory usage tracking for production
    const memUsage = process.memoryUsage();
    console.log(`🚀 [PROD MEMORY] RSS: ${(memUsage.rss / 1024 / 1024).toFixed(1)}MB, Heap: ${(memUsage.heapUsed / 1024 / 1024).toFixed(1)}MB`);

    // Track uptime and load
    const uptime = process.uptime();
    console.log(`🚀 [PROD SERVER] Uptime: ${(uptime / 60).toFixed(1)}min, PID: ${process.pid}`);
  }

  // Variable to store the response data for logging
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  /*
   * FUNCTION INTERCEPTION TECHNIQUE:
   * We're "monkey patching" the res.json() method to capture response data.
   * This is an advanced technique where we replace a built-in method with our own version.
   */

  // Save reference to the original res.json method
  const originalResJson = res.json;

  // Replace res.json with our custom version that captures data
  res.json = function (bodyJson, ...args) {
    // Store the response data for logging
    capturedJsonResponse = bodyJson;
    if (process.env.NODE_ENV === 'production' || app.get('env') === 'production') {
      console.log(`🚀 [PROD RESPONSE PREP] ${res.statusCode} - Headers: ${Object.keys(res.getHeaders()).join(',')}`);
    }
    // Call the original method with all the same arguments
    // .apply() calls the function with a specific 'this' context and arguments array
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  // Track response errors in production
  res.on('error', (err) => {
    if (process.env.NODE_ENV === 'production' || app.get('env') === 'production') {
      console.error(`🚀 [PROD RESPONSE ERROR] ${req.method} ${path}: ${err.message}`);
      console.error(`🚀 [PROD ERROR STACK] ${err.stack?.substring(0, 500)}`);
    }
  });

  /*
   * EVENT-DRIVEN LOGGING:
   * We use the 'finish' event to log after the response is completely sent.
   * This ensures we have accurate timing and all response data.
   */
  res.on("finish", () => {
    // Calculate how long the request took
    const duration = Date.now() - start;

    if (process.env.NODE_ENV === 'production' || app.get('env') === 'production') {
      console.log(`🚀 [PROD REQUEST END] ${req.method} ${path} - Status: ${res.statusCode} - Duration: ${duration}ms`);

      // Log slow requests
      if (duration > 1000) {
        console.log(`🚀 [PROD SLOW REQUEST] ${req.method} ${path} took ${duration}ms - INVESTIGATE!`);
      }

      // Log errors
      if (res.statusCode >= 400) {
        console.log(`🚀 [PROD ERROR RESPONSE] ${req.method} ${path} - ${res.statusCode}`);
        if (capturedJsonResponse) {
          console.log(`🚀 [PROD ERROR DATA] ${JSON.stringify(capturedJsonResponse).substring(0, 300)}`);
        }
      }

      // Log API requests with data
      if (path.startsWith("/api")) {
        console.log(`🚀 [PROD API] ${req.method} ${path} ${res.statusCode} in ${duration}ms`);
        if (capturedJsonResponse && res.statusCode < 300) {
          const respStr = JSON.stringify(capturedJsonResponse);
          console.log(`🚀 [PROD API DATA] ${respStr.length} chars: ${respStr.substring(0, 150)}...`);
        }
      }

      console.log(`🚀 [PROD REQUEST COMPLETE] =====================================`);
    }

    // Keep original logging for development
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        const responseStr = JSON.stringify(capturedJsonResponse);
        if (responseStr.length > 200) {
          logLine += ` :: ${responseStr.substring(0, 200)}...`;
        } else {
          logLine += ` :: ${responseStr}`;
        }
      }
      log(logLine);
    }
  });

  // Call next() to continue to the next middleware or route handler
  // Without this, the request would hang forever!
  next();
});

/*
 * MAIN SERVER INITIALIZATION
 * ==========================
 * 
 * This is an IIFE (Immediately Invoked Function Expression) that sets up and starts the server.
 * We use an async function because some setup operations are asynchronous.
 * 
 * IIFE EXPLANATION:
 * (async () => { ... })() creates and immediately calls an async function.
 * This lets us use 'await' at the top level of our file.
 */
(async () => {
  /*
   * ROUTE REGISTRATION:
   * This sets up all our API endpoints (/api/locations, /api/analytics, etc.)
   * The registerRoutes function returns an HTTP server instance that we'll use later.
   */
  const server = await registerRoutes(app);

  /*
   * GLOBAL ERROR HANDLER MIDDLEWARE
   * ===============================
   * 
   * This is Express's "error handling middleware" - it catches any errors that
   * occur in our route handlers and sends a proper HTTP error response.
   * 
   * SPECIAL MIDDLEWARE SIGNATURE:
   * Error handlers have 4 parameters: (err, req, res, next)
   * Express identifies error handlers by this 4-parameter signature.
   * 
   * UNDERSCORE PREFIX CONVENTION:
   * _req, _next start with underscore to tell TypeScript "we're not using these variables"
   * This prevents "unused variable" warnings while keeping the required function signature.
   */
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    // Extract HTTP status code from error object (default to 500 if not specified)
    const status = err.status || err.statusCode || 500;
    // Extract error message (default to generic message if not specified)
    const message = err.message || "Internal Server Error";

    // Log error details for debugging
    console.error(`[ERROR] ${status}: ${message}`, err.stack || err);

    // Send JSON error response to client
    res.status(status).json({ message });

    // Don't re-throw in production to prevent crashes
    if (app.get("env") !== "production") {
      throw err;
    }
  });

  /*
   * DEVELOPMENT vs PRODUCTION SETUP
   * ===============================
   * 
   * The app behaves differently in development vs production:
   * 
   * DEVELOPMENT MODE:
   * - Uses Vite dev server for hot module replacement
   * - React code recompiles automatically when you save files
   * - Source maps for easier debugging
   * 
   * PRODUCTION MODE:
   * - Serves pre-built static files
   * - Better performance, smaller file sizes
   * - No hot reloading (changes require rebuild/restart)
   */

  // Simple production detection - only when NODE_ENV is explicitly production
  const isProduction = process.env.NODE_ENV === "production";
                      
  if (process.env.NODE_ENV === 'production') {
    console.log(`🔥 [PROD STARTUP] Production mode detected: NODE_ENV=${process.env.NODE_ENV}`);
  }

  if (!isProduction) {
    // Development mode: dynamically import Vite
    try {
      const { setupVite } = await import("./vite");
      await setupVite(app, server);
      log("Development server with Vite hot reload enabled");
    } catch (error) {
      console.error("Failed to setup Vite development server:", error);
      // Fallback: import serveStatic from vite.ts
      try {
        const { serveStatic } = await import("./vite");
        serveStatic(app);
        log("Fallback to static serving in development");
      } catch (fallbackError) {
        console.error("Failed to setup any file serving:", fallbackError);
      }
    }
  } else {
    // Production: serve static files with optimized path detection
    const possibleStaticPaths = [
      path.join(__dirname, "../client/dist"),
      path.join(__dirname, "../dist"),
      path.join(__dirname, "./dist"),
      path.join(process.cwd(), "dist"),
      path.join(process.cwd(), "client/dist")
    ];
    
    let staticPath = possibleStaticPaths[0]; // Default
    let staticPathExists = false;
    
    // Optimized: Check paths in parallel to reduce startup time
    try {
      const fs = await import("fs");
      const pathChecks = possibleStaticPaths.map(async (testPath) => {
        try {
          await fs.promises.access(testPath);
          return testPath;
        } catch {
          return null;
        }
      });
      
      const results = await Promise.all(pathChecks);
      const firstExistingPath = results.find(path => path !== null);
      
      if (firstExistingPath) {
        staticPath = firstExistingPath;
        staticPathExists = true;
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'production') {
        console.log(`🔥 [PROD STARTUP] Static path detection error: ${error}, using fallback`);
      }
    }
    
    if (process.env.NODE_ENV === 'production') {
      console.log(`🔥 [PROD STARTUP] Static path search results:`);
      console.log(`🔥 [PROD STARTUP] Found static files: ${staticPathExists}`);
      console.log(`🔥 [PROD STARTUP] Using path: ${staticPath}`);
    }
    
    if (staticPathExists) {
      app.use(express.static(staticPath));
      
      // SPA fallback - serve index.html for all non-API routes
      app.get("*", (req, res) => {
        if (!req.path.startsWith("/api")) {
          const indexPath = path.join(staticPath, "index.html");
          res.sendFile(indexPath, (err) => {
            if (err) {
              if (process.env.NODE_ENV === 'production') {
                console.error(`🔥 [PROD ERROR] Failed to serve index.html: ${err.message}`);
              }
              res.status(500).send("Application not available - static files missing");
            }
          });
        } else {
          res.status(404).json({ message: "API endpoint not found" });
        }
      });
    } else {
      // Fallback: serve a basic HTML page if no built files exist
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
      
      if (process.env.NODE_ENV === 'production') {
        console.log(`🔥 [PROD STARTUP] No static files found - serving fallback HTML`);
      }
    }
  }

  /*
   * SERVER STARTUP
   * ==============
   * 
   * Start the HTTP server and listen for incoming connections.
   * 
   * PORT CONFIGURATION:
   * - Uses PORT environment variable if available
   * - Falls back to 5000 if not specified
   * - parseInt() converts string to number (base 10)
   * 
   * HOST CONFIGURATION:
   * - "0.0.0.0" means "listen on all network interfaces"
   * - This allows external connections (important for cloud deployments)
   * - "localhost" or "127.0.0.1" would only allow local connections
   * 
   * CLOUD RUN OPTIMIZATIONS:
   * - Trust proxy headers for correct IP detection behind load balancer
   * - No reusePort needed (single listener per container)
   * - Keep-alive timeouts configured for GCP load balancer compatibility
   */
  const port = parseInt(process.env.PORT || '5000', 10);
  
  // PRODUCTION: Log server startup attempt
  if (process.env.NODE_ENV === 'production') {
    console.log(`🔥 [PROD STARTUP] Attempting to start server on port ${port}...`);
    console.log(`🔥 [PROD STARTUP] Available memory: ${JSON.stringify(process.memoryUsage())}`);
  }
  
  const serverInstance = server.listen({
    port,
    host: "0.0.0.0",      // Listen on all network interfaces
    // reusePort removed - not needed for Cloud Run (single listener per container)
  }, async () => {
    // This callback runs when the server successfully starts
    log(`serving on port ${port}`);

    // PRODUCTION DEBUGGING: Log critical server startup info
    if (process.env.NODE_ENV === 'production') {
      console.log(`🔥 [PROD STARTUP] ===========================================`);
      console.log(`🔥 [PROD STARTUP] Server started at ${new Date().toISOString()}`);
      console.log(`🔥 [PROD STARTUP] Port: ${port}, Host: 0.0.0.0`);
      console.log(`🔥 [PROD STARTUP] NODE_ENV: ${process.env.NODE_ENV || 'undefined'}`);
      console.log(`🔥 [PROD STARTUP] App env mode: ${app.get('env')}`);
      console.log(`🔥 [PROD STARTUP] Production detection: ${app.get("env") === "production" || process.argv.includes("dist/index.js")}`);
      console.log(`🔥 [PROD STARTUP] Process args: ${process.argv.join(' ')}`);
      console.log(`🔥 [PROD STARTUP] Working directory: ${process.cwd()}`);
      console.log(`🔥 [PROD STARTUP] Process PID: ${process.pid}`);
      console.log(`🔥 [PROD STARTUP] Node version: ${process.version}`);
      console.log(`🔥 [PROD STARTUP] Platform: ${process.platform} ${process.arch}`);

      // Check for critical environment variables
      const criticalEnvVars = ['DATABASE_URL', 'OPENAI_API_KEY', 'OPENAI_API_KEY_ENV_VAR', 'PORT', 'REPLIT_DOMAINS'];
      criticalEnvVars.forEach(envVar => {
        const value = process.env[envVar];
        console.log(`🔥 [PROD STARTUP] ${envVar}: ${value ? 'SET' : 'MISSING'} ${value ? `(length: ${value.length})` : ''}`);
      });

      // Log memory at startup
      const memUsage = process.memoryUsage();
      console.log(`🔥 [PROD STARTUP] Initial Memory: RSS ${(memUsage.rss / 1024 / 1024).toFixed(1)}MB, Heap ${(memUsage.heapUsed / 1024 / 1024).toFixed(1)}MB`);

      console.log(`🔥 [PROD STARTUP] ===========================================`);
    }

    // Data is now permanently embedded in the application
    log(`[startup] Using embedded financial data for Eye Specialists & Surgeons`);
  });

  // ============================================================================
  // CLOUD RUN KEEP-ALIVE CONFIGURATION
  // ============================================================================

  // Configure HTTP keep-alive settings for Cloud Run compatibility
  serverInstance.keepAliveTimeout = 61000; // 61 seconds (just above Cloud Run's 60s default)
  serverInstance.headersTimeout = 62000;   // 62 seconds (slightly longer than keepAliveTimeout)
  
  // Track active connections for Cloud Run monitoring
  let activeConnections = 0;
  let totalConnections = 0;
  
  serverInstance.on('connection', (socket) => {
    activeConnections++;
    totalConnections++;
    
    if (process.env.NODE_ENV === 'production') {
      console.log(`🔥 [PROD CONNECTION] New connection established. Active: ${activeConnections}, Total: ${totalConnections}`);
    }
    
    // Enable keep-alive on the socket without timeout to avoid killing long requests
    socket.setKeepAlive(true, 60000); // 60 seconds
    // Removed socket.setTimeout() to avoid prematurely killing long requests
    
    socket.on('close', () => {
      activeConnections--;
      if (process.env.NODE_ENV === 'production') {
        console.log(`🔥 [PROD CONNECTION] Connection closed. Active: ${activeConnections}`);
      }
    });
    
    socket.on('error', (err) => {
      if (process.env.NODE_ENV === 'production') {
        console.error(`🔥 [PROD CONNECTION ERROR] Socket error: ${err.message}`);
      }
    });
  });

  // Add periodic heartbeat logging for Cloud Run monitoring
  if (process.env.NODE_ENV === 'production') {
    const heartbeatInterval = setInterval(() => {
      const uptime = Math.floor(process.uptime());
      const memUsage = process.memoryUsage();
      console.log(`🔥 [PROD HEARTBEAT] Uptime: ${uptime}s, Active connections: ${activeConnections}, Memory: ${(memUsage.heapUsed / 1024 / 1024).toFixed(1)}MB`);
    }, 300000); // Every 5 minutes

    // Clean up heartbeat on shutdown
    process.on('SIGTERM', () => {
      clearInterval(heartbeatInterval);
    });
  }

  // The HTTP server keeps the event loop alive automatically
  // No artificial exit-prevention intervals needed
  
  // PRODUCTION: Add error handling for server startup failures
  if (process.env.NODE_ENV === 'production') {
    serverInstance.on('error', (error: any) => {
      console.error(`🔥 [PROD STARTUP ERROR] Server failed to start: ${error.message}`);
      console.error(`🔥 [PROD STARTUP ERROR] Error code: ${error.code}`);
      console.error(`🔥 [PROD STARTUP ERROR] Error port: ${error.port}`);
      console.error(`🔥 [PROD STARTUP ERROR] This is likely causing "service unavailable"`);
      console.error(`🔥 [PROD STARTUP ERROR] Full error: ${JSON.stringify(error, null, 2)}`);
      console.error(`🔥 [PROD STARTUP ERROR] Continuing without exit to let Cloud Run manage container`);
      // Don't exit immediately - Cloud Run will restart container if needed
    });
    
    serverInstance.on('listening', () => {
      console.log(`🔥 [PROD SUCCESS] Server successfully listening on port ${port}`);
      console.log(`🔥 [PROD SUCCESS] Server address: ${JSON.stringify(serverInstance.address())}`);
    });
  }
})();