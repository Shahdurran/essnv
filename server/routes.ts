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
 * Extract location context from AI query text
 */
function extractLocationFromQuery(query: string, defaultLocation: string): string {
  const queryLower = query.toLowerCase();
  
  // Check for specific location mentions
  if (queryLower.includes('manhattan') || queryLower.includes('new york') || queryLower.includes('ny')) {
    return 'manhattan-ny';
  }
  if (queryLower.includes('atlantic') || queryLower.includes('highlands')) {
    return 'atlantic-highlands-nj';
  }
  if (queryLower.includes('woodbridge')) {
    return 'woodbridge-nj';
  }
  if (queryLower.includes('fresno')) {
    return 'fresno-ca';
  }
  if (queryLower.includes('hanford')) {
    return 'hanford-ca';
  }
  
  return defaultLocation;
}

/**
 * Extract time range context from AI query text
 */
function extractTimeRangeFromQuery(query: string, defaultTimeRange: string): string {
  const queryLower = query.toLowerCase();
  
  // Check for time period mentions
  if (queryLower.includes('last month') || queryLower.includes('past month') || queryLower.includes('1 month')) {
    return '1';
  }
  if (queryLower.includes('last 3 months') || queryLower.includes('past 3 months') || queryLower.includes('quarter')) {
    return '3';
  }
  if (queryLower.includes('last 6 months') || queryLower.includes('past 6 months') || queryLower.includes('half year')) {
    return '6';
  }
  if (queryLower.includes('last year') || queryLower.includes('past year') || queryLower.includes('12 months') || queryLower.includes('annual')) {
    return '12';
  }
  
  return defaultTimeRange;
}

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
      const procedureCategory = category === 'all' ? undefined : category as 'medical' | 'cosmetic';
      
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

      // Parse location and time context from query if not provided explicitly
      const finalLocationId = extractLocationFromQuery(query, locationId);
      const finalTimeRange = extractTimeRangeFromQuery(query, timeRange);

      // Get contextual practice data based on query location and time parameters
      const currentMetrics = await storage.getMonthlyRevenueData(finalLocationId);
      const topProcedures = await storage.getTopRevenueProcedures(finalLocationId, undefined, parseInt(finalTimeRange));
      const insuranceData = await storage.getInsurancePayerBreakdown(finalLocationId, parseInt(finalTimeRange));
      const keyMetrics = await storage.getKeyMetrics(finalLocationId, parseInt(finalTimeRange));
      const projections = await storage.getPatientVolumeProjections(finalLocationId);
      const locations = await storage.getAllPracticeLocations();
      const claimsData = await storage.getInsuranceClaimsData(finalLocationId === 'all' ? 'all' : finalLocationId);
      const denialReasons = storage.getDenialReasonsData();

      // Prepare comprehensive context for the AI assistant with all available practice data
      const systemPrompt = `You are an AI business analytics assistant for Demo Dermatology Practice, a multi-location dermatology practice owned by Dr. Example User.

PRACTICE OVERVIEW:
- Practice Owner: Dr. Example User, Board-Certified Dermatologist
- 5 Active Locations: Manhattan NY, Atlantic Highlands NJ, Woodbridge NJ, Fresno CA, Hanford CA
- Specialties: Medical Dermatology (Mohs surgery, skin cancer treatment) & Cosmetic Dermatology (Botox, fillers, laser treatments)
- Total Staff: 47 employees across all locations
- Years in Operation: 18 years

CURRENT FINANCIAL DATA (${finalLocationId === 'all' ? 'All Locations' : 'Selected Location'} - ${finalTimeRange} Month${finalTimeRange !== '1' ? 's' : ''}):
Revenue Trends (Last 12 Months):
${currentMetrics.map(m => `- ${m.month}: $${m.revenue.toLocaleString()} (${m.patientCount} patients)`).join('\n')}

Key Performance Metrics:
- Monthly Patients: ${keyMetrics.monthlyPatients.toLocaleString()}
- Monthly Revenue: $${keyMetrics.monthlyRevenue.toLocaleString()}
- AR Days: ${keyMetrics.arDays}
- Clean Claim Rate: ${keyMetrics.cleanClaimRate}%
- Patient Growth: ${keyMetrics.patientGrowth}%
- Revenue Growth: ${keyMetrics.revenueGrowth}%

Top Revenue Procedures (${finalTimeRange} Month${finalTimeRange !== '1' ? 's' : ''}):
${topProcedures.map(p => `- ${p.description} (${p.cptCode}): $${p.revenue.toLocaleString()}, Growth: ${p.growth}%`).join('\n')}

Insurance Payer Mix (${finalTimeRange} Month${finalTimeRange !== '1' ? 's' : ''}):
${insuranceData.map(i => `- ${i.name}: ${i.percentage?.toFixed(1)}% of revenue, AR Days: ${i.arDays?.toFixed(1)}, Revenue: $${i.revenue?.toLocaleString()}`).join('\n')}

Insurance Claims Status:
${claimsData.map(status => `- ${status.status}: ${status.totalClaims} claims ($${status.totalAmount.toLocaleString()})`).join('\n')}

Common Denial Reasons by Payer:
${Object.entries(denialReasons).map(([payer, reasons]) => `- ${payer}: ${reasons.join(', ')}`).join('\n')}

PATIENT VOLUME PROJECTIONS (Next 6 Months):
${projections.map(p => `- ${p.month}: ${p.projectedPatients} patients, $${p.projectedRevenue.toLocaleString()} revenue (${Math.round(p.confidenceLevel * 100)}% confidence)`).join('\n')}

LOCATION PERFORMANCE:
- Manhattan, NY: Highest volume location, strong cosmetic procedures
- Atlantic Highlands, NJ: Balanced medical/cosmetic mix
- Woodbridge, NJ: Growing location, medical focus
- Fresno, CA: Established location, diverse patient base
- Hanford, CA: Newest location, building patient volume

OPERATIONAL METRICS:
- Average Patient Visit Value: $340
- Clean Claim Rate: 94.2%
- Average AR Days: 28.5 days
- Patient Satisfaction Score: 4.8/5.0
- Monthly New Patient Rate: 12.3%
- Procedure Success Rate: 98.1%

Your role is to provide actionable business insights using this comprehensive data. You can analyze trends, make recommendations, compare metrics, and provide forecasts based on the information above.

Always format your response as JSON with this structure:
{
  "response": "Your detailed analysis with specific data points and insights",
  "queryType": "forecast|revenue_analysis|patient_volume|procedure_analysis|insurance_analysis|general",
  "recommendations": ["specific actionable recommendation 1", "specific actionable recommendation 2"],
  "keyMetrics": {"relevant_metric_1": "value1", "relevant_metric_2": "value2"}
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
