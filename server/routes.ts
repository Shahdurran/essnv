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
import type { Express } from "express";
// HTTP server creation for advanced server features
import { createServer, type Server } from "http";
// Our custom storage layer for data persistence
import { storage } from "./storage";
// OpenAI SDK for AI assistant functionality
import OpenAI from "openai";
// Zod schema for AI query validation
import { insertAiQuerySchema } from "@shared/schema";

/*
 * OPENAI CLIENT INITIALIZATION
 * ============================
 * 
 * This sets up our connection to OpenAI's GPT-4o model for the AI business assistant.
 * The AI assistant helps users ask natural language questions about their practice data.
 * 
 * ENVIRONMENT VARIABLE HANDLING:
 * We check multiple environment variable names to ensure compatibility:
 * - OPENAI_API_KEY: Standard OpenAI environment variable name
 * - OPENAI_API_KEY_ENV_VAR: Alternative naming convention
 * - "default_key": Fallback for development (should be replaced with real key)
 * 
 * GPT-4o MODEL CHOICE:
 * GPT-4o was released in May 2024 and offers the best balance of:
 * - Speed (faster than GPT-4)
 * - Cost (cheaper than GPT-4)
 * - Capability (multimodal, large context window)
 * - Accuracy (excellent for business intelligence queries)
 */
// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

// Import AI assistant utilities (moved to separate modules for better architecture)
import { processAIQuery } from './utils/aiAssistant';
import { extractQueryContext } from './utils/queryParser';

/**
 * Register all API routes for the MDS AI Analytics platform
 * This includes routes for analytics data, AI assistant, and practice management
 */
export async function registerRoutes(app: Express): Promise<Server> {
  
  // ============================================================================
  // PRACTICE LOCATION ROUTES
  // ============================================================================
  
  /**
   * GET /api/locations - Retrieve all practice locations
   * Returns the 5 Rao Dermatology locations for the location selector
   */
  app.get("/api/locations", async (req, res) => {
    try {
      const locations = await storage.getAllPracticeLocations();
      res.json(locations);
    } catch (error) {
      console.error("Error fetching practice locations:", error);
      res.status(500).json({ message: "Failed to fetch practice locations" });
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
  app.get("/api/analytics/top-procedures/:locationId/:category", async (req, res) => {
    try {
      const { locationId, category } = req.params;
      const { timeRange = '1' } = req.query;
      const finalLocationId = locationId === 'all' ? undefined : locationId;
      const procedureCategory = category === 'all' ? undefined : category as 'medical' | 'cosmetic' | 'refractive';
      
      const topProcedures = await storage.getTopRevenueProcedures(
        finalLocationId, 
        procedureCategory,
        parseInt(timeRange as string)
      );
      
      res.json(topProcedures);
    } catch (error) {
      console.error("Error fetching top procedures:", error);
      res.status(500).json({ message: "Failed to fetch top procedures data" });
    }
  });

  /**
   * GET /api/analytics/revenue-trends/:locationId/:period - Get monthly revenue trend data
   * Path params: locationId (or 'all'), period (1yr|2yr|5yr)
   */
  app.get("/api/analytics/revenue-trends/:locationId/:period", async (req, res) => {
    try {
      const { locationId, period } = req.params;
      const finalLocationId = locationId === 'all' ? undefined : locationId;
      
      const revenueData = await storage.getMonthlyRevenueData(finalLocationId);
      
      // Filter data based on period - include projections beyond current date
      let filteredData = revenueData;
      // Dynamic filtering based on current date and projection needs
      const now = new Date(2025, 7, 3); // August 3, 2025
      const currentMonthStr = now.toISOString().slice(0, 7); // "2025-08"
      
      if (period === '1yr') {
        // Show 13 months: 12 historical + current + 1 future projection
        const currentIndex = revenueData.findIndex(item => item.month === currentMonthStr);
        if (currentIndex >= 0) {
          const startIndex = Math.max(0, currentIndex - 11); // 11 months before current
          const endIndex = Math.min(revenueData.length - 1, currentIndex + 2); // Include 2 future months
          filteredData = revenueData.slice(startIndex, endIndex + 1);
        } else {
          filteredData = revenueData.slice(-13);
        }
      } else if (period === '2yr') {
        // Show 25 months: 24 historical + current + 1 future projection
        const currentIndex = revenueData.findIndex(item => item.month === currentMonthStr);
        if (currentIndex >= 0) {
          const startIndex = Math.max(0, currentIndex - 23); // 23 months before current
          const endIndex = Math.min(revenueData.length - 1, currentIndex + 2); // Include 2 future months
          filteredData = revenueData.slice(startIndex, endIndex + 1);
        } else {
          filteredData = revenueData.slice(-25);
        }
      } else if (period === '5yr') {
        // Show all available data with projections
        filteredData = revenueData;
      }
      
      res.json(filteredData);
    } catch (error) {
      console.error("Error fetching revenue trends:", error);
      res.status(500).json({ message: "Failed to fetch revenue trends data" });
    }
  });

  /**
   * GET /api/analytics/insurance-breakdown/:locationId - Get insurance payer analysis
   * Path params: locationId (or 'all')
   */
  app.get("/api/analytics/insurance-breakdown/:locationId", async (req, res) => {
    try {
      const { locationId } = req.params;
      const { timeRange = '1' } = req.query;
      const finalLocationId = locationId === 'all' ? undefined : locationId;
      
      const insuranceData = await storage.getInsurancePayerBreakdown(finalLocationId, parseInt(timeRange as string));
      res.json(insuranceData);
    } catch (error) {
      console.error("Error fetching insurance breakdown:", error);
      res.status(500).json({ message: "Failed to fetch insurance breakdown data" });
    }
  });

  /**
   * GET /api/analytics/projections/:locationId - Get patient volume and revenue projections
   * Path params: locationId (or 'all')
   */
  app.get("/api/analytics/projections/:locationId", async (req, res) => {
    try {
      const { locationId } = req.params;
      const finalLocationId = locationId === 'all' ? undefined : locationId;
      
      const projections = await storage.getPatientVolumeProjections(finalLocationId);
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
      const { timeRange = '1' } = req.query;
      const finalLocationId = locationId === 'all' ? undefined : locationId;
      
      // Use centralized data consistency engine for key metrics with time range
      const metrics = await storage.getKeyMetrics(finalLocationId, parseInt(timeRange as string));
      
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
      const finalLocationId = locationId === 'all' ? 'all' : locationId;
      
      const arData = await storage.getARBucketsData(finalLocationId);
      res.json(arData);
    } catch (error) {
      console.error("Error fetching AR buckets data:", error);
      res.status(500).json({ message: "Failed to fetch AR buckets data" });
    }
  });

  /**
   * Patient Billing Analytics endpoint
   */
  app.get('/api/analytics/patient-billing/:locationId', async (req, res) => {
    try {
      const { locationId } = req.params;
      const { timeRange = '30' } = req.query;
      
      const data = await storage.getPatientBillingData(
        locationId, 
        timeRange as string
      );
      
      res.json(data);
    } catch (error) {
      console.error('Error fetching patient billing data:', error);
      res.status(500).json({ error: 'Failed to fetch patient billing data' });
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
      
      if (startDate && typeof startDate === 'string') {
        parsedStartDate = new Date(startDate);
      }
      if (endDate && typeof endDate === 'string') {
        parsedEndDate = new Date(endDate);
      }
      
      const claimsData = await storage.getInsuranceClaimsData(locationId, parsedStartDate, parsedEndDate);
      res.json(claimsData);
    } catch (error) {
      console.error('Error fetching insurance claims data:', error);
      res.status(500).json({ error: 'Failed to fetch insurance claims data' });
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
    try {
      const { query, userId, locationId = 'all', timeRange = '1' } = req.body;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ message: "Query is required and must be a string" });
      }

      // Get available locations for AI context
      const availableLocations = await storage.getAllPracticeLocations();
      
      // Process query using new AI assistant utility
      const aiResponse = await processAIQuery(
        query,
        availableLocations,
        storage,
        locationId,
        timeRange
      );
      
      // Store the query and response for analytics
      if (userId) {
        await storage.createAiQuery({
          userId,
          query,
          response: aiResponse.response,
          queryType: aiResponse.queryType
        });
      }

      res.json(aiResponse);
    } catch (error) {
      console.error("Error processing AI query:", error);
      const { locationId: fallbackLocationId = 'all', timeRange: fallbackTimeRange = '1' } = req.body;
      
      res.status(500).json({ 
        response: "I apologize, but I'm experiencing technical difficulties. Please try your question again.",
        queryType: "error",
        confidence: 0,
        locationContext: fallbackLocationId,
        timeContext: fallbackTimeRange,
        recommendations: ["Check your internet connection", "Try rephrasing your question", "Contact support if the issue persists"],
        keyMetrics: {}
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
          category: "forecasting"
        },
        {
          id: "top-revenue",
          question: "Top revenue procedures this quarter",
          icon: "dollar-sign",
          category: "revenue"
        },
        {
          id: "ar-days",
          question: "AR days by insurance payer",
          icon: "clock",
          category: "operations"
        },
        {
          id: "lasik-analytics",
          question: "LASIK surgery analytics",
          icon: "zap",
          category: "procedures"
        },
        {
          id: "refractive-vs-medical",
          question: "Refractive vs Medical revenue",
          icon: "balance-scale",
          category: "revenue"
        },
        {
          id: "best-location",
          question: "Best performing location",
          icon: "trophy",
          category: "locations"
        }
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
        .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
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
      if (category && (category === 'medical' || category === 'cosmetic' || category === 'refractive')) {
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
   * GET /api/health - Health check endpoint
   */
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "healthy", 
      timestamp: new Date().toISOString(),
      service: "MDS AI Analytics API"
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
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error fetching system status:", error);
      res.status(500).json({ message: "Failed to fetch system status" });
    }
  });

  // Create HTTP server instance
  const httpServer = createServer(app);

  return httpServer;
}
