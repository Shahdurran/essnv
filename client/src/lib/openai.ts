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
 * This is the main function for sending natural language questions to our AI
 * business assistant. It handles the complete request/response cycle with proper
 * error handling and response formatting.
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

    // Prepare request payload for the AI assistant with enhanced routing
    const requestBody = {
      query: query.trim(),
      userId: userId,
      locationId: locationId || 'all',
      timeRange: timeRange || '1'
    };

    // Send request to backend AI endpoint
    const response = await fetch('/api/ai/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      credentials: 'include' // Include cookies for session management
    });

    // Handle HTTP errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error occurred' }));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    // Parse and return the AI response
    const aiResponse = await response.json();
    
    // Validate response structure
    if (!aiResponse.response) {
      throw new Error('Invalid response format from AI assistant');
    }

    return {
      success: true,
      data: aiResponse,
      timestamp: new Date().toISOString()
    };

  } catch (error: any) {
    console.error('Error submitting AI query:', error);
    
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
 * Fetch popular/suggested questions for the AI assistant
 * @returns {Promise<Array>} List of popular questions with metadata
 */
export async function getPopularQuestions() {
  try {
    const response = await fetch('/api/ai/popular-questions', {
      method: 'GET',
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch popular questions: ${response.status}`);
    }

    const questions = await response.json();
    
    return {
      success: true,
      data: questions,
      timestamp: new Date().toISOString()
    };

  } catch (error: any) {
    console.error('Error fetching popular questions:', error);
    
    // Return fallback questions if API fails
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

    const response = await fetch(`/api/ai/query-history/${userId}`, {
      method: 'GET',
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch query history: ${response.status}`);
    }

    const history = await response.json();
    
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
      ? `\n\n**Recommendations:**\n${recommendations.map(rec => `• ${rec}`).join('\n')}`
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
export function getSuggestedFollowUps(queryType) {
  const followUpMap = {
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
