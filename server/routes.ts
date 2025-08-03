import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import OpenAI from "openai";
import { insertAiQuerySchema } from "@shared/schema";

// Initialize OpenAI client for AI business assistant functionality
// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

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
   */
  app.get("/api/analytics/top-procedures/:locationId/:category", async (req, res) => {
    try {
      const { locationId, category } = req.params;
      const finalLocationId = locationId === 'all' ? undefined : locationId;
      const procedureCategory = category === 'all' ? undefined : category as 'medical' | 'cosmetic';
      
      const topProcedures = await storage.getTopRevenueProcedures(
        finalLocationId, 
        procedureCategory
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
      
      // Filter data based on period
      let filteredData = revenueData;
      if (period === '1yr') {
        filteredData = revenueData.slice(-12);
      } else if (period === '2yr') {
        filteredData = revenueData.slice(-24);
      } // 5yr would show all available data
      
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
      const finalLocationId = locationId === 'all' ? undefined : locationId;
      
      const insuranceData = await storage.getInsurancePayerBreakdown(finalLocationId);
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
   */
  app.get("/api/analytics/key-metrics/:locationId", async (req, res) => {
    try {
      const { locationId } = req.params;
      const finalLocationId = locationId === 'all' ? undefined : locationId;
      
      // Calculate key metrics from available data
      const revenueData = await storage.getMonthlyRevenueData(finalLocationId);
      const insuranceData = await storage.getInsurancePayerBreakdown(finalLocationId);
      
      const currentMonth = revenueData[revenueData.length - 1];
      const previousMonth = revenueData[revenueData.length - 2];
      
      // Calculate weighted average AR days
      const avgArDays = insuranceData.reduce((acc, payer) => 
        acc + (payer.arDays * payer.percentage / 100), 0
      );
      
      const metrics = {
        monthlyPatients: currentMonth.patientCount,
        monthlyRevenue: currentMonth.revenue,
        arDays: Math.round(avgArDays * 10) / 10,
        cleanClaimRate: 94.2, // This would come from claims data
        patientGrowth: ((currentMonth.patientCount - previousMonth.patientCount) / previousMonth.patientCount * 100).toFixed(1),
        revenueGrowth: ((currentMonth.revenue - previousMonth.revenue) / previousMonth.revenue * 100).toFixed(1)
      };
      
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching key metrics:", error);
      res.status(500).json({ message: "Failed to fetch key metrics data" });
    }
  });

  // ============================================================================
  // AI BUSINESS ASSISTANT ROUTES
  // ============================================================================

  /**
   * POST /api/ai/query - Submit a query to the AI business assistant
   * Body: { query: string, userId?: string }
   */
  app.post("/api/ai/query", async (req, res) => {
    try {
      const { query, userId } = req.body;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ message: "Query is required and must be a string" });
      }

      // Get current practice data to provide context to AI
      const currentMetrics = await storage.getMonthlyRevenueData();
      const topProcedures = await storage.getTopRevenueProcedures();
      const insuranceData = await storage.getInsurancePayerBreakdown();
      const locations = await storage.getAllPracticeLocations();

      // Prepare context for the AI assistant with practice-specific information and current data
      const systemPrompt = `You are an AI business analytics assistant for Rao Dermatology, a multi-location dermatology practice. 

IMPORTANT DATA INTEGRITY RULES:
- ONLY use the specific data provided in this context
- NEVER make up numbers, percentages, or metrics not provided
- If asked about data you don't have, clearly state what information is not available
- Base all insights on the actual practice data included below
- When making projections, clearly indicate they are estimates based on current trends

Practice Information:
- Practice Owner: Dr. Babar K. Rao
- 5 Locations: Manhattan NY, Atlantic Highlands NJ, Woodbridge NJ, Fresno CA, Hanford CA
- Specializes in both medical and cosmetic dermatology

Current Practice Data (Use ONLY this data for responses):
- Locations: ${locations.length} active locations
- Recent Revenue Trend: ${currentMetrics.slice(-3).map(m => `${m.month}: $${m.revenue.toLocaleString()}`).join(', ')}
- Top Revenue Procedures: ${topProcedures.slice(0, 3).map(p => `${p.description}: $${p.revenue.toLocaleString()}`).join(', ')}
- Insurance Mix: ${insuranceData.slice(0, 3).map(i => `${i.name}: ${i.percentage}%`).join(', ')}

Your role is to provide actionable business insights based ONLY on the data provided above.
If asked about information not in the provided data, respond with: "I don't have access to that specific data in the current system. I can help analyze [list available data types]."

Always format your response as JSON with this structure:
{
  "response": "Your detailed response here",
  "queryType": "forecast|revenue_analysis|patient_volume|procedure_analysis|insurance_analysis|general|data_unavailable",
  "recommendations": ["recommendation1", "recommendation2"],
  "keyMetrics": {"metric1": "value1", "metric2": "value2"}
}`;

      // Call OpenAI GPT-4o for intelligent response
      const completion = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: query }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 1000
      });

      const aiResponse = JSON.parse(completion.choices[0].message.content || "{}");
      
      // Store the query and response for analytics
      if (userId) {
        await storage.createAiQuery({
          userId,
          query,
          response: aiResponse.response,
          queryType: aiResponse.queryType || "general"
        });
      }

      res.json(aiResponse);
    } catch (error) {
      console.error("Error processing AI query:", error);
      res.status(500).json({ 
        message: "Failed to process AI query",
        response: "I apologize, but I'm experiencing technical difficulties. Please try your question again.",
        queryType: "error",
        recommendations: [],
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
          id: "mohs-analytics",
          question: "Mohs surgery analytics",
          icon: "cut",
          category: "procedures"
        },
        {
          id: "cosmetic-vs-medical",
          question: "Cosmetic vs Medical revenue",
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
      if (category && (category === 'medical' || category === 'cosmetic')) {
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
