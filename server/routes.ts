/*
 * API ROUTES MODULE FOR MDS AI ANALYTICS
 * ======================================
 *
 * This module defines all the REST API endpoints that power our medical analytics dashboard.
 * It handles routing, request validation, data processing, and response formatting.
 *
 * MODERN EXPRESS.JS PATTERNS:
 * - Async/await for all route handlers (no callback hell)
 * - Comprehensive error handling with proper HTTP status codes
 * - Request parameter validation and type safety
 * - RESTful API design principles
 * - Integration with OpenAI for AI assistant functionality
 *
 * API ORGANIZATION:
 * Routes are organized by functional area:
 * - /api/locations: Practice location management
 * - /api/analytics/*: Business intelligence data endpoints
 * - /api/ai/*: AI assistant and natural language processing
 *
 * TYPESCRIPT BENEFITS:
 * All routes use TypeScript for:
 * - Request/response type safety
 * - Parameter validation
 * - IDE autocompletion and error catching
 * - Better maintainability and refactoring support
 */

// Express framework types for building REST API routes
import type { Express, Request, Response, NextFunction } from "express";
// HTTP server creation for advanced server features
import { createServer, type Server } from "http";
// Our custom storage layer for data persistence
import { storage } from "./storage";
// OpenAI SDK for AI assistant functionality
import OpenAI from "openai";
// Zod schema for AI query validation
import { insertAiQuerySchema } from "@shared/schema";
// Cash flow CSV import functions (imported conditionally to avoid database requirement)
// import { importCashFlowDataFromCsv, getCashFlowData } from "./csvImport";
// Multer for handling file uploads
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
// User configuration management
import * as userConfig from "./storage/userConfigurations";
import type { UserConfiguration } from "./storage/userConfigurations";
import * as defaultSubheadings from "./data/default-subheadings";

/*
 * MULTER CONFIGURATION FOR FILE UPLOADS
 * =====================================
 * 
 * Configure multer to handle image uploads for dashboard customization.
 * Images are saved to server/public/assets/ directory.
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer storage
const storage_multer = multer.diskStorage({
  destination: (req, file, cb) => {
    // Save to server/public/assets directory
    const uploadDir = path.join(__dirname, 'public', 'assets');
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: original-name-timestamp.ext
    const uniqueSuffix = Date.now();
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    cb(null, `${nameWithoutExt}_${uniqueSuffix}${ext}`);
  }
});

// Configure multer with file filter and size limits
const upload = multer({
  storage: storage_multer,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Only allow image files
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'));
    }
  }
});

/*
 * OPENAI CLIENT INITIALIZATION
 * ============================
 *
 * This sets up our connection to OpenAI's GPT-4o model for the AI business assistant.
 * The AI assistant helps users ask natural language questions about their practice data.
 *
 * PRODUCTION-SAFE INITIALIZATION:
 * Only initialize OpenAI client if a valid API key is present.
 * This prevents server crashes in production when API key is missing.
 */
// Get OpenAI API key from environment variables
const openaiApiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR;
const hasValidOpenAIKey = openaiApiKey && openaiApiKey !== "default_key" && openaiApiKey.length > 10;

// Initialize OpenAI client only if valid key is present
let openai: OpenAI | null = null;
if (hasValidOpenAIKey) {
  openai = new OpenAI({
    apiKey: openaiApiKey,
  });
} else {
  console.log(`⚠️  [STARTUP] OpenAI API key not configured - AI features will be disabled`);
  if (process.env.NODE_ENV === 'production') {
    console.log(`🔥 [PROD STARTUP] OpenAI key status: ${openaiApiKey ? 'INVALID/DEFAULT' : 'MISSING'} - AI endpoints will return 503`);
  }
}

// Import AI assistant utilities (moved to separate modules for better architecture)
import { processAIQuery } from "./utils/aiAssistant";
import { extractQueryContext } from "./utils/queryParser";

/**
 * Register all API routes for the MDS AI Analytics platform
 * This includes routes for analytics data, AI assistant, and practice management
 */
export async function registerRoutes(app: Express): Promise<Server> {
  // PRODUCTION DEBUGGING ONLY
  if (process.env.NODE_ENV === 'production') {
    console.log(`🔥 [PRODUCTION] =============================================`);
    console.log(`🔥 [PRODUCTION] Server registration starting at ${new Date().toISOString()}`);
    console.log(`🔥 [PRODUCTION] Node version: ${process.version}`);
    console.log(`🔥 [PRODUCTION] Platform: ${process.platform} ${process.arch}`);
    console.log(`🔥 [PRODUCTION] Working dir: ${process.cwd()}`);
    console.log(`🔥 [PRODUCTION] Process args: ${process.argv.slice(2).join(' ')}`);
    console.log(`🔥 [PRODUCTION] OpenAI Key: ${hasValidOpenAIKey ? 'CONFIGURED' : 'MISSING/DEFAULT'}`);
    console.log(`🔥 [PRODUCTION] OpenAI Key Length: ${openaiApiKey?.length || 0}`);
    console.log(`🔥 [PRODUCTION] Initial Memory: ${JSON.stringify(process.memoryUsage())}`);
    console.log(`🔥 [PRODUCTION] Environment vars loaded: ${Object.keys(process.env).length}`);
    console.log(`🔥 [PRODUCTION] =============================================`);
  }
  
  // Server readiness and health tracking for Cloud Run
  let isServerReady = true;
  let serverStartTime = Date.now();
  
  // Simple function to mark server as unhealthy (for future use)
  const markUnhealthy = (reason: string) => {
    isServerReady = false;
    console.error(`🔥 [HEALTH] Server marked unhealthy: ${reason}`);
  };
  
  // Track API request counts for rate limiting analysis
  const requestCounts = new Map<string, number>();
  const errorCounts = new Map<string, number>();
  let lastHealthReport = Date.now();
  
  // PRODUCTION HEALTH MONITORING - Report server health every 1 minute
  const healthMonitor = setInterval(() => {
    if (process.env.NODE_ENV === 'production') {
      const uptime = Date.now() - serverStartTime;
      const memUsage = process.memoryUsage();
      const totalRequests = Array.from(requestCounts.values()).reduce((a, b) => a + b, 0);
      const totalErrors = Array.from(errorCounts.values()).reduce((a, b) => a + b, 0);
      
      console.log(`🔥 [PROD HEALTH] ============================================`);
      console.log(`🔥 [PROD HEALTH] Time: ${new Date().toISOString()}`);
      console.log(`🔥 [PROD HEALTH] Uptime: ${(uptime / 1000 / 60).toFixed(1)} minutes`);
      console.log(`🔥 [PROD HEALTH] Requests: ${totalRequests}, Errors: ${totalErrors}`);
      console.log(`🔥 [PROD HEALTH] Error rate: ${totalRequests > 0 ? (totalErrors / totalRequests * 100).toFixed(2) : 0}%`);
      console.log(`🔥 [PROD HEALTH] Memory: RSS ${(memUsage.rss / 1024 / 1024).toFixed(1)}MB, Heap ${(memUsage.heapUsed / 1024 / 1024).toFixed(1)}/${(memUsage.heapTotal / 1024 / 1024).toFixed(1)}MB`);
      console.log(`🔥 [PROD HEALTH] External: ${(memUsage.external / 1024 / 1024).toFixed(1)}MB`);
      console.log(`🔥 [PROD HEALTH] Active endpoints: ${requestCounts.size}`);
      console.log(`🔥 [PROD HEALTH] Process PID: ${process.pid}, CPU usage: ${process.cpuUsage().user}`);
      
      // Log endpoint usage stats
      const sortedRequests = Array.from(requestCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10);
      if (sortedRequests.length > 0) {
        console.log(`🔥 [PROD HEALTH] Top endpoints by usage:`);
        sortedRequests.forEach(([endpoint, count]) => {
          console.log(`🔥 [PROD HEALTH]   ${endpoint}: ${count} requests`);
        });
      }
      
      // Log top failing endpoints
      const sortedErrors = Array.from(errorCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
      if (sortedErrors.length > 0) {
        console.log(`🔥 [PROD HEALTH] Top failing endpoints:`);
        sortedErrors.forEach(([endpoint, count]) => {
          console.log(`🔥 [PROD HEALTH]   ${endpoint}: ${count} errors`);
        });
      }
      
      console.log(`🔥 [PROD HEALTH] ============================================`);
      lastHealthReport = Date.now();
    }
  }, 60000); // Every 1 minute in production
  
  // Clean up interval on server shutdown
  process.on('SIGTERM', () => {
    clearInterval(healthMonitor);
  });
  
  // Middleware to track API usage patterns in production
  app.use('/api/*', (req, res, next) => {
    const endpoint = req.path;
    requestCounts.set(endpoint, (requestCounts.get(endpoint) || 0) + 1);
    
    if (process.env.NODE_ENV === 'production') {
      console.log(`🔥 [PROD API TRACK] ${endpoint} - Count: ${requestCounts.get(endpoint)} - Time: ${new Date().toISOString()}`);
      
      // Log every 5th request for pattern analysis in production
      if (requestCounts.get(endpoint)! % 5 === 0) {
        console.log(`🔥 [PROD PATTERN] ${endpoint} hit ${requestCounts.get(endpoint)} times`);
        console.log(`🔥 [PROD STATS] Total endpoints: ${requestCounts.size}, Total errors: ${Array.from(errorCounts.values()).reduce((a, b) => a + b, 0)}`);
      }
      
      // Log request body for POST/PUT/PATCH requests
      if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        console.log(`🔥 [PROD ${req.method}] ${endpoint} - Body: ${JSON.stringify(req.body).substring(0, 200)}`);
      }
    }
    
    next();
  });
  // ============================================================================
  // HEALTH CHECK ROUTES (MUST BE FIRST)
  // ============================================================================

  /**
   * GET / - Root health check endpoint for deployment platforms
   * This route must be defined BEFORE the Vite catch-all route to ensure
   * health checks get a quick response without loading the React app
   */
  app.get("/", (req, res, next) => {
    const acceptHeader = req.get("Accept") || "";
    const userAgent = req.get("User-Agent") || "";
    
    // Simplified health check detection - respond to health checks immediately
    // Check for common health check patterns or non-browser requests
    const isHealthCheck =
      userAgent.includes("GoogleHC") ||
      userAgent.includes("Cloud-Run") ||
      userAgent.includes("kube-probe") ||
      userAgent.includes("health-check") ||
      userAgent.includes("curl") ||
      userAgent.includes("wget") ||
      userAgent.includes("HTTPClient") ||
      userAgent.includes("Go-http-client") ||
      // If no HTML is accepted or only JSON/plain text, likely a health check
      (!acceptHeader.includes("text/html") && 
       (acceptHeader.includes("application/json") || 
        acceptHeader.includes("text/plain") ||
        acceptHeader === ""));

    if (isHealthCheck) {
      // Ultra-fast health check response with readiness flag
      const status = isServerReady ? 200 : 503;
      return res.status(status).json({
        status: isServerReady ? "healthy" : "unhealthy",
        timestamp: new Date().toISOString(),
        service: "MDS AI Analytics",
        uptime: Math.floor((Date.now() - serverStartTime) / 1000)
      });
    }

    // For browser requests, continue to next middleware (Vite or static files)
    next();
  });

  /**
   * GET /health - Fast health check endpoint for Cloud Run
   */
  app.get("/health", (req, res) => {
    const status = isServerReady ? 200 : 503;
    res.status(status).json({
      status: isServerReady ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      service: "MDS AI Analytics",
      uptime: Math.floor((Date.now() - serverStartTime) / 1000)
    });
  });

  /**
   * GET /healthz - Simple unconditional health check (Kubernetes style)
   * Always returns 200 OK for simple liveness checks
   */
  app.get("/healthz", (req, res) => {
    res.status(200).send("OK");
  });

  /**
   * GET /readiness - Cloud Run readiness probe
   * Returns 200 when server is ready, 503 when not ready
   */
  app.get("/readiness", (req, res) => {
    const status = isServerReady ? 200 : 503;
    res.status(status).send(isServerReady ? "READY" : "NOT READY");
  });

  // ============================================================================
  // AUTHENTICATION ROUTES
  // ============================================================================

  /**
   * POST /api/auth/login - Authenticate user and return configuration
   */
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      const user = await userConfig.authenticateUser(username, password);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Store user in session (if using express-session)
      if (req.session) {
        (req.session as any).user = {
          username: user.username,
          role: user.role
        };
        
        // Explicitly save the session to ensure it's persisted
        await new Promise<void>((resolve, reject) => {
          req.session.save((err) => {
            if (err) {
              console.error('[LOGIN] Session save error:', err);
              reject(err);
            } else {
              console.log('[LOGIN] Session saved successfully');
              resolve();
            }
          });
        });
      }
      
      // Return user configuration (excluding password)
      const { password: _, ...userWithoutPassword } = user;
      console.log('[LOGIN] Returning user data:', JSON.stringify(userWithoutPassword, null, 2));
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error during login:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  /**
   * POST /api/auth/logout - Clear user session
   */
  app.post("/api/auth/logout", (req, res) => {
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ message: "Logout failed" });
        }
        res.json({ message: "Logged out successfully" });
      });
    } else {
      res.json({ message: "Logged out successfully" });
    }
  });

  /**
   * GET /api/auth/me - Get current user configuration
   */
  app.get("/api/auth/me", async (req, res) => {
    try {
      const sessionUser = (req.session as any)?.user;
      
      if (!sessionUser) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const user = await userConfig.getUserByUsername(sessionUser.username);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching current user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // ============================================================================
  // USER MANAGEMENT ROUTES (Admin Only)
  // ============================================================================

  /**
   * Middleware to check if user is admin
   */
  const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
    console.log('[AUTH] Checking admin access...');
    console.log('[AUTH] Session exists:', !!req.session);
    console.log('[AUTH] Session ID:', req.sessionID);
    console.log('[AUTH] Session data:', JSON.stringify(req.session));
    
    const sessionUser = (req.session as any)?.user;
    console.log('[AUTH] Session user:', sessionUser);
    
    if (!sessionUser) {
      console.log('[AUTH] No session user found - returning 401');
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    if (sessionUser.role !== 'admin') {
      console.log('[AUTH] User is not admin - returning 403');
      return res.status(403).json({ message: "Admin access required" });
    }
    
    console.log('[AUTH] Admin access granted');
    next();
  };

  /**
   * GET /api/users - Get all users (admin only)
   */
  app.get("/api/users", requireAdmin, async (req, res) => {
    try {
      const users = await userConfig.getAllUsers();
      
      // Remove passwords from response
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  /**
   * GET /api/users/:username - Get specific user (admin only)
   */
  app.get("/api/users/:username", requireAdmin, async (req, res) => {
    try {
      const { username } = req.params;
      const user = await userConfig.getUserByUsername(username);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  /**
   * POST /api/users - Create new user (admin only)
   */
  app.post("/api/users", requireAdmin, async (req, res) => {
    try {
      const userData = req.body;
      
      // Validate required fields
      if (!userData.username || !userData.password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      // Set defaults for new user
      const newUserData: Omit<UserConfiguration, 'id' | 'createdAt' | 'updatedAt'> = {
        username: userData.username,
        password: userData.password,
        role: userData.role || 'user',
        logoUrl: userData.logoUrl || '/assets/MDS Logo_1754254040718-Dv0l5qLn.png',
        practiceName: userData.practiceName || 'MDS AI Analytics',
        practiceSubtitle: userData.practiceSubtitle || null,
        ownerName: userData.ownerName || null,
        ownerTitle: userData.ownerTitle || null,
        ownerPhotoUrl: userData.ownerPhotoUrl || '/assets/Dr. John Josephson_1757862871625-B4_CVazU.jpeg',
        revenueTitle: userData.revenueTitle || 'Revenue',
        expensesTitle: userData.expensesTitle || 'Expenses',
        cashInTitle: userData.cashInTitle || 'Cash In',
        cashOutTitle: userData.cashOutTitle || 'Cash Out',
        topRevenueTitle: userData.topRevenueTitle || 'Top Revenue Procedures',
        revenueSubheadings: userData.revenueSubheadings || { ...defaultSubheadings.DEFAULT_REVENUE_SUBHEADINGS },
        expensesSubheadings: userData.expensesSubheadings || { ...defaultSubheadings.DEFAULT_EXPENSES_SUBHEADINGS },
        cashInSubheadings: userData.cashInSubheadings || { ...defaultSubheadings.DEFAULT_CASH_IN_SUBHEADINGS },
        cashOutSubheadings: userData.cashOutSubheadings || { ...defaultSubheadings.DEFAULT_CASH_OUT_SUBHEADINGS },
        cashFlowSubheadings: userData.cashFlowSubheadings || { ...defaultSubheadings.DEFAULT_CASH_FLOW_SUBHEADINGS },
        procedureNameOverrides: userData.procedureNameOverrides || {},
        locationNameOverrides: userData.locationNameOverrides || {},
        showCollectionsWidget: userData.showCollectionsWidget !== undefined ? userData.showCollectionsWidget : true,
        providers: userData.providers || [
          { name: 'Dr. John Josephson', percentage: 19 },
          { name: 'Dr. Meghan G. Moroux', percentage: 14 },
          { name: 'Dr. Hubert H. Pham', percentage: 13 },
          { name: 'Dr. Sabita Ittoop', percentage: 10 },
          { name: 'Dr. Kristen E. Dunbar', percentage: 9 },
          { name: 'Dr. Erin Ong', percentage: 9 },
          { name: 'Dr. Prema Modak', percentage: 8 },
          { name: 'Dr. Julia Pierce', percentage: 7 },
          { name: 'Dr. Heloi Stark', percentage: 6 },
          { name: 'Dr. Noushin Sahraei', percentage: 5 }
        ]
      };
      
      const newUser = await userConfig.createUser(newUserData);
      
      const { password: _, ...userWithoutPassword } = newUser;
      res.status(201).json(userWithoutPassword);
    } catch (error: any) {
      console.error("Error creating user:", error);
      if (error.message === 'Username already exists') {
        return res.status(409).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  /**
   * PUT /api/users/:username - Update user configuration (admin only)
   */
  app.put("/api/users/:username", requireAdmin, async (req, res) => {
    try {
      const { username } = req.params;
      const updates = req.body;
      
      // Don't allow changing username
      delete updates.username;
      delete updates.id;
      delete updates.createdAt;
      
      const updatedUser = await userConfig.updateUser(username, updates);
      
      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error: any) {
      console.error("Error updating user:", error);
      if (error.message === 'User not found') {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  /**
   * DELETE /api/users/:username - Delete user (admin only)
   */
  app.delete("/api/users/:username", requireAdmin, async (req, res) => {
    try {
      const { username } = req.params;
      
      const deleted = await userConfig.deleteUser(username);
      
      if (!deleted) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ message: "User deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting user:", error);
      if (error.message === 'Cannot delete admin user') {
        return res.status(403).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // ============================================================================
  // PRACTICE LOCATION ROUTES
  // ============================================================================

  /**
   * GET /api/locations - Retrieve all practice locations with custom name overrides
   * Returns practice locations with names customized per dashboard settings
   */
  app.get("/api/locations", async (req, res) => {
    const startTime = Date.now();
    
    if (process.env.NODE_ENV === 'production') {
      console.log(`🔥 [PROD LOCATIONS] Request started at ${new Date().toISOString()}`);
      console.log(`🔥 [PROD LOCATIONS] Storage object exists: ${!!storage}`);
      console.log(`🔥 [PROD LOCATIONS] Storage methods available: ${storage ? Object.getOwnPropertyNames(Object.getPrototypeOf(storage)).join(',') : 'N/A'}`);
    }
    
    try {
      const locations = await storage.getAllPracticeLocations();
      
      // Get dashboard customization to apply location name overrides
      const customization = await storage.getDashboardCustomization();
      const locationNameOverrides = customization.locationNameOverrides as Record<string, string> | null;
      
      // Apply custom names if overrides exist
      const locationsWithCustomNames = locations.map(location => {
        if (locationNameOverrides && locationNameOverrides[location.id]) {
          return {
            ...location,
            name: locationNameOverrides[location.id]
          };
        }
        return location;
      });
      
      const duration = Date.now() - startTime;
      
      if (process.env.NODE_ENV === 'production') {
        console.log(`🔥 [PROD LOCATIONS] Success in ${duration}ms - Count: ${locationsWithCustomNames.length}`);
        console.log(`🔥 [PROD LOCATIONS] Data sample: ${JSON.stringify(locationsWithCustomNames[0] || {}).substring(0, 150)}`);
      }
      
      res.json(locationsWithCustomNames);
    } catch (error: any) {
      const duration = Date.now() - startTime;
      errorCounts.set('/api/locations', (errorCounts.get('/api/locations') || 0) + 1);
      
      if (process.env.NODE_ENV === 'production') {
        console.error(`🔥 [PROD LOCATIONS ERROR] After ${duration}ms: ${error.message}`);
        console.error(`🔥 [PROD LOCATIONS ERROR] Type: ${error.constructor.name}`);
        console.error(`🔥 [PROD LOCATIONS ERROR] Stack: ${error.stack?.substring(0, 300)}`);
        console.error(`🔥 [PROD LOCATIONS ERROR] Storage status: ${storage ? 'EXISTS' : 'MISSING'}`);
      }
      
      console.error("Error fetching practice locations:", error);
      res.status(500).json({ message: "Failed to fetch practice locations" });
    }
  });

  /**
   * POST /api/locations - Create a new practice location
   */
  app.post("/api/locations", async (req, res) => {
    try {
      const locationData = req.body;

      if (!locationData.name || !locationData.address) {
        return res.status(400).json({ message: 'Name and address are required' });
      }

      // Generate ID from name if not provided
      const generateId = (name: string) => {
        return name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      };

      const customId = locationData.id || generateId(locationData.name);
      
      // Create location using storage
      const newLocation = await storage.createPracticeLocationWithId({
        name: locationData.name,
        address: locationData.address,
        city: locationData.city || '',
        state: locationData.state || '',
        zipCode: locationData.zipCode || '',
        phone: locationData.phone || null,
        isActive: locationData.isActive !== undefined ? locationData.isActive : true
      }, customId);

      console.log('[LOCATIONS] Created location:', newLocation);
      res.status(201).json(newLocation);
    } catch (error: any) {
      console.error('[LOCATIONS] Error creating location:', error);
      res.status(500).json({ message: 'Failed to create location', error: error.message });
    }
  });

  /**
   * PUT /api/locations - Update an existing practice location
   */
  app.put("/api/locations", async (req, res) => {
    try {
      const updates = req.body;
      const locationId = updates.id;

      if (!locationId) {
        return res.status(400).json({ message: 'Location ID is required in request body' });
      }

      // Update location using storage
      const updatedLocation = await storage.updatePracticeLocation(locationId, updates);
      
      console.log('[LOCATIONS] Updated location:', updatedLocation);
      res.status(200).json(updatedLocation);
    } catch (error: any) {
      console.error('[LOCATIONS] Error updating location:', error);
      if (error.message.includes('not found')) {
        return res.status(404).json({ message: 'Location not found' });
      }
      res.status(500).json({ message: 'Failed to update location', error: error.message });
    }
  });

  /**
   * DELETE /api/locations - Delete a practice location
   */
  app.delete("/api/locations", async (req, res) => {
    try {
      const { id: locationId } = req.body;

      if (!locationId) {
        return res.status(400).json({ message: 'Location ID is required in request body' });
      }

      // Debug: Check what locations exist
      const allLocations = await storage.getAllPracticeLocations();
      console.log('[LOCATIONS] All locations before delete:', allLocations.map(l => ({ id: l.id, name: l.name })));
      console.log('[LOCATIONS] Attempting to delete ID:', locationId);

      // Delete location using storage
      const deleted = await storage.deletePracticeLocation(locationId);
      
      if (!deleted) {
        console.log('[LOCATIONS] Location not found for deletion:', locationId);
        return res.status(404).json({ message: 'Location not found' });
      }
      
      console.log('[LOCATIONS] Successfully deleted location:', locationId);
      res.status(200).json({ message: 'Location deleted successfully', id: locationId });
    } catch (error: any) {
      console.error('[LOCATIONS] Error deleting location:', error);
      res.status(500).json({ message: 'Failed to delete location', error: error.message });
    }
  });

  // ============================================================================
  // ANALYTICS AND METRICS ROUTES
  // ============================================================================

  /**
   * GET /api/analytics/top-procedures/:locationId/:category - Get top revenue-generating procedures
   * Path params: locationId (or 'all'), category (medical|cosmetic|all)
   * Query params: timeRange (1|3|6|12 months)
   */
  app.get(
    "/api/analytics/top-procedures/:locationId/:category",
    async (req, res) => {
      try {
        const { locationId, category } = req.params;
        const { timeRange = "1" } = req.query;
        const finalLocationId = locationId === "all" ? undefined : locationId;
        const procedureCategory =
          category === "all"
            ? undefined
            : (category as "medical" | "cosmetic" | "refractive");

        const topProcedures = await storage.getTopRevenueProcedures(
          finalLocationId,
          procedureCategory,
          parseInt(timeRange as string),
        );

        res.json(topProcedures);
      } catch (error) {
        console.error("Error fetching top procedures:", error);
        res
          .status(500)
          .json({ message: "Failed to fetch top procedures data" });
      }
    },
  );

  // ============================================================================
  // FINANCIAL ANALYSIS ROUTES
  // ============================================================================

  // Helper function to validate financial route parameters
  const validateFinancialParams = (locationId: string, period: string) => {
    const validPeriods = ["1M", "3M", "6M", "1Y", "CUSTOM"];
    if (!validPeriods.includes(period.toUpperCase())) {
      return {
        valid: false,
        error: `Invalid period. Must be one of: ${validPeriods.join(", ")}`,
      };
    }

    // Allow 'all', UUIDs, and location slugs like 'fairfax', 'gainesville'
    if (locationId !== "all" && !locationId.match(/^[a-z0-9-]+$/i)) {
      return { valid: false, error: "Invalid locationId format" };
    }

    return { valid: true };
  };

  /**
   * GET /api/financial/revenue/:locationId/:period - Get financial revenue data
   * Path params: locationId (or 'all'), period (1M|3M|6M|1Y|custom)
   */
  app.get("/api/financial/revenue/:locationId/:period", async (req, res) => {
    const startTime = Date.now();
    const endpoint = `/api/financial/revenue/${req.params.locationId}/${req.params.period}`;
    
    if (process.env.NODE_ENV === 'production') {
      console.log(`🔥 [PROD REVENUE] Request: ${endpoint} at ${new Date().toISOString()}`);
      console.log(`🔥 [PROD REVENUE] Params - Location: ${req.params.locationId}, Period: ${req.params.period}`);
    }
    
    try {
      const { locationId, period } = req.params;

      const validation = validateFinancialParams(locationId, period);
      if (!validation.valid) {
        if (process.env.NODE_ENV === 'production') {
          console.log(`🔥 [PROD REVENUE ERROR] Validation failed: ${validation.error}`);
        }
        errorCounts.set(endpoint, (errorCounts.get(endpoint) || 0) + 1);
        return res.status(400).json({ message: validation.error });
      }

      const finalLocationId = locationId === "all" ? undefined : locationId.toLowerCase();
      
      if (process.env.NODE_ENV === 'production') {
        console.log(`🔥 [PROD REVENUE] Calling storage.getFinancialRevenueData(${finalLocationId}, ${period.toUpperCase()})`);
      }
      
      const revenueData = await storage.getFinancialRevenueData(finalLocationId, period.toUpperCase());
      const duration = Date.now() - startTime;
      
      if (process.env.NODE_ENV === 'production') {
        console.log(`🔥 [PROD REVENUE] SUCCESS in ${duration}ms - Categories: ${revenueData?.categories?.length || 0}`);
        console.log(`🔥 [PROD REVENUE] Data keys: ${Object.keys(revenueData || {}).join(',')}`);
        console.log(`🔥 [PROD REVENUE] Sample category: ${JSON.stringify(revenueData?.categories?.[0] || {}).substring(0, 100)}`);
      }
      
      res.json(revenueData);
    } catch (error: any) {
      const duration = Date.now() - startTime;
      errorCounts.set(endpoint, (errorCounts.get(endpoint) || 0) + 1);
      
      if (process.env.NODE_ENV === 'production') {
        console.error(`🔥 [PROD REVENUE CRITICAL ERROR] After ${duration}ms: ${error.message}`);
        console.error(`🔥 [PROD REVENUE CRITICAL ERROR] Type: ${error.constructor.name}`);
        console.error(`🔥 [PROD REVENUE CRITICAL ERROR] Stack: ${error.stack?.substring(0, 300)}`);
        console.error(`🔥 [PROD REVENUE CRITICAL ERROR] Storage exists: ${!!storage}`);
      }
      
      console.error("Error fetching financial revenue data:", error);
      res.status(500).json({ message: "Failed to fetch financial revenue data" });
    }
  });

  /**
   * GET /api/financial/expenses/:locationId/:period - Get financial expenses data
   * Path params: locationId (or 'all'), period (1M|3M|6M|1Y|custom)
   */
  app.get("/api/financial/expenses/:locationId/:period", async (req, res) => {
    try {
      const { locationId, period } = req.params;

      const validation = validateFinancialParams(locationId, period);
      if (!validation.valid) {
        return res.status(400).json({ message: validation.error });
      }

      const finalLocationId =
        locationId === "all" ? undefined : locationId.toLowerCase();
      const expensesData = await storage.getFinancialExpensesData(
        finalLocationId,
        period.toUpperCase(),
      );
      res.json(expensesData);
    } catch (error) {
      console.error("Error fetching financial expenses data:", error);
      res
        .status(500)
        .json({ message: "Failed to fetch financial expenses data" });
    }
  });

  /**
   * GET /api/financial/profit-loss/:locationId/:period - Get profit & loss statement data
   * Path params: locationId (or 'all'), period (1M|3M|6M|1Y|custom)
   */
  app.get(
    "/api/financial/profit-loss/:locationId/:period",
    async (req, res) => {
      try {
        const { locationId, period } = req.params;

        const validation = validateFinancialParams(locationId, period);
        if (!validation.valid) {
          return res.status(400).json({ message: validation.error });
        }

        const finalLocationId =
          locationId === "all" ? undefined : locationId.toLowerCase();
        const profitLossData = await storage.getProfitLossData(
          finalLocationId,
          period.toUpperCase(),
        );
        res.json(profitLossData);
      } catch (error) {
        console.error("Error fetching profit & loss data:", error);
        res.status(500).json({ message: "Failed to fetch profit & loss data" });
      }
    },
  );

  /**
   * GET /api/financial/cash-in/:locationId/:period - Get cash inflow data
   * Path params: locationId (or 'all'), period (1M|3M|6M|1Y|custom)
   */
  app.get("/api/financial/cash-in/:locationId/:period", async (req, res) => {
    try {
      const { locationId, period } = req.params;

      const validation = validateFinancialParams(locationId, period);
      if (!validation.valid) {
        return res.status(400).json({ message: validation.error });
      }

      const finalLocationId =
        locationId === "all" ? undefined : locationId.toLowerCase();
      const cashInData = await storage.getCashInData(
        finalLocationId,
        period.toUpperCase(),
      );
      res.json(cashInData);
    } catch (error) {
      console.error("Error fetching cash in data:", error);
      res.status(500).json({ message: "Failed to fetch cash in data" });
    }
  });

  /**
   * GET /api/financial/cash-out/:locationId/:period - Get cash outflow data
   * Path params: locationId (or 'all'), period (1M|3M|6M|1Y|custom)
   */
  app.get("/api/financial/cash-out/:locationId/:period", async (req, res) => {
    try {
      const { locationId, period } = req.params;

      const validation = validateFinancialParams(locationId, period);
      if (!validation.valid) {
        return res.status(400).json({ message: validation.error });
      }

      const finalLocationId =
        locationId === "all" ? undefined : locationId.toLowerCase();
      const cashOutData = await storage.getCashOutData(
        finalLocationId,
        period.toUpperCase(),
      );
      res.json(cashOutData);
    } catch (error) {
      console.error("Error fetching cash out data:", error);
      res.status(500).json({ message: "Failed to fetch cash out data" });
    }
  });

  /**
   * GET /api/financial/cash-flow/:locationId/:period - Get cash flow statement data
   * Path params: locationId (or 'all'), period (1M|3M|6M|1Y|custom)
   */
  app.get("/api/financial/cash-flow/:locationId/:period", async (req, res) => {
    try {
      const { locationId, period } = req.params;

      const validation = validateFinancialParams(locationId, period);
      if (!validation.valid) {
        return res.status(400).json({ message: validation.error });
      }

      const finalLocationId =
        locationId === "all" ? undefined : locationId.toLowerCase();
      const cashFlowData = await storage.getCashFlowData(
        finalLocationId,
        period.toUpperCase(),
      );
      res.json(cashFlowData);
    } catch (error) {
      console.error("Error fetching cash flow data:", error);
      res.status(500).json({ message: "Failed to fetch cash flow data" });
    }
  });

  /**
   * GET /api/analytics/revenue-trends/:locationId/:period - Get monthly revenue trend data
   * Path params: locationId (or 'all'), period (1yr|2yr|5yr)
   */
  app.get(
    "/api/analytics/revenue-trends/:locationId/:period",
    async (req, res) => {
      try {
        const { locationId, period } = req.params;
        const finalLocationId = locationId === "all" ? undefined : locationId;

        const revenueData =
          await storage.getMonthlyRevenueData(finalLocationId);

        // Filter data based on period - include projections beyond current date
        let filteredData = revenueData;
        // Dynamic filtering based on current date and projection needs
        const now = new Date(2025, 7, 3); // August 3, 2025
        const currentMonthStr = now.toISOString().slice(0, 7); // "2025-08"

        if (period === "1yr") {
          // Show 13 months: 12 historical + current + 1 future projection
          const currentIndex = revenueData.findIndex(
            (item) => item.month === currentMonthStr,
          );
          if (currentIndex >= 0) {
            const startIndex = Math.max(0, currentIndex - 11); // 11 months before current
            const endIndex = Math.min(revenueData.length - 1, currentIndex + 2); // Include 2 future months
            filteredData = revenueData.slice(startIndex, endIndex + 1);
          } else {
            filteredData = revenueData.slice(-13);
          }
        } else if (period === "2yr") {
          // Show 25 months: 24 historical + current + 1 future projection
          const currentIndex = revenueData.findIndex(
            (item) => item.month === currentMonthStr,
          );
          if (currentIndex >= 0) {
            const startIndex = Math.max(0, currentIndex - 23); // 23 months before current
            const endIndex = Math.min(revenueData.length - 1, currentIndex + 2); // Include 2 future months
            filteredData = revenueData.slice(startIndex, endIndex + 1);
          } else {
            filteredData = revenueData.slice(-25);
          }
        } else if (period === "5yr") {
          // Show all available data with projections
          filteredData = revenueData;
        }

        res.json(filteredData);
      } catch (error) {
        console.error("Error fetching revenue trends:", error);
        res
          .status(500)
          .json({ message: "Failed to fetch revenue trends data" });
      }
    },
  );

  /**
   * GET /api/analytics/clinical-metrics/:locationId/:period - Get clinical metrics data with real P&L
   * Path params: locationId (or 'all'), period (1yr only for now)
   * Returns: Revenue, Patient Count, EBITDA, Write-offs from real P&L data
   */
  app.get(
    "/api/analytics/clinical-metrics/:locationId/:period",
    async (req, res) => {
      try {
        const { locationId, period } = req.params;
        const finalLocationId = locationId === "all" ? undefined : locationId;

        const clinicalData = await storage.getClinicalMetricsData(
          finalLocationId,
          period,
        );
        res.json(clinicalData);
      } catch (error) {
        console.error("Error fetching clinical metrics:", error);
        res
          .status(500)
          .json({ message: "Failed to fetch clinical metrics data" });
      }
    },
  );

  /**
   * GET /api/analytics/insurance-breakdown/:locationId - Get insurance payer analysis
   * Path params: locationId (or 'all')
   */
  app.get(
    "/api/analytics/insurance-breakdown/:locationId",
    async (req, res) => {
      try {
        const { locationId } = req.params;
        const { timeRange = "1" } = req.query;
        const finalLocationId = locationId === "all" ? undefined : locationId;

        const insuranceData = await storage.getInsurancePayerBreakdown(
          finalLocationId,
          parseInt(timeRange as string),
        );
        res.json(insuranceData);
      } catch (error) {
        console.error("Error fetching insurance breakdown:", error);
        res
          .status(500)
          .json({ message: "Failed to fetch insurance breakdown data" });
      }
    },
  );

  /**
   * GET /api/analytics/projections/:locationId - Get patient volume and revenue projections
   * Path params: locationId (or 'all')
   */
  app.get("/api/analytics/projections/:locationId", async (req, res) => {
    try {
      const { locationId } = req.params;
      const finalLocationId = locationId === "all" ? undefined : locationId;

      const projections =
        await storage.getPatientVolumeProjections(finalLocationId);
      res.json(projections);
    } catch (error) {
      console.error("Error fetching projections:", error);
      res.status(500).json({ message: "Failed to fetch projections data" });
    }
  });

  /**
   * GET /api/analytics/key-metrics/:locationId - Get key performance indicators
   * Path params: locationId (or 'all')
   * Query params: timeRange (1|3|6|12 months)
   */
  app.get("/api/analytics/key-metrics/:locationId", async (req, res) => {
    try {
      const { locationId } = req.params;
      const { timeRange = "1" } = req.query;
      const finalLocationId = locationId === "all" ? undefined : locationId;

      // Use centralized data consistency engine for key metrics with time range
      const metrics = await storage.getKeyMetrics(
        finalLocationId,
        parseInt(timeRange as string),
      );

      res.json(metrics);
    } catch (error) {
      console.error("Error fetching key metrics:", error);
      res.status(500).json({ message: "Failed to fetch key metrics data" });
    }
  });

  /**
   * GET /api/analytics/ar-buckets/:locationId - Get AR aging buckets for outstanding claims
   * Path params: locationId (or 'all')
   */
  app.get("/api/analytics/ar-buckets/:locationId", async (req, res) => {
    try {
      const { locationId } = req.params;
      const finalLocationId = locationId === "all" ? "all" : locationId;

      const arData = await storage.getARBucketsData(finalLocationId);
      res.json(arData);
    } catch (error) {
      console.error("Error fetching AR buckets data:", error);
      res.status(500).json({ message: "Failed to fetch AR buckets data" });
    }
  });

  /**
   * GET /api/analytics/collections-breakdown/:locationId - Get collections breakdown by provider
   * Path params: locationId (or 'all')
   * Query params: timeRange (optional)
   */
  app.get("/api/analytics/collections-breakdown/:locationId", async (req, res) => {
    try {
      const { locationId } = req.params;
      const { timeRange } = req.query;
      const finalLocationId = locationId === "all" ? undefined : locationId;
      
      // Get current user from session to use their provider configuration
      const sessionUser = (req.session as any)?.user;
      const username = sessionUser?.username || 'admin';
      
      // Get user configuration for provider data
      const user = await userConfig.getUserByUsername(username);
      const providers = user?.providers || [
        { name: 'Dr. John Josephson', percentage: 19 },
        { name: 'Dr. Meghan G. Moroux', percentage: 14 },
        { name: 'Dr. Hubert H. Pham', percentage: 13 },
        { name: 'Dr. Sabita Ittoop', percentage: 10 },
        { name: 'Dr. Kristen E. Dunbar', percentage: 9 },
        { name: 'Dr. Erin Ong', percentage: 9 },
        { name: 'Dr. Prema Modak', percentage: 8 },
        { name: 'Dr. Julia Pierce', percentage: 7 },
        { name: 'Dr. Heloi Stark', percentage: 6 },
        { name: 'Dr. Noushin Sahraei', percentage: 5 }
      ];

      const collectionsData = await storage.getCollectionsBreakdown(finalLocationId, timeRange as string, providers);
      res.json(collectionsData);
    } catch (error) {
      console.error("Error fetching collections breakdown:", error);
      res.status(500).json({ message: "Failed to fetch collections breakdown" });
    }
  });

  /**
   * Patient Billing Analytics endpoint
   */
  app.get("/api/analytics/patient-billing/:locationId", async (req, res) => {
    try {
      const { locationId } = req.params;
      const { timeRange = "30" } = req.query;

      const data = await storage.getPatientBillingData(
        locationId,
        timeRange as string,
      );

      res.json(data);
    } catch (error) {
      console.error("Error fetching patient billing data:", error);
      res.status(500).json({ error: "Failed to fetch patient billing data" });
    }
  });

  /**
   * GET /api/analytics/insurance-claims/:locationId - Get insurance claims breakdown by status
   * Path params: locationId (or 'all')
   * Query params: startDate, endDate (ISO date strings)
   */
  app.get("/api/analytics/insurance-claims/:locationId", async (req, res) => {
    try {
      const { locationId } = req.params;
      const { startDate, endDate } = req.query;

      // Parse date parameters if provided
      let parsedStartDate: Date | undefined;
      let parsedEndDate: Date | undefined;

      if (startDate && typeof startDate === "string") {
        parsedStartDate = new Date(startDate);
      }
      if (endDate && typeof endDate === "string") {
        parsedEndDate = new Date(endDate);
      }

      const claimsData = await storage.getInsuranceClaimsData(
        locationId,
        parsedStartDate,
        parsedEndDate,
      );
      res.json(claimsData);
    } catch (error) {
      console.error("Error fetching insurance claims data:", error);
      res.status(500).json({ error: "Failed to fetch insurance claims data" });
    }
  });

  // ============================================================================
  // AI BUSINESS ASSISTANT ROUTES
  // ============================================================================

  /**
   * POST /api/ai/query - Submit a query to the AI business assistant with enhanced routing
   * Body: { query: string, userId?: string, locationId?: string, timeRange?: string }
   */
  app.post("/api/ai/query", async (req, res) => {
    const startTime = Date.now();
    
    // Early return if OpenAI is not configured
    if (!openai || !hasValidOpenAIKey) {
      if (process.env.NODE_ENV === 'production') {
        console.log(`🔥 [PROD AI] OpenAI not configured - returning 503`);
      }
      return res.status(503).json({ 
        message: "AI assistant is temporarily unavailable. OpenAI API key not configured.",
        queryType: "error",
        response: "The AI assistant feature requires an OpenAI API key to function. Please contact your administrator to configure this service."
      });
    }
    
    if (process.env.NODE_ENV === 'production') {
      console.log(`🔥 [PROD AI] ============================================`);
      console.log(`🔥 [PROD AI] Query started at ${new Date().toISOString()}`);
      console.log(`🔥 [PROD AI] Request IP: ${req.ip}, User-Agent: ${req.get('User-Agent')?.substring(0, 50)}`);
      console.log(`🔥 [PROD AI] Request body keys: ${Object.keys(req.body).join(',')}`);
      console.log(`🔥 [PROD AI] Query length: ${req.body.query?.length || 0}`);
      console.log(`🔥 [PROD AI] OpenAI client: CONFIGURED`);
      console.log(`🔥 [PROD AI] Storage available: ${!!storage}`);
    }
    
    try {
      const { query, userId, locationId = "all", timeRange = "1" } = req.body;

      if (!query || typeof query !== "string") {
        if (process.env.NODE_ENV === 'production') {
          console.log(`🔥 [PROD AI ERROR] Invalid query - Type: ${typeof query}, Length: ${query?.length || 0}`);
        }
        errorCounts.set('/api/ai/query', (errorCounts.get('/api/ai/query') || 0) + 1);
        return res.status(400).json({ message: "Query is required and must be a string" });
      }

      if (process.env.NODE_ENV === 'production') {
        console.log(`🔥 [PROD AI] Processing: "${query.substring(0, 100)}..."`);
        console.log(`🔥 [PROD AI] Params - Location: ${locationId}, TimeRange: ${timeRange}, User: ${userId || 'anonymous'}`);
      }

      // Get available locations for AI context
      const availableLocations = await storage.getAllPracticeLocations();
      
      if (process.env.NODE_ENV === 'production') {
        console.log(`🔥 [PROD AI] Locations fetched: ${availableLocations.length}`);
      }

      // Process query using new AI assistant utility
      const aiResponse = await processAIQuery(
        query,
        availableLocations,
        storage,
        locationId,
        timeRange,
      );
      
      const duration = Date.now() - startTime;
      
      if (process.env.NODE_ENV === 'production') {
        console.log(`🔥 [PROD AI] SUCCESS in ${duration}ms`);
        console.log(`🔥 [PROD AI] Response type: ${aiResponse.queryType}`);
        console.log(`🔥 [PROD AI] Response length: ${aiResponse.response.length} chars`);
        console.log(`🔥 [PROD AI] Response preview: ${aiResponse.response.substring(0, 150)}...`);
      }

      // Store the query and response for analytics
      if (userId) {
        if (process.env.NODE_ENV === 'production') {
          console.log(`🔥 [PROD AI] Storing query for user: ${userId}`);
        }
        await storage.createAiQuery({
          userId,
          query,
          response: aiResponse.response,
          queryType: aiResponse.queryType,
        });
      }

      res.json(aiResponse);
      
      if (process.env.NODE_ENV === 'production') {
        console.log(`🔥 [PROD AI] ============================================`);
      }
    } catch (error: any) {
      const duration = Date.now() - startTime;
      errorCounts.set('/api/ai/query', (errorCounts.get('/api/ai/query') || 0) + 1);
      
      if (process.env.NODE_ENV === 'production') {
        console.error(`🔥 [PROD AI CRITICAL ERROR] ========================`);
        console.error(`🔥 [PROD AI CRITICAL ERROR] After ${duration}ms`);
        console.error(`🔥 [PROD AI CRITICAL ERROR] Error name: ${error.name}`);
        console.error(`🔥 [PROD AI CRITICAL ERROR] Error message: ${error.message}`);
        console.error(`🔥 [PROD AI CRITICAL ERROR] Error code: ${error.code || 'N/A'}`);
        console.error(`🔥 [PROD AI CRITICAL ERROR] HTTP status: ${error.status || 'N/A'}`);
        console.error(`🔥 [PROD AI CRITICAL ERROR] Error type: ${error.constructor.name}`);
        console.error(`🔥 [PROD AI CRITICAL ERROR] Full error: ${JSON.stringify(error, null, 2).substring(0, 500)}`);
        
        // Specific error pattern checks
        if (error.message?.includes('rate limit') || error.message?.includes('quota') || error.status === 429) {
          console.error(`🔥 [PROD AI RATE LIMIT] OPENAI RATE LIMIT HIT!`);
          console.error(`🔥 [PROD AI RATE LIMIT] This is likely the "Rate Exceeded" error you're seeing`);
        }
        
        if (error.message?.includes('api key') || error.status === 401) {
          console.error(`🔥 [PROD AI AUTH] OPENAI API KEY PROBLEM!`);
          console.error(`🔥 [PROD AI AUTH] Key exists: ${!!openai.apiKey}`);
          console.error(`🔥 [PROD AI AUTH] Key is default: ${openai.apiKey === 'default_key'}`);
        }
        
        if (error.message?.includes('network') || error.code === 'ECONNREFUSED') {
          console.error(`🔥 [PROD AI NETWORK] NETWORK/CONNECTION ERROR!`);
        }
        
        console.error(`🔥 [PROD AI CRITICAL ERROR] Stack trace: ${error.stack?.substring(0, 800)}`);
        console.error(`🔥 [PROD AI CRITICAL ERROR] ========================`);
      }
      
      console.error("Error processing AI query:", error);
      const {
        locationId: fallbackLocationId = "all",
        timeRange: fallbackTimeRange = "1",
      } = req.body;

      res.status(500).json({
        response:
          "I apologize, but I'm experiencing technical difficulties. Please try your question again.",
        queryType: "error",
        confidence: 0,
        locationContext: fallbackLocationId,
        timeContext: fallbackTimeRange,
        recommendations: [
          "Check your internet connection",
          "Try rephrasing your question",
          "Contact support if the issue persists",
        ],
        keyMetrics: {},
      });
    }
  });

  /**
   * GET /api/ai/popular-questions - Get list of popular/suggested questions
   */
  app.get("/api/ai/popular-questions", async (req, res) => {
    try {
      const popularQuestions = [
        {
          id: "patient-forecast",
          question: "Patient forecast for next month",
          icon: "chart-line",
          category: "forecasting",
        },
        {
          id: "top-revenue",
          question: "Top revenue procedures this quarter",
          icon: "dollar-sign",
          category: "revenue",
        },
        {
          id: "ar-days",
          question: "AR days by insurance payer",
          icon: "clock",
          category: "operations",
        },
        {
          id: "lasik-analytics",
          question: "LASIK surgery analytics",
          icon: "zap",
          category: "procedures",
        },
        {
          id: "refractive-vs-medical",
          question: "Bad debt analysis",
          icon: "balance-scale",
          category: "revenue",
        },
        {
          id: "best-location",
          question: "Best performing location",
          icon: "trophy",
          category: "locations",
        },
      ];

      res.json(popularQuestions);
    } catch (error) {
      console.error("Error fetching popular questions:", error);
      res.status(500).json({ message: "Failed to fetch popular questions" });
    }
  });

  /**
   * GET /api/ai/query-history/:userId - Get AI query history for a user
   */
  app.get("/api/ai/query-history/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const queries = await storage.getAiQueriesByUser(userId);

      // Return recent queries (last 20)
      const recentQueries = queries
        .sort(
          (a, b) =>
            new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime(),
        )
        .slice(0, 20);

      res.json(recentQueries);
    } catch (error) {
      console.error("Error fetching query history:", error);
      res.status(500).json({ message: "Failed to fetch query history" });
    }
  });

  // ============================================================================
  // PROCEDURE MANAGEMENT ROUTES
  // ============================================================================

  /**
   * GET /api/procedures - Get all procedures or filter by category
   * Query params: category (medical|cosmetic)
   */
  app.get("/api/procedures", async (req, res) => {
    try {
      const { category } = req.query;

      let procedures;
      if (
        category &&
        (category === "medical" ||
          category === "cosmetic" ||
          category === "refractive")
      ) {
        procedures = await storage.getProceduresByCategory(category);
      } else {
        procedures = await storage.getAllProcedures();
      }

      res.json(procedures);
    } catch (error) {
      console.error("Error fetching procedures:", error);
      res.status(500).json({ message: "Failed to fetch procedures" });
    }
  });

  // ============================================================================
  // HEALTH CHECK AND STATUS ROUTES
  // ============================================================================

  /**
   * GET /api/health - Fast API health check endpoint for Cloud Run
   */
  app.get("/api/health", (req, res) => {
    const status = isServerReady ? 200 : 503;
    res.status(status).json({
      status: isServerReady ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      service: "MDS AI Analytics API",
      uptime: Math.floor((Date.now() - serverStartTime) / 1000),
      ready: isServerReady
    });
  });

  /**
   * GET /api/status - System status and configuration
   */
  app.get("/api/status", async (req, res) => {
    try {
      const locations = await storage.getAllPracticeLocations();
      const procedures = await storage.getAllProcedures();

      res.json({
        system: "MDS AI Analytics",
        version: "1.0.0",
        practiceLocations: locations.length,
        availableProcedures: procedures.length,
        aiAssistantEnabled: !!process.env.OPENAI_API_KEY,
        lastUpdated: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error fetching system status:", error);
      res.status(500).json({ message: "Failed to fetch system status" });
    }
  });

  // ============================================================================
  // DASHBOARD CUSTOMIZATION ROUTES
  // ============================================================================

  /**
   * GET /api/dashboard/customization - Get current user's dashboard customization
   * Returns authenticated user's configuration
   */
  app.get("/api/dashboard/customization", async (req, res) => {
    try {
      const sessionUser = (req.session as any)?.user;
      
      // If no session, return default admin config for backwards compatibility
      if (!sessionUser) {
        const customization = await storage.getDashboardCustomization();
        return res.json(customization);
      }
      
      const user = await userConfig.getUserByUsername(sessionUser.username);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Return user configuration as customization (excluding password and sensitive fields)
      const { password, id, username, role, createdAt, ...customization } = user;
      res.json(customization);
    } catch (error) {
      console.error("Error fetching dashboard customization:", error);
      res.status(500).json({ message: "Failed to fetch dashboard customization" });
    }
  });

  /**
   * PUT /api/dashboard/customization - Update dashboard customization settings
   * Request body: JSON with customization fields to update
   * Validates that practiceName is provided if included
   */
  app.put("/api/dashboard/customization", async (req, res) => {
    try {
      const updateData = req.body;
      
      // Validate that if practiceName is provided, it's not empty
      if (updateData.practiceName !== undefined && !updateData.practiceName.trim()) {
        return res.status(400).json({ message: "Practice name cannot be empty" });
      }
      
      const updatedCustomization = await storage.updateDashboardCustomization(updateData);
      res.json(updatedCustomization);
    } catch (error) {
      console.error("Error updating dashboard customization:", error);
      res.status(500).json({ message: "Failed to update dashboard customization" });
    }
  });

  /**
   * POST /api/dashboard/customization/upload-image - Upload image for dashboard customization
   * Handles logo and owner photo uploads
   * Request: multipart/form-data with 'image' field
   * Returns: { url, filename } with the public URL and filename of uploaded image
   */
  app.post("/api/dashboard/customization/upload-image", upload.single('image'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }
      
      // Return the public URL for the uploaded image
      const publicUrl = `/assets/${req.file.filename}`;
      
      res.json({
        url: publicUrl,
        filename: req.file.filename
      });
    } catch (error: any) {
      console.error("Error uploading image:", error);
      res.status(500).json({ 
        message: error.message || "Failed to upload image" 
      });
    }
  });

  // ============================================================================
  // P&L DATA IMPORT ROUTES
  // ============================================================================

  /**
   * POST /api/pl/import-csv - Legacy CSV import endpoint (data now embedded)
   * Returns success message since data is now permanently embedded in the app
   */
  app.post("/api/pl/import-csv", async (req, res) => {
    res.json({
      message: "P&L data imported successfully",
      recordsImported: 300,
      locationId: "fairfax",
      note: "Data is now permanently embedded in the application",
    });
  });

  /**
   * GET /api/pl/monthly-data - Get P&L monthly data
   * Returns P&L data filtered by location and/or month
   */
  app.get("/api/pl/monthly-data", async (req, res) => {
    try {
      const { locationId, monthYear } = req.query;
      const data = await storage.getPlMonthlyData(
        locationId as string,
        monthYear as string,
      );
      res.json(data);
    } catch (error) {
      console.error("Error fetching P&L monthly data:", error);
      res.status(500).json({ message: "Failed to fetch P&L data" });
    }
  });

  // ============================================================================
  // CASH FLOW DATA IMPORT ROUTES
  // ============================================================================

  /**
   * POST /api/cashflow/import-csv - Import cash flow data from CSV file
   */
  app.post("/api/cashflow/import-csv", async (req, res) => {
    try {
      // Use Fairfax location as default
      const locationId = "fairfax";

      // Import cash flow data from CSV (conditional import to avoid database requirement)
      const fs = await import("fs");
      const path = await import("path");
      const csvPath = path.join(process.cwd(), "Cashflow-Eye-Specialists.csv");

      if (!fs.existsSync(csvPath)) {
        return res
          .status(404)
          .json({ message: "Cash flow CSV file not found" });
      }

      // Dynamic import to avoid database requirement at startup
      const { importCashFlowDataFromCsv, getCashFlowData } = await import("./csvImport");
      const result = await importCashFlowDataFromCsv(csvPath, locationId);

      // Transfer imported data to storage layer for time-based filtering
      const importedData = getCashFlowData();

      // Helper function to normalize month format to YYYY-MM
      const normalizeMonthFormat = (monthYear: string | undefined): string => {
        // Handle null/undefined values
        if (!monthYear || typeof monthYear !== "string") {
          return ""; // Return empty string for invalid inputs
        }

        // Handle formats like "September 2024" or "Sep-2024"
        const monthMap: Record<string, string> = {
          january: "01",
          jan: "01",
          february: "02",
          feb: "02",
          march: "03",
          mar: "03",
          april: "04",
          apr: "04",
          may: "05",
          june: "06",
          jun: "06",
          july: "07",
          jul: "07",
          august: "08",
          aug: "08",
          september: "09",
          sep: "09",
          october: "10",
          oct: "10",
          november: "11",
          nov: "11",
          december: "12",
          dec: "12",
        };

        // Handle "September 2024" format
        if (monthYear.includes(" ")) {
          const [month, year] = monthYear.split(" ");
          const monthNum = monthMap[month.toLowerCase()];
          return monthNum ? `${year}-${monthNum}` : monthYear;
        }

        // Handle "Sep-2024" format
        if (monthYear.includes("-")) {
          const [month, year] = monthYear.split("-");
          const monthNum = monthMap[month.toLowerCase()];
          return monthNum ? `${year}-${monthNum}` : monthYear;
        }

        return monthYear; // Return as-is if format is unrecognized
      };

      // Convert to storage format with normalized month format
      const storageData = importedData
        .filter((item) => item && (item.month || item.monthYear)) // Filter out items with invalid month data
        .map((item) => ({
          locationId: item.locationId,
          lineItem: item.lineItem,
          category: item.category,
          monthYear: normalizeMonthFormat(item.month || item.monthYear || ""), // Use correct field name
          amount: item.amount,
        }))
        .filter((item) => item.monthYear !== ""); // Filter out items that couldn't be normalized

      console.log(
        `Importing ${storageData.length} cash flow records to storage with normalized months`,
      );

      await storage.importCashFlowDataToStorage(storageData);

      res.json(result);
    } catch (error) {
      console.error("Error importing cash flow CSV data:", error);
      res.status(500).json({ message: "Failed to import cash flow data" });
    }
  });

  /**
   * GET /api/financial/cashflow/:locationId/:period - Get cash flow data with proper time filtering
   */
  app.get("/api/financial/cashflow/:locationId/:period", async (req, res) => {
    try {
      const { locationId, period } = req.params;

      const validation = validateFinancialParams(locationId, period);
      if (!validation.valid) {
        return res.status(400).json({ message: validation.error });
      }

      const finalLocationId =
        locationId === "all" ? undefined : locationId.toLowerCase();
      const cashFlowData = await storage.getCashFlowData(
        finalLocationId,
        period.toUpperCase(),
      );
      res.json(cashFlowData);
    } catch (error) {
      console.error("Error fetching cash flow data:", error);
      res.status(500).json({ message: "Failed to fetch cash flow data" });
    }
  });

  // Create HTTP server instance
  const httpServer = createServer(app);

  return httpServer;
}
