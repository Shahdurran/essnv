/*
 * AI ASSISTANT UTILITY MODULE
 * ===========================
 * 
 * This module centralizes AI assistant functionality for the MDS AI Analytics platform.
 * It provides a clean interface for AI interactions and handles OpenAI integration.
 * 
 * SEPARATION OF CONCERNS:
 * - Query parsing logic moved to queryParser.ts
 * - AI conversation logic centralized here
 * - Routing logic stays in routes.ts
 * - Data access logic handled by storage layer
 */

import OpenAI from 'openai';
import { extractQueryContext, validateQueryContext } from './queryParser';
import type { PracticeLocation } from '../../shared/schema';

/*
 * AI RESPONSE INTERFACE
 * ====================
 * 
 * Standardized structure for AI assistant responses that includes
 * both the response content and metadata about the query processing.
 */
interface AIResponse {
  response: string;           // The AI's response to the user
  queryType: string;         // Type of query (analytics, general, etc.)
  confidence: number;        // AI confidence in the response
  locationContext: string;   // Location context used for the response
  timeContext: string;       // Time range context used for the response
  keyMetrics?: any;         // Optional structured data for the response
  recommendations?: string[]; // Optional recommendations from the AI
}

/*
 * OPENAI CLIENT INITIALIZATION
 * ============================
 * 
 * Lazy initialization of OpenAI client for the AI assistant functionality.
 * This prevents the app from crashing if the API key is not available.
 */
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR;
    if (!apiKey) {
      throw new Error('OpenAI API key is required for AI assistant functionality. Please set the OPENAI_API_KEY environment variable.');
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

/*
 * PROCESS AI ASSISTANT QUERY
 * ==========================
 * 
 * Main function for processing user queries through the AI assistant.
 * This coordinates context extraction, data retrieval, and AI response generation.
 * 
 * @param {string} query - The user's natural language question
 * @param {PracticeLocation[]} availableLocations - Current practice locations
 * @param {any} storage - Storage interface for data access
 * @param {string} defaultLocationId - Default location if none specified
 * @param {string} defaultTimeRange - Default time range if none specified
 * @returns {Promise<AIResponse>} Comprehensive AI response with context
 */
export async function processAIQuery(
  query: string,
  availableLocations: PracticeLocation[],
  storage: any,
  defaultLocationId: string = 'all',
  defaultTimeRange: string = '1'
): Promise<AIResponse> {
  
  try {
    // Extract and validate query context using AI
    const rawContext = await extractQueryContext(
      query, 
      availableLocations, 
      defaultLocationId, 
      defaultTimeRange
    );
    
    const context = validateQueryContext(rawContext, availableLocations);
    
    // Get relevant data based on extracted context
    const analyticsData = await gatherAnalyticsData(storage, context.locationId, context.timeRange);
    
    // Generate AI response with context and data
    const aiResponse = await generateAIResponse(query, context, analyticsData, availableLocations);
    
    return {
      response: aiResponse.response || "I understand your question but need more specific information to provide accurate insights.",
      queryType: aiResponse.queryType || "general",
      confidence: Math.min(context.confidence, aiResponse.confidence || 0.5),
      locationContext: context.locationId,
      timeContext: context.timeRange,
      keyMetrics: aiResponse.keyMetrics,
      recommendations: aiResponse.recommendations
    };
    
  } catch (error) {
    // Check if it's an API key error specifically
    if (error instanceof Error && error.message.includes('OpenAI API key')) {
      console.warn('AI assistant unavailable: OpenAI API key not configured. Using fallback response.');
      return {
        response: "I'm currently unavailable as the AI features require configuration. The app can still display your analytics data without AI assistance.",
        queryType: "configuration_needed",
        confidence: 0,
        locationContext: defaultLocationId,
        timeContext: defaultTimeRange,
        recommendations: [
          "View your analytics data directly from the dashboard",
          "Contact your administrator to configure AI features"
        ]
      };
    }
    
    console.error('Error processing AI query:', error);
    
    return {
      response: "I apologize, but I'm experiencing technical difficulties processing your request. Please try again in a moment.",
      queryType: "error",
      confidence: 0,
      locationContext: defaultLocationId,
      timeContext: defaultTimeRange,
      recommendations: [
        "Check your internet connection",
        "Try rephrasing your question", 
        "Contact support if the issue persists"
      ]
    };
  }
}

/*
 * GATHER ANALYTICS DATA
 * =====================
 * 
 * Retrieves relevant analytics data based on the extracted context.
 * This ensures the AI has current, accurate data to work with.
 * 
 * @param {any} storage - Storage interface for data access
 * @param {string} locationId - Location filter for data
 * @param {string} timeRange - Time range filter for data
 * @returns {Promise<any>} Relevant analytics data for AI processing
 */
async function gatherAnalyticsData(storage: any, locationId: string, timeRange: string): Promise<any> {
  try {
    // Use the actual storage methods that exist in the codebase
    const timeRangeNum = parseInt(timeRange);
    
    const [keyMetrics, procedures, insuranceData, currentMetrics, projections, claimsData] = await Promise.all([
      storage.getKeyMetrics(locationId, timeRangeNum),
      storage.getTopRevenueProcedures(locationId, undefined, timeRangeNum),
      storage.getInsurancePayerBreakdown(locationId, timeRangeNum),
      storage.getMonthlyRevenueData(locationId),
      storage.getPatientVolumeProjections(locationId),
      storage.getInsuranceClaimsData(locationId === 'all' ? 'all' : locationId)
    ]);
    
    return {
      keyMetrics: keyMetrics || {},
      procedures: (procedures || []).slice(0, 5), // Top 5 procedures
      insuranceData: (insuranceData || []).slice(0, 3), // Top 3 payers
      currentMetrics: currentMetrics || [],
      projections: projections || [],
      claimsData: claimsData || [],
      denialReasons: storage.getDenialReasonsData ? storage.getDenialReasonsData() : {},
      locationId,
      timeRange
    };
    
  } catch (error) {
    console.error('Error gathering analytics data:', error);
    return { locationId, timeRange };
  }
}

/*
 * GENERATE AI RESPONSE
 * ====================
 * 
 * Uses OpenAI GPT-4o to generate intelligent responses based on the user's query,
 * extracted context, and relevant analytics data.
 * 
 * @param {string} query - Original user query
 * @param {any} context - Extracted query context
 * @param {any} analyticsData - Relevant practice data
 * @param {PracticeLocation[]} locations - Available practice locations
 * @returns {Promise<Partial<AIResponse>>} AI-generated response
 */
async function generateAIResponse(
  query: string,
  context: any,
  analyticsData: any,
  locations: PracticeLocation[]
): Promise<Partial<AIResponse>> {
  
  try {
    // Build context-aware system prompt
    const systemPrompt = buildSystemPrompt(analyticsData, locations, context);
    
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: query }
      ],
      response_format: { type: "json_object" },
      max_tokens: 500,
      temperature: 0.7
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      response: result.response || "I understand your question but need more specific information to provide accurate insights.",
      queryType: result.queryType || "general",
      confidence: Math.max(0, Math.min(1, result.confidence || 0.7)),
      keyMetrics: result.keyMetrics || {},
      recommendations: result.recommendations || []
    };
    
  } catch (error) {
    // Check if it's an API key error specifically
    if (error instanceof Error && error.message.includes('OpenAI API key')) {
      console.warn('AI response generation unavailable: OpenAI API key not configured.');
      return {
        response: "I'm unable to provide AI-powered insights as the system needs configuration. You can still view your raw analytics data.",
        queryType: "configuration_needed",
        confidence: 0,
        recommendations: ["View analytics data directly", "Contact administrator for AI setup"]
      };
    }
    
    console.error('Error generating AI response:', error);
    
    return {
      response: "I encountered an issue processing your question. Please try rephrasing it or contact support if the problem persists.",
      queryType: "error",
      confidence: 0,
      recommendations: ["Try rephrasing your question", "Contact support for assistance"]
    };
  }
}

/*
 * BUILD SYSTEM PROMPT
 * ===================
 * 
 * Constructs a comprehensive system prompt that gives the AI context about
 * the practice, available data, and how to respond appropriately.
 * 
 * @param {any} analyticsData - Current analytics data
 * @param {PracticeLocation[]} locations - Practice locations
 * @param {any} context - Query context
 * @returns {string} System prompt for OpenAI
 */
function buildSystemPrompt(analyticsData: any, locations: PracticeLocation[], context: any): string {
  const locationContext = context.locationId === 'all' 
    ? 'all practice locations combined'
    : locations.find(loc => loc.id === context.locationId)?.name || 'the selected location';
    
  const timeContextMap: Record<string, string> = {
    '1': 'the past month',
    '3': 'the past 3 months', 
    '6': 'the past 6 months',
    '12': 'the past year'
  };
  const timeContext = timeContextMap[context.timeRange] || 'the specified time period';

  return `You are an AI business analytics assistant for Demo Dermatology Practice, a multi-location dermatology practice owned by Dr. Example User.

PRACTICE OVERVIEW:
- Practice Owner: Dr. Example User, Board-Certified Dermatologist
- 5 Active Locations: ${locations.map(loc => loc.name).join(', ')}
- Specialties: Medical Dermatology (Mohs surgery, skin cancer treatment) & Cosmetic Dermatology (Botox, fillers, laser treatments)
- Total Staff: 47 employees across all locations
- Years in Operation: 18 years

CURRENT CONTEXT:
- Data scope: ${locationContext}
- Time period: ${timeContext}

CURRENT DATA SUMMARY:
${analyticsData.keyMetrics ? `Key Performance Metrics:
- Monthly Patients: ${analyticsData.keyMetrics.monthlyPatients?.toLocaleString() || 'N/A'}
- Monthly Revenue: $${analyticsData.keyMetrics.monthlyRevenue?.toLocaleString() || 'N/A'}
- AR Days: ${analyticsData.keyMetrics.arDays || 'N/A'}
- Clean Claim Rate: ${analyticsData.keyMetrics.cleanClaimRate || 'N/A'}%
- Patient Growth: ${analyticsData.keyMetrics.patientGrowth || 'N/A'}%` : ''}

${analyticsData.procedures ? `Top Revenue Procedures:
${analyticsData.procedures.map((p: any) => `- ${p.description} (${p.cptCode}): $${p.revenue?.toLocaleString() || 'N/A'}, Growth: ${p.growth || 'N/A'}%`).join('\n')}` : ''}

${analyticsData.insuranceData ? `Insurance Payer Mix:
${analyticsData.insuranceData.map((i: any) => `- ${i.name}: ${i.percentage?.toFixed(1) || 'N/A'}% of revenue, AR Days: ${i.arDays?.toFixed(1) || 'N/A'}`).join('\n')}` : ''}

${analyticsData.claimsData ? `Insurance Claims Status:
${analyticsData.claimsData.map((status: any) => `- ${status.status}: ${status.totalClaims || 0} claims ($${status.totalAmount?.toLocaleString() || '0'})`).join('\n')}` : ''}

Response Format (JSON):
{
  "response": "Your detailed analysis with specific data points and insights",
  "queryType": "forecast|revenue_analysis|patient_volume|procedure_analysis|insurance_analysis|general",
  "confidence": 0.0-1.0,
  "keyMetrics": {"relevant_metric_1": "value1", "relevant_metric_2": "value2"},
  "recommendations": ["specific actionable recommendation 1", "specific actionable recommendation 2"]
}

Guidelines:
- Provide specific, data-driven insights using the current data
- Include relevant numbers and percentages from the practice data
- Offer actionable business recommendations
- Be professional but conversational
- Reference specific practice locations and metrics when relevant
- If data is limited, acknowledge this and suggest what additional data would help`;
}