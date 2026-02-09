/*
 * QUERY PARSER UTILITY MODULE
 * ===========================
 * 
 * This module provides intelligent parsing of natural language queries using OpenAI's GPT-4o
 * to extract context like location and time range preferences from user questions.
 * 
 * ARCHITECTURAL PRINCIPLES:
 * - Use actual AI capabilities instead of primitive string matching
 * - Load location data dynamically from database
 * - Provide reusable utilities that work for any medical practice
 * - Separate business logic from routing logic
 * - Enable proper unit testing and maintainability
 */

import OpenAI from 'openai';
import type { PracticeLocation } from '../../shared/schema';

/*
 * QUERY CONTEXT INTERFACE
 * =======================
 * 
 * Standardized structure for extracted query context that can be used
 * across different components and routes.
 */
interface QueryContext {
  locationId: string;     // Extracted or default location ID
  timeRange: string;      // Extracted or default time range
  confidence: number;     // AI confidence in the extraction (0-1)
  originalQuery: string;  // The original user query for reference
}

/*
 * OPENAI CLIENT INITIALIZATION
 * ============================
 * 
 * Lazy initialize OpenAI client for query parsing. This prevents the app from
 * crashing if the API key is not available and allows graceful degradation.
 */
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR;
    if (!apiKey) {
      throw new Error('OpenAI API key is required for AI query parsing. Please set the OPENAI_API_KEY environment variable.');
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

/*
 * INTELLIGENT QUERY CONTEXT EXTRACTION
 * ====================================
 * 
 * Uses OpenAI GPT-4o to intelligently extract location and time context from
 * natural language queries. This replaces primitive string matching with
 * actual AI-powered natural language understanding.
 * 
 * @param {string} query - The user's natural language question
 * @param {PracticeLocation[]} availableLocations - Current practice locations from database
 * @param {string} defaultLocationId - Fallback location if none detected
 * @param {string} defaultTimeRange - Fallback time range if none detected
 * @returns {Promise<QueryContext>} Extracted context with confidence scores
 */
export async function extractQueryContext(
  query: string,
  availableLocations: PracticeLocation[],
  defaultLocationId: string = 'all',
  defaultTimeRange: string = '1'
): Promise<QueryContext> {
  
  try {
    // Create location mapping for AI reference
    const locationList = availableLocations.map(loc => ({
      id: loc.id,
      name: loc.name,
      city: loc.city,
      state: loc.state
    }));

    // Construct AI prompt for context extraction
    const systemPrompt = `You are a medical practice analytics assistant. Extract location and time context from user queries.

Available locations: ${JSON.stringify(locationList)}

Time range options:
- "1" = 1 month
- "3" = 3 months  
- "6" = 6 months
- "12" = 12 months

Return JSON with:
{
  "locationId": "extracted location ID or 'all' if not specific",
  "timeRange": "extracted time range or '1' if not specified",
  "confidence": 0.0-1.0 confidence score,
  "reasoning": "brief explanation of extraction"
}

If no specific location is mentioned, use "all". If no time period is mentioned, use "1".`;

    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: query }
      ],
      response_format: { type: "json_object" },
      max_tokens: 200,
      temperature: 0.1 // Low temperature for consistent extraction
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    // Validate extracted location ID exists
    const validLocationId = availableLocations.some(loc => loc.id === result.locationId) 
      ? result.locationId 
      : defaultLocationId;

    // Validate extracted time range
    const validTimeRange = ['1', '3', '6', '12'].includes(result.timeRange)
      ? result.timeRange
      : defaultTimeRange;

    return {
      locationId: validLocationId,
      timeRange: validTimeRange,
      confidence: Math.max(0, Math.min(1, result.confidence || 0.5)),
      originalQuery: query
    };

  } catch (error) {
    // Check if it's an API key error specifically
    if (error instanceof Error && error.message.includes('OpenAI API key')) {
      console.warn('AI query parsing unavailable: OpenAI API key not configured. Using fallback parsing.');
    } else {
      console.error('Error extracting query context:', error);
    }
    
    // Fallback to defaults if AI extraction fails
    return {
      locationId: defaultLocationId,
      timeRange: defaultTimeRange,
      confidence: 0,
      originalQuery: query
    };
  }
}

/*
 * VALIDATE EXTRACTED CONTEXT
 * ==========================
 * 
 * Ensures that extracted context values are valid and safe to use in API calls.
 * Provides additional validation beyond the AI extraction.
 * 
 * @param {QueryContext} context - The extracted context to validate
 * @param {PracticeLocation[]} availableLocations - Valid locations for verification
 * @returns {QueryContext} Validated and sanitized context
 */
export function validateQueryContext(
  context: QueryContext,
  availableLocations: PracticeLocation[]
): QueryContext {
  
  // Validate location ID
  const validLocationIds = [...availableLocations.map(loc => loc.id), 'all'];
  const locationId = validLocationIds.includes(context.locationId) 
    ? context.locationId 
    : 'all';

  // Validate time range
  const validTimeRanges = ['1', '3', '6', '12'];
  const timeRange = validTimeRanges.includes(context.timeRange)
    ? context.timeRange
    : '1';

  // Ensure confidence is within valid range
  const confidence = Math.max(0, Math.min(1, context.confidence));

  return {
    ...context,
    locationId,
    timeRange,
    confidence
  };
}

/*
 * GET LOCATION BY NATURAL REFERENCE
 * =================================
 * 
 * Helper function to find locations based on natural language references
 * without relying on hardcoded strings. This works with any practice's locations.
 * 
 * @param {string} reference - Natural language location reference
 * @param {PracticeLocation[]} availableLocations - Current practice locations
 * @returns {PracticeLocation | null} Matching location or null if not found
 */
export function findLocationByReference(
  reference: string,
  availableLocations: PracticeLocation[]
): PracticeLocation | null {
  
  const refLower = reference.toLowerCase().trim();
  
  // Try exact matches first
  for (const location of availableLocations) {
    if (
      location.name.toLowerCase().includes(refLower) ||
      (location.city?.toLowerCase() ?? '').includes(refLower) ||
      (location.state?.toLowerCase() ?? '').includes(refLower)
    ) {
      return location;
    }
  }
  
  // No match found
  return null;
}

/*
 * PARSE TIME RANGE EXPRESSION
 * ===========================
 * 
 * Converts natural language time expressions into standardized time range identifiers.
 * Works with common medical practice time references.
 * 
 * @param {string} expression - Natural language time expression
 * @returns {string} Standardized time range identifier
 */
export function parseTimeRangeExpression(expression: string): string {
  const exprLower = expression.toLowerCase().trim();
  
  // Monthly patterns
  if (exprLower.includes('month') && (exprLower.includes('1') || exprLower.includes('one'))) {
    return '1';
  }
  
  // Quarterly patterns
  if (exprLower.includes('quarter') || (exprLower.includes('3') && exprLower.includes('month'))) {
    return '3';
  }
  
  // Semi-annual patterns
  if (exprLower.includes('half') || (exprLower.includes('6') && exprLower.includes('month'))) {
    return '6';
  }
  
  // Annual patterns
  if (exprLower.includes('year') || (exprLower.includes('12') && exprLower.includes('month'))) {
    return '12';
  }
  
  // Default to 1 month
  return '1';
}