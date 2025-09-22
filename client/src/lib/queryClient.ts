/*
 * TANSTACK QUERY CLIENT CONFIGURATION
 * ===================================
 * 
 * This module sets up our centralized client for managing server state throughout
 * the React application. TanStack Query (formerly React Query) is a powerful library
 * that handles the complexities of server state management in frontend applications.
 * 
 * WHY SERVER STATE IS CHALLENGING:
 * Server state is fundamentally different from local UI state:
 * - It's asynchronous (network requests take time)
 * - It can become stale (data changes on the server)
 * - It's shared across components (multiple components need same data)
 * - It needs caching (avoid refetching identical data)
 * - It requires error handling (network failures, API errors)
 * - It needs loading states (show spinners while fetching)
 * 
 * TANSTACK QUERY SOLUTIONS:
 * - Automatic caching with intelligent cache invalidation
 * - Background refetching to keep data fresh
 * - Optimistic updates for immediate UI feedback
 * - Retry logic for failed requests
 * - Loading and error states handled automatically
 * - Request deduplication (avoid duplicate requests)
 * 
 * OUR CONFIGURATION APPROACH:
 * We configure TanStack Query with settings optimized for our medical analytics app:
 * - Conservative caching (data doesn't change frequently)
 * - No automatic refetching (user controls when to refresh)
 * - Single retry policy (fail fast for better UX)
 * - Credential inclusion for authenticated requests
 */

// Import TanStack Query core types and functionality
import { QueryClient, QueryFunction } from "@tanstack/react-query";

/*
 * HTTP ERROR HANDLING UTILITY
 * ===========================
 * 
 * This function converts HTTP error responses into JavaScript Error objects
 * that can be properly handled by our error boundaries and try/catch blocks.
 * 
 * FETCH API BEHAVIOR:
 * The Fetch API doesn't automatically throw errors for HTTP error status codes
 * (like 404, 500, etc.). It only throws for network errors. This means we need
 * to manually check response.ok and throw errors for HTTP error statuses.
 * 
 * ERROR INFORMATION EXTRACTION:
 * We try to get meaningful error messages from the server response:
 * 1. Try to read response body as text (server may include error details)
 * 2. Fall back to response.statusText if no body
 * 3. Include HTTP status code for debugging
 * 
 * @param {Response} res - The Fetch API Response object to check
 * @throws {Error} If the response indicates an HTTP error status
 */
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    // Extract error message from response body or status text
    const text = (await res.text()) || res.statusText;
    // Throw detailed error with status code and message
    throw new Error(`${res.status}: ${text}`);
  }
}

/*
 * GENERIC API REQUEST FUNCTION
 * ============================
 * 
 * This is our centralized function for making HTTP requests to our backend API.
 * It handles all the common patterns: JSON serialization, headers, credentials, etc.
 * 
 * DESIGN BENEFITS:
 * - Single place to configure request defaults
 * - Consistent error handling across all API calls
 * - Automatic JSON serialization for request bodies
 * - Credential inclusion for authenticated requests
 * - TypeScript support for request/response types
 * 
 * AUTHENTICATION HANDLING:
 * credentials: "include" ensures that browser cookies (like session cookies)
 * are included with requests, enabling server-side session authentication.
 * 
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE, etc.)
 * @param {string} url - The API endpoint URL to request
 * @param {unknown} data - Optional request body data (will be JSON serialized)
 * @returns {Promise<Response>} The Fetch API Response object
 */
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Make the HTTP request with our standard configuration
  const res = await fetch(url, {
    method,
    // Only set JSON content type header if we're sending data
    headers: data ? { "Content-Type": "application/json" } : {},
    // Serialize data to JSON if provided
    body: data ? JSON.stringify(data) : undefined,
    // Include cookies for authentication
    credentials: "include",
  });

  // Check for HTTP errors and throw if found
  await throwIfResNotOk(res);
  return res;
}

/*
 * AUTHENTICATION BEHAVIOR TYPE
 * ============================
 * 
 * This type defines how our query functions should behave when they encounter
 * HTTP 401 (Unauthorized) responses from the server.
 * 
 * BEHAVIOR OPTIONS:
 * - "returnNull": Return null instead of throwing (useful for optional user data)
 * - "throw": Throw an error (useful for required data that needs authentication)
 */
type UnauthorizedBehavior = "returnNull" | "throw";

/*
 * EMBEDDED DATA QUERY FUNCTION
 * ============================
 * 
 * This creates query functions that use embedded data instead of making API calls.
 * All data is served from the embedded data service for faster, more reliable performance.
 * 
 * TANSTACK QUERY INTEGRATION:
 * TanStack Query uses "query functions" to fetch data. These functions:
 * - Receive a queryKey (array that identifies the query)
 * - Return a Promise that resolves to the data
 * - Can throw errors that TanStack Query will handle
 * 
 * QUERY KEY CONVENTION:
 * We use the query key to determine which data service function to call.
 * For example: queryKey: ["/api", "locations"] calls dataService.getLocations()
 * 
 * @param {Object} options - Configuration options for the query function
 * @param {UnauthorizedBehavior} options.on401 - How to handle 401 responses (not used with embedded data)
 * @returns {QueryFunction<T>} A query function configured for TanStack Query
 */
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Import the data service
    const { dataService } = await import('./dataService');
    
    // Convert query key array to determine which function to call
    const path = queryKey.join("/");
    
    // Route to appropriate data service function based on the path
    if (path === "/api/locations") {
      return await dataService.getLocations();
    }
    
    if (path.startsWith("/api/analytics/key-metrics")) {
      const locationId = queryKey[2] || 'all';
      const timeRange = queryKey[3] || '1';
      return await dataService.getKeyMetrics(locationId, timeRange);
    }
    
    if (path.startsWith("/api/financial/revenue")) {
      const locationId = queryKey[3] || 'all';
      const period = queryKey[4] || '1Y';
      return await dataService.getFinancialRevenue(locationId, period);
    }
    
    if (path.startsWith("/api/financial/expenses")) {
      const locationId = queryKey[3] || 'all';
      const period = queryKey[4] || '1Y';
      return await dataService.getFinancialExpenses(locationId, period);
    }
    
    if (path.startsWith("/api/financial/cashflow")) {
      const locationId = queryKey[3] || 'all';
      const period = queryKey[4] || '1Y';
      return await dataService.getCashFlow(locationId, period);
    }
    
    if (path.startsWith("/api/financial/profit-loss")) {
      const locationId = queryKey[3] || 'all';
      const period = queryKey[4] || '1Y';
      return await dataService.getProfitLoss(locationId, period);
    }
    
    if (path.startsWith("/api/analytics/revenue-trends")) {
      const locationId = queryKey[3] || 'all';
      const period = queryKey[4] || '1yr';
      return await dataService.getRevenueTrends(locationId, period);
    }
    
    if (path.startsWith("/api/analytics/ar-buckets")) {
      const locationId = queryKey[3] || 'all';
      return await dataService.getARBuckets(locationId);
    }
    
    if (path.startsWith("/api/analytics/insurance-claims")) {
      const locationId = queryKey[3] || 'all';
      return await dataService.getInsuranceClaims(locationId);
    }
    
    if (path.startsWith("/api/analytics/patient-billing")) {
      const locationId = queryKey[3] || 'all';
      const timeRange = queryKey[4] || '30';
      return await dataService.getPatientBilling(locationId, timeRange);
    }
    
    if (path.startsWith("/api/analytics/top-procedures")) {
      const locationId = queryKey[3] || 'all';
      const category = queryKey[4] || 'all';
      const timeRange = queryKey[5] || '1';
      return await dataService.getTopRevenueProcedures(locationId, category, timeRange);
    }
    
    if (path.startsWith("/api/analytics/insurance-breakdown")) {
      const locationId = queryKey[3] || 'all';
      const timeRange = queryKey[4] || '1';
      return await dataService.getInsurancePayerBreakdown(locationId, timeRange);
    }
    
    if (path.startsWith("/api/analytics/projections")) {
      const locationId = queryKey[3] || 'all';
      return await dataService.getPatientVolumeProjections(locationId);
    }
    
    if (path === "/api/ai/popular-questions") {
      return await dataService.getPopularQuestions();
    }
    
    // If no matching route found, throw an error
    throw new Error(`No embedded data available for path: ${path}`);
  };

/*
 * MAIN QUERY CLIENT CONFIGURATION
 * ===============================
 * 
 * This creates and configures our global TanStack Query client with settings
 * optimized for our medical analytics application.
 * 
 * CONFIGURATION PHILOSOPHY:
 * Our settings prioritize data consistency and user control over aggressive caching:
 * 
 * QUERY DEFAULTS:
 * - queryFn: Uses our custom query function with error throwing
 * - refetchInterval: false (no automatic polling - data is relatively stable)
 * - refetchOnWindowFocus: false (don't refetch when user returns to tab)
 * - staleTime: Infinity (data stays fresh until manually invalidated)
 * - retry: false (fail fast - medical data should be reliable or clearly failed)
 * 
 * MUTATION DEFAULTS:
 * - retry: false (mutations should succeed immediately or fail clearly)
 * 
 * WHY THESE CHOICES?
 * Medical practice data doesn't change very frequently, and users need to trust
 * that what they're seeing is accurate. We prefer explicit user-triggered refreshes
 * over automatic background updates that might confuse users.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    // Configuration for data fetching queries
    queries: {
      // Use our custom query function that handles errors consistently
      queryFn: getQueryFn({ on401: "throw" }),
      // Don't automatically refetch on an interval (user controls refresh)
      refetchInterval: false,
      // Don't refetch when user returns to browser tab
      refetchOnWindowFocus: false,
      // Data stays fresh indefinitely (until manually invalidated)
      staleTime: Infinity,
      // Don't retry failed requests (fail fast for better error handling)
      retry: false,
    },
    // Configuration for data modification mutations
    mutations: {
      // Don't retry failed mutations (mutations should be explicit)
      retry: false,
    },
  },
});
