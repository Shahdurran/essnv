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
// Import our custom API route definitions
import { registerRoutes } from "./routes";
// Import Vite development server integration and static file serving
import { setupVite, serveStatic, log } from "./vite";

// Create the main Express application instance
const app = express();

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
    // Call the original method with all the same arguments
    // .apply() calls the function with a specific 'this' context and arguments array
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  /*
   * EVENT-DRIVEN LOGGING:
   * We use the 'finish' event to log after the response is completely sent.
   * This ensures we have accurate timing and all response data.
   */
  res.on("finish", () => {
    // Calculate how long the request took
    const duration = Date.now() - start;
    
    // Only log API requests (not static files like CSS, images, etc.)
    if (path.startsWith("/api")) {
      // Build a descriptive log line
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      
      // Include response data if it exists
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      // Truncate very long log lines to keep output readable
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      // Use our custom logging function
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

    // Send JSON error response to client
    res.status(status).json({ message });
    
    // Re-throw the error so it appears in server logs
    // This helps with debugging but doesn't affect the HTTP response
    throw err;
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
  
  // Check if we're in development mode
  // app.get("env") reads the NODE_ENV environment variable
  if (app.get("env") === "development") {
    // Set up Vite development server with hot module replacement
    await setupVite(app, server);
  } else {
    // Serve pre-built static files in production
    serveStatic(app);
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
   * REUSE PORT:
   * - Allows multiple processes to bind to the same port
   * - Useful for zero-downtime deployments and load balancing
   */
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",      // Listen on all network interfaces
    reusePort: true,       // Allow port reuse for deployments
  }, () => {
    // This callback runs when the server successfully starts
    log(`serving on port ${port}`);
  });
})();
