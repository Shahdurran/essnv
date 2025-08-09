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
 * 
 * ARCHITECTURAL DECISIONS:
 * This component establishes several key architectural patterns:
 * - Single Page Application (SPA) with client-side routing
 * - Centralized server state management for API data
 * - Global UI component system (tooltips, toasts)
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

// Page components for different application routes
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";

/*
 * ROUTER COMPONENT
 * ================
 * 
 * Handles client-side navigation between different pages in our application.
 * This uses the Wouter library, which is a lightweight alternative to React Router.
 * 
 * WHY WOUTER?
 * - Much smaller bundle size than React Router (2KB vs 13KB gzipped)
 * - Simpler API with less boilerplate
 * - Hook-based design that matches modern React patterns
 * - Perfect for applications that don't need complex routing features
 * 
 * ROUTING STRATEGY:
 * Currently we have a simple single-page dashboard application, but this
 * structure allows easy expansion to multiple pages as the app grows.
 * 
 * ROUTE STRUCTURE:
 * - "/" (root): Main dashboard - where users spend most of their time
 * - "*" (wildcard): 404 page for any unmatched routes
 * - Future routes can be added without breaking existing functionality
 */
function Router() {
  return (
    /*
     * SWITCH COMPONENT:
     * Switch ensures only one route renders at a time.
     * Routes are checked in order, first match wins.
     */
    <Switch>
      {/* 
       * MAIN DASHBOARD ROUTE
       * This is the primary interface where users interact with the analytics platform.
       * Path="/" means this renders for the root URL (e.g., https://app.com/)
       */}
      <Route path="/" component={Dashboard} />
      
      {/* 
       * FUTURE ROUTE EXAMPLES
       * These are commented out but show how to add new pages:
       * - Settings page for user preferences and configuration
       * - Reports page for detailed analytics and exports
       * - User management for multi-user practices
       */}
      {/* <Route path="/settings" component={Settings} /> */}
      {/* <Route path="/reports" component={Reports} /> */}
      {/* <Route path="/users" component={UserManagement} /> */}
      
      {/* 
       * FALLBACK ROUTE (404 PAGE)
       * Route without a path prop matches anything not caught by previous routes.
       * This provides a graceful user experience for broken/mistyped URLs.
       */}
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
 * PROVIDER NESTING ORDER MATTERS:
 * Providers are nested inside-out, with the outermost provider being available
 * to all components below it. Our nesting order:
 * 1. QueryClientProvider (server state)
 * 2. TooltipProvider (UI interactions)  
 * 3. Toaster (user notifications)
 * 4. Router (page navigation)
 */
function App() {
  return (
    /*
     * TANSTACK QUERY PROVIDER
     * =======================
     * 
     * This provides server state management throughout our application.
     * TanStack Query (formerly React Query) handles:
     * - API request caching (avoid duplicate requests)
     * - Background data updates (keep data fresh)
     * - Loading states (show spinners while fetching)
     * - Error handling (graceful failures)
     * - Optimistic updates (immediate UI feedback)
     * 
     * WHY SERVER STATE IS DIFFERENT:
     * Server state is fundamentally different from local component state:
     * - It's asynchronous (network requests take time)
     * - It can become stale (data changes on the server)
     * - It's shared across components (multiple components need same data)
     * - It needs caching (avoid refetching the same data)
     * 
     * The queryClient is configured in ./lib/queryClient.ts with our
     * specific settings for cache time, retry logic, etc.
     */
    <QueryClientProvider client={queryClient}>
      
      {/*
       * TOOLTIP PROVIDER
       * ================
       * 
       * Enables tooltip functionality throughout the application.
       * Tooltips provide contextual help and information on hover/focus.
       * 
       * This is part of the Radix UI system we use for accessible,
       * unstyled component primitives that we customize with Tailwind CSS.
       * 
       * ACCESSIBILITY FEATURES:
       * - Keyboard navigation support
       * - Screen reader compatibility
       * - Proper ARIA attributes
       * - Focus management
       */}
      <TooltipProvider>
        
        {/*
         * TOAST NOTIFICATION SYSTEM
         * =========================
         * 
         * Provides user feedback through temporary notification messages.
         * Used for:
         * - Success messages ("Data saved successfully")
         * - Error messages ("Failed to load data")
         * - Warning messages ("Session expires in 5 minutes")
         * - Info messages ("New data available")
         * 
         * TOAST BEST PRACTICES:
         * - Auto-dismiss after a few seconds
         * - Non-blocking (users can continue working)
         * - Accessible (screen reader announcements)
         * - Stackable (multiple toasts can appear)
         * 
         * This component renders a container where toast messages appear.
         * Individual toasts are triggered by calling useToast() hook from any component.
         */}
        <Toaster />
        
        {/*
         * APPLICATION ROUTER
         * ==================
         * 
         * This is where our page navigation happens.
         * The Router component handles URL changes and renders the appropriate page.
         * 
         * In our case, almost everything happens on the main Dashboard page,
         * but this structure allows for easy expansion as the app grows.
         */}
        <Router />
        
      </TooltipProvider>
    </QueryClientProvider>
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
