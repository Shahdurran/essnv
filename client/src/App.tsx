import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";

/**
 * Main Router Component
 * Handles navigation between different pages in the MDS AI Analytics application
 * Currently includes the main dashboard and fallback 404 page
 */
function Router() {
  return (
    <Switch>
      {/* Main dashboard route - displays comprehensive analytics interface */}
      <Route path="/" component={Dashboard} />
      
      {/* Additional routes can be added here as the application grows */}
      {/* <Route path="/settings" component={Settings} /> */}
      {/* <Route path="/reports" component={Reports} /> */}
      
      {/* Fallback route for undefined paths */}
      <Route component={NotFound} />
    </Switch>
  );
}

/**
 * Main Application Component
 * Sets up the core providers and context for the entire application
 * 
 * Providers included:
 * - QueryClientProvider: Manages server state and API caching with TanStack Query
 * - TooltipProvider: Enables tooltip functionality throughout the app
 * - Toaster: Provides toast notification system for user feedback
 */
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
