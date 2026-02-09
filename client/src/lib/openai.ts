/*
 * OPENAI INTEGRATION MODULE FOR MDS AI ANALYTICS
 * ==============================================
 * 
 * This module provides the client-side interface for communicating with our AI
 * business assistant, which is powered by OpenAI's GPT-4o model. It handles
 * query submission, response processing, and error handling for natural language
 * analytics queries.
 * 
 * AI ASSISTANT CAPABILITIES:
 * The AI assistant can answer questions about:
 * - Revenue trends and projections
 * - Patient volume analysis
 * - Procedure performance comparisons
 * - Insurance claim patterns
 * - Location-specific analytics
 * - Business recommendations and insights
 * 
 * TECHNICAL ARCHITECTURE:
 * Client (this module) → Backend API → OpenAI GPT-4o → Backend processing → Client response
 * 
 * ERROR HANDLING PHILOSOPHY:
 * We provide graceful fallbacks and user-friendly error messages rather than
 * exposing technical errors to medical practice users.
 * 
 * SECURITY CONSIDERATIONS:
 * - All queries are routed through our backend (no direct OpenAI calls from frontend)
 * - Practice data is anonymized before sending to OpenAI
 * - User sessions are maintained securely
 * - No sensitive patient information is included in AI queries
 */

/*
 * SUBMIT AI QUERY FUNCTION
 * ========================
 * 
 * This function now uses static data instead of API calls to provide AI-like responses
 * based on the practice data. It simulates AI responses using keyword matching and
 * real practice data from the static data service.
 * 
 * FUNCTION PARAMETERS:
 * @param {string} query - The user's natural language question about their practice
 * @param {string|null} userId - User identifier for query tracking (optional)
 * @param {string} locationId - Location filter context for the AI (defaults to 'all')
 * @param {string} timeRange - Time period context for the AI (defaults to '1' month)
 * 
 * RETURN VALUE:
 * Returns a standardized response object with:
 * - success: Boolean indicating if the query was processed successfully
 * - data: The AI response with analytics insights
 * - error: Error message if something went wrong
 * - timestamp: When the response was generated
 * 
 * EXAMPLE USAGE:
 * const result = await submitAIQuery(
 *   "What's our top revenue procedure this month?",
 *   "user123",
 *   "manhattan-ny",
 *   "1"
 * );
 */
export async function submitAIQuery(query: string, userId: string | null = null, locationId: string = 'all', timeRange: string = '1') {
  try {
    // Validate input parameters
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      throw new Error('Query is required and must be a non-empty string');
    }

    // Import data service for static data
    const { dataService } = await import('./dataService');
    
    // Get relevant data based on the query
    const [keyMetrics, topProcedures, insuranceData, locations] = await Promise.all([
      dataService.getKeyMetrics(locationId, timeRange),
      dataService.getTopRevenueProcedures(locationId, undefined, timeRange),
      dataService.getInsurancePayerBreakdown(locationId, timeRange),
      dataService.getLocations()
    ]);

    // Generate AI-like response based on query content and real data
    const aiResponse = generateStaticAIResponse(query, {
      keyMetrics,
      topProcedures,
      insuranceData,
      locations,
      locationId,
      timeRange
    });

    return {
      success: true,
      data: aiResponse,
      timestamp: new Date().toISOString()
    };

  } catch (error: any) {
    console.error('Error processing AI query:', error);
    
    // Return structured error response
    return {
      success: false,
      error: error.message,
      data: {
        response: "I apologize, but I'm experiencing technical difficulties processing your request. Please try again in a moment.",
        queryType: "error",
        recommendations: ["Check your internet connection", "Try rephrasing your question", "Contact support if the issue persists"],
        keyMetrics: {}
      },
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Generate AI-like response using static data and keyword matching
 */
function generateStaticAIResponse(query: string, data: any) {
  const queryLower = query.toLowerCase();
  const locationName = data.locationId === 'all' 
    ? 'all locations' 
    : data.locations.find((loc: any) => loc.id === data.locationId)?.name || data.locationId;
  
  let response = "";
  let queryType = "general";
  let confidence = 0.8;
  let recommendations: string[] = [];
  let keyMetrics: Record<string, any> = {};

  // Revenue-related queries
  if (queryLower.includes("revenue") || queryLower.includes("income") || queryLower.includes("money") || queryLower.includes("earnings")) {
    queryType = "revenue_analysis";
    const totalRevenue = data.keyMetrics.monthlyRevenue || 0;
    const topProcedure = data.topProcedures[0];
    
    response = `Based on the latest data for ${locationName}, your practice shows strong revenue performance. `;
    response += `Monthly revenue is $${totalRevenue.toLocaleString()}, `;
    if (topProcedure) {
      response += `with ${topProcedure.description} being your top revenue generator at $${topProcedure.revenue?.toLocaleString() || 'N/A'}. `;
    }
    response += `Revenue growth is ${data.keyMetrics.revenueGrowth || 'N/A'}% compared to the previous period.`;
    
    keyMetrics = {
      monthlyRevenue: totalRevenue,
      topProcedure: topProcedure?.description || 'N/A',
      revenueGrowth: data.keyMetrics.revenueGrowth || 'N/A'
    };
    
    recommendations = [
      "Focus on high-value procedures to maximize revenue",
      "Consider expanding popular service offerings",
      "Monitor revenue trends monthly for optimization opportunities"
    ];
  }
  // Patient volume queries
  else if (queryLower.includes("patient") || queryLower.includes("volume") || queryLower.includes("appointment") || queryLower.includes("visits")) {
    queryType = "patient_volume";
    const monthlyPatients = data.keyMetrics.monthlyPatients || 0;
    const patientGrowth = data.keyMetrics.patientGrowth || 'N/A';
    
    response = `Patient volume analysis for ${locationName} shows consistent activity. `;
    response += `You're seeing approximately ${monthlyPatients.toLocaleString()} patients per month, `;
    response += `with a patient growth rate of ${patientGrowth}%. `;
    response += `The average revenue per patient is $${data.keyMetrics.averageRevenuePerPatient?.toLocaleString() || 'N/A'}.`;
    
    keyMetrics = {
      monthlyPatients: monthlyPatients,
      patientGrowth: patientGrowth,
      avgRevenuePerPatient: data.keyMetrics.averageRevenuePerPatient || 'N/A'
    };
    
    recommendations = [
      "Implement patient retention strategies",
      "Optimize appointment scheduling for efficiency",
      "Focus on patient experience improvements"
    ];
  }
  // Insurance and claims queries
  else if (queryLower.includes("insurance") || queryLower.includes("claim") || queryLower.includes("payer") || queryLower.includes("ar days")) {
    queryType = "insurance_analysis";
    const arDays = data.keyMetrics.arDays || 0;
    const cleanClaimRate = data.keyMetrics.cleanClaimRate || 0;
    const topPayer = data.insuranceData[0];
    
    response = `Insurance claims analysis for ${locationName} shows solid performance. `;
    response += `Average AR days are ${arDays} days, with a clean claim rate of ${cleanClaimRate}%. `;
    if (topPayer) {
      response += `${topPayer.name} is your largest payer, representing ${topPayer.percentage?.toFixed(1) || 'N/A'}% of revenue.`;
    }
    
    keyMetrics = {
      arDays: arDays,
      cleanClaimRate: cleanClaimRate,
      topPayer: topPayer?.name || 'N/A'
    };
    
    recommendations = [
      "Streamline claims submission process",
      "Focus on reducing AR days through better follow-up",
      "Monitor payer performance regularly"
    ];
  }
  // Procedure-specific queries
  else if (queryLower.includes("procedure") || queryLower.includes("surgery") || queryLower.includes("treatment") || queryLower.includes("lasik") || queryLower.includes("cataract")) {
    queryType = "procedure_analysis";
    const topProcedures = data.topProcedures.slice(0, 3);
    
    response = `Procedure analysis for ${locationName} shows strong performance across key services. `;
    if (topProcedures.length > 0) {
      response += `Your top procedures are: `;
      topProcedures.forEach((proc: any, index: number) => {
        response += `${proc.description} ($${proc.revenue?.toLocaleString() || 'N/A'})`;
        if (index < topProcedures.length - 1) response += ', ';
      });
      response += '.';
    }
    
    keyMetrics = {
      topProcedures: topProcedures.map((p: any) => ({
        name: p.description,
        revenue: p.revenue
      }))
    };
    
    recommendations = [
      "Focus on expanding high-performing procedures",
      "Consider marketing for top revenue generators",
      "Evaluate procedure efficiency and outcomes"
    ];
  }
  // General queries
  else {
    queryType = "general";
    response = `Thank you for your question about "${query}". Based on the current data for ${locationName}, `;
    response += `I can provide insights on your practice performance. `;
    response += `Your key metrics show ${data.keyMetrics.monthlyPatients?.toLocaleString() || 'N/A'} monthly patients, `;
    response += `$${data.keyMetrics.monthlyRevenue?.toLocaleString() || 'N/A'} in monthly revenue, `;
    response += `and ${data.keyMetrics.arDays || 'N/A'} average AR days. `;
    response += `Would you like me to elaborate on any specific aspect of your practice?`;
    
    keyMetrics = {
      monthlyPatients: data.keyMetrics.monthlyPatients || 'N/A',
      monthlyRevenue: data.keyMetrics.monthlyRevenue || 'N/A',
      arDays: data.keyMetrics.arDays || 'N/A'
    };
    
    recommendations = [
      "Ask about specific revenue metrics",
      "Inquire about patient volume trends", 
      "Request insurance claims analysis",
      "Get procedure performance data"
    ];
  }

  return {
    response,
    queryType,
    confidence,
    locationContext: data.locationId,
    timeContext: data.timeRange,
    recommendations,
    keyMetrics,
    timestamp: new Date().toISOString()
  };
}

/**
 * Fetch popular/suggested questions for the AI assistant
 * @returns {Promise<Array>} List of popular questions with metadata
 */
export async function getPopularQuestions() {
  try {
    // Import data service for static data
    const { dataService } = await import('./dataService');
    
    // Get popular questions from static data
    const questions = await dataService.getPopularQuestions();
    
    return {
      success: true,
      data: questions,
      timestamp: new Date().toISOString()
    };

  } catch (error: any) {
    console.error('Error fetching popular questions:', error);
    
    // Return fallback questions if static data fails
    return {
      success: false,
      error: error.message,
      data: [
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
          question: "Bad debt analysis",
          icon: "balance-scale",
          category: "revenue"
        },
        {
          id: "best-location",
          question: "Best performing location",
          icon: "trophy",
          category: "locations"
        }
      ],
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Fetch AI query history for a specific user
 * @param {string} userId - The user ID to fetch history for
 * @returns {Promise<Array>} List of previous queries and responses
 */
export async function getQueryHistory(userId: string) {
  try {
    if (!userId) {
      throw new Error('User ID is required to fetch query history');
    }

    // For static data implementation, we'll return an empty array
    // In a real implementation, this could be stored in localStorage or a simple in-memory cache
    const history: any[] = [];
    
    return {
      success: true,
      data: history,
      timestamp: new Date().toISOString()
    };

  } catch (error: any) {
    console.error('Error fetching query history:', error);
    
    return {
      success: false,
      error: error.message,
      data: [],
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Process and format AI responses for display in the chat interface
 * @param {Object} aiResponse - Raw AI response from the API
 * @returns {Object} Formatted response ready for UI rendering
 */
export function formatAIResponse(aiResponse: any) {
  try {
    // Extract key components from AI response
    const {
      response = "No response available",
      queryType = "general",
      recommendations = [],
      keyMetrics = {}
    } = aiResponse;

    // Format recommendations as bullet points if they exist
    const formattedRecommendations = recommendations.length > 0 
      ? `\n\n**Recommendations:**\n${recommendations.map((rec: string) => `• ${rec}`).join('\n')}`
      : '';

    // Format key metrics if they exist
    const formattedMetrics = Object.keys(keyMetrics).length > 0
      ? `\n\n**Key Metrics:**\n${Object.entries(keyMetrics).map(([key, value]) => `• ${key}: ${value}`).join('\n')}`
      : '';

    // Combine all components into a formatted response
    const formattedResponse = response + formattedRecommendations + formattedMetrics;

    return {
      text: formattedResponse,
      type: queryType,
      recommendations: recommendations,
      metrics: keyMetrics,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error formatting AI response:', error);
    
    return {
      text: "Sorry, I encountered an error processing the response. Please try your question again.",
      type: "error",
      recommendations: [],
      metrics: {},
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Predefined query templates for common analytics questions
 * These can be used to quickly generate structured queries
 */
export const queryTemplates = {
  patientForecast: (timeframe = "next month", location = "all locations") => 
    `What is the patient volume forecast for ${timeframe} across ${location}?`,
    
  revenueAnalysis: (timeframe = "this quarter", category = "all procedures") => 
    `Analyze revenue performance for ${category} during ${timeframe}`,
    
  insuranceAnalysis: (location = "all locations") => 
    `Show me AR days and claim performance by insurance payer for ${location}`,
    
  procedurePerformance: (procedure = "Mohs surgery") => 
    `Analyze the performance and trends for ${procedure} procedures`,
    
  locationComparison: () => 
    "Compare performance metrics across all practice locations",
    
  cosmeticVsMedical: () => 
    "Compare revenue and growth between cosmetic and medical procedures"
};

/**
 * Utility function to suggest follow-up questions based on query type
 * @param {string} queryType - The type of the previous query
 * @returns {Array} Array of suggested follow-up questions
 */
export function getSuggestedFollowUps(queryType: string): string[] {
  const followUpMap: Record<string, string[]> = {
    forecast: [
      "What factors are driving this forecast?",
      "How does this compare to last year?",
      "What can we do to improve these projections?"
    ],
    revenue_analysis: [
      "Which locations are performing best?",
      "What procedures should we focus on?",
      "How can we optimize our pricing strategy?"
    ],
    procedure_analysis: [
      "What is the patient satisfaction for these procedures?",
      "How do our prices compare to market rates?",
      "What training opportunities could improve outcomes?"
    ],
    insurance_analysis: [
      "How can we reduce AR days?",
      "Which payers should we prioritize?",
      "What billing process improvements could help?"
    ],
    general: [
      "Can you provide more specific data?",
      "What recommendations do you have?",
      "How does this compare to industry benchmarks?"
    ]
  };

  return followUpMap[queryType] || followUpMap.general;
}
