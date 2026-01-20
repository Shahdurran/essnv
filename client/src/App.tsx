/*
 * MAIN APPLICATION COMPONENT
 * ==========================
 * 
 * This is the root component of our React application. It sets up the core architecture
 * and provides essential context that all other components need to function properly.
 * 
 * MODERN REACT PATTERNS USED:
 * 1. Provider Pattern: Wrapping components in context providers
 * 2. Component Composition: Building complex UIs from simple, reusable pieces  
 * 3. Client-side Routing: Navigation without full page reloads
 * 4. State Management: Centralized server state with TanStack Query
 * 5. Authentication: Protected routing with persistent auth state
 * 
 * ARCHITECTURAL DECISIONS:
 * This component establishes several key architectural patterns:
 * - Single Page Application (SPA) with client-side routing
 * - Centralized server state management for API data
 * - Global UI component system (tooltips, toasts)
 * - Authentication-protected routing
 * - Clean separation between routing logic and application setup
 */

// Modern lightweight routing library for React SPAs
import { Switch, Route } from "wouter";

// TanStack Query for server state management and caching
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";

// Global UI components for user feedback and interaction
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// Authentication context for app-wide auth management
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

// Page components for different application routes
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Login from "@/pages/login";
import Settings from "@/pages/settings";

/*
 * PROTECTED ROUTER COMPONENT
 * ==========================
 * 
 * Handles authentication-aware routing. Users must be logged in to access
 * protected routes, otherwise they are redirected to the login page.
 * 
 * AUTHENTICATION FLOW:
 * 1. Check if user is authenticated using auth context
 * 2. Show loading spinner while checking auth status
 * 3. If authenticated, show protected routes (dashboard, etc.)
 * 4. If not authenticated, show login page
 * 
 * ROUTE STRUCTURE:
 * - "/login": Login page (public route)
 * - "/" (root): Main dashboard (protected route)
 * - "*" (wildcard): 404 page for unmatched routes
 */
function ProtectedRouter() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading spinner while checking authentication status
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show login page for all routes
  if (!isAuthenticated) {
    return <Login />;
  }

  // If authenticated, show protected routes
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

/*
 * MAIN APPLICATION COMPONENT
 * ==========================
 * 
 * This component sets up the essential providers and context that the entire
 * application depends on. Think of it as the "foundation" of our app.
 * 
 * PROVIDER PATTERN EXPLANATION:
 * React's "provider pattern" lets us make data and functionality available to
 * any component in our app without having to pass props down through every level.
 * 
 * PROVIDER NESTING ORDER:
 * 1. AuthProvider (authentication state)
 * 2. QueryClientProvider (server state)
 * 3. TooltipProvider (UI interactions)  
 * 4. Toaster (user notifications)
 * 5. ProtectedRouter (page navigation)
 */
function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <ProtectedRouter />
        </TooltipProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
}

/*
 * DEFAULT EXPORT
 * ==============
 * 
 * Export the App component as the default export so it can be imported
 * and used in main.tsx to render the entire application.
 * 
 * This follows the common React pattern where each file has one primary
 * component that it exports as the default.
 */
export default App;