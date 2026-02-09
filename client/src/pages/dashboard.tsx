/*
 * MAIN DASHBOARD PAGE COMPONENT
 * =============================
 * 
 * This is the heart of our medical analytics application - the main dashboard
 * where practice owners and staff interact with their business intelligence data.
 * 
 * DASHBOARD DESIGN PHILOSOPHY:
 * Medical practice dashboards need to balance comprehensive data with usability:
 * - Critical metrics prominently displayed (revenue, patient volume, AR days)
 * - Complex analytics available but not overwhelming
 * - Multiple views of the same data (charts, tables, summaries)
 * - Filtering capabilities to drill down into specific insights
 * - AI assistance for natural language queries
 * 
 * COMPONENT ARCHITECTURE:
 * This dashboard follows a "widget-based" architecture where each major
 * analytics feature is encapsulated in its own component. Benefits:
 * - Individual widgets can be developed and tested independently
 * - Easy to add/remove/rearrange widgets based on user needs
 * - Performance optimizations can be applied per widget
 * - Different user roles could see different widget combinations
 * 
 * STATE MANAGEMENT STRATEGY:
 * We use local component state for UI interactions (filtering, selections)
 * and TanStack Query for server data (analytics, metrics, projections).
 * This separation keeps the component focused on UI logic while
 * delegating data fetching to specialized hooks.
 */

// React hooks for state management
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Settings as SettingsIcon, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

// Import all dashboard widget components
// These are the major analytical components that make up our dashboard
import LocationSelector from "@/components/LocationSelector";
import AIBusinessAssistant from "@/components/AIBusinessAssistant";
import KeyMetricsTrendsChart from "@/components/KeyMetricsTrendsChart";
import InsuranceClaimsTracker from "@/components/InsuranceClaimsTracker";
import TopRevenueProcedures from "@/components/TopRevenueProcedures";
import PracticeInsights from "@/components/PracticeInsights";
import RevenueProjections from "@/components/RevenueProjections";
import PatientBillingAnalytics from "@/components/PatientBillingAnalytics";
import ARBucketsWidget from "@/components/ARBucketsWidget";
import FinancialRevenueWidget from "@/components/FinancialRevenueWidget";
import FinancialExpensesWidget from "@/components/FinancialExpensesWidget";
import ProfitLossWidget from "@/components/ProfitLossWidget";
import CashInWidget from "@/components/CashInWidget";
import CashOutWidget from "@/components/CashOutWidget";
import CashFlowWidget from "@/components/CashFlowWidget";
import CollectionsBreakdownWidget from "@/components/CollectionsBreakdownWidget";

// Import brand assets for professional appearance (defaults)
import mdsLogo from "@assets/MDS Logo_1754254040718.png";
import drJohnJosephsonPhoto from "@assets/Dr. John Josephson_1757862871625.jpeg";

/*
 * MAIN DASHBOARD COMPONENT
 * ========================
 * 
 * This component orchestrates the entire dashboard experience for medical practice
 * business intelligence. It manages the overall layout, filtering state, and
 * coordinates data flow between different analytical widgets.
 * 
 * KEY FEATURES PROVIDED:
 * 
 * 1. LOCATION-BASED ANALYTICS
 *    - Filter data by specific practice location or view aggregated data
 *    - Each location has unique patient demographics and procedure mix
 *    - Enables comparison between different practice sites
 * 
 * 2. AI-POWERED BUSINESS ASSISTANT  
 *    - Natural language queries about practice performance
 *    - Contextual insights based on current filter selections
 *    - Helps non-technical users explore complex data
 * 
 * 3. COMPREHENSIVE ANALYTICS WIDGETS
 *    - Revenue trends with forecasting capabilities
 *    - Insurance claims tracking and denial analysis
 *    - Top performing procedures by revenue
 *    - Key performance indicators and metrics
 *    - Accounts receivable aging analysis
 * 
 * 4. RESPONSIVE DESIGN
 *    - Mobile-first approach with desktop enhancements
 *    - Widgets reflow and resize based on screen size
 *    - Touch-friendly interfaces for tablet use
 * 
 * 5. PROFESSIONAL MEDICAL PRACTICE BRANDING
 *    - Custom logo and practitioner information
 *    - Medical industry color scheme and terminology
 *    - HIPAA-conscious design without PHI exposure
 */
export default function Dashboard() {
  /*
   * STATE MANAGEMENT FOR FILTERING
   * ==============================
   * 
   * The dashboard maintains several pieces of filter state that affect
   * how data is displayed across multiple widgets.
   */

  // Get user configuration from auth context (dynamic identity / preset)
  const { user, isAdmin, logout, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Show loading state while auth is being checked
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return null; // Will redirect from App.tsx or show login
  }

  /*
   * LOCATION FILTER STATE
   * =====================
   * 
   * Controls which practice location(s) to display analytics for.
   * 
   * POSSIBLE VALUES:
   * - "all": Aggregated data across all 2 practice locations
   * - "fairfax": Fairfax, VA location only
   * - "gainesville": Gainesville, VA location only
   * 
   * BUSINESS IMPACT:
   * Location filtering is crucial for multi-site practices because:
   * - Different locations serve different patient demographics
   * - Procedure mix varies by location (urban vs suburban, etc.)
   * - Staffing and operational metrics differ between sites
   * - Practice owners need to identify high/low performing locations
   */
  const [selectedLocationId, setSelectedLocationId] = useState("all");

  /*
   * PROCEDURE CATEGORY FILTER STATE
   * ===============================
   * 
   * Controls which types of procedures to include in procedure-specific analytics.
   * 
   * OPHTHALMOLOGY PROCEDURE CATEGORIES:
   * - "all": All procedure types
   * - "medical": Medical ophthalmology (cataract surgery, injections, eye exams)
   * - "cosmetic": Cosmetic ophthalmology (blepharoplasty)
   * - "refractive": Refractive surgery (LASIK, PRK)
   * 
   * BUSINESS RATIONALE:
   * Medical vs cosmetic vs refractive procedures have different characteristics:
   * - Medical: Insurance coverage, consistent volume, regulatory requirements
   * - Cosmetic: Often cash pay, elective procedures, higher margins
   * - Refractive: Typically cash pay, high-value procedures, patient satisfaction focus
   * - Eye specialty practices need to analyze these segments separately
   */
  const [selectedProcedureCategory, setSelectedProcedureCategory] = useState("all");

  /*
   * ANALYSIS SECTION TAB STATE
   * ===========================
   * 
   * Controls which analysis section is displayed below the AI assistant.
   * 
   * AVAILABLE SECTIONS:
   * - "financial": Financial Analysis (default) - P&L, Cash Flow, Revenue/Expense tracking
   * - "clinical": Clinical Analysis - Existing clinical widgets and metrics
   * 
   * BUSINESS PURPOSE:
   * Separates financial reporting from clinical analytics to provide focused views
   * for different user roles and analytical needs.
   */
  const [activeTab, setActiveTab] = useState("financial");

  /*
   * CONSOLIDATED FINANCIAL DATE FILTER STATE
   * =========================================
   * 
   * Single date range filter that controls all 6 financial widgets:
   * Revenue, Expenses, P&L Statement, Cash In, Cash Out, Cash Flow
   */
  const [selectedFinancialPeriod, setSelectedFinancialPeriod] = useState('1Y');

  /*
   * EVENT HANDLER FUNCTIONS
   * =======================
   * 
   * These functions handle user interactions and update the dashboard state.
   * They also provide opportunities for analytics tracking and logging.
   */

  /*
   * LOCATION CHANGE HANDLER
   * =======================
   * 
   * Called when user selects a different location from the location selector.
   * Updates the dashboard state and triggers re-fetching of location-specific data.
   * 
   * @param {string} locationId - The ID of the newly selected location
   * 
   * SIDE EFFECTS:
   * - Updates selectedLocationId state
   * - Triggers re-render of all location-dependent components
   * - Could trigger analytics tracking for usage insights
   * - Could update URL params for bookmarkable dashboard states
   */
  const handleLocationChange = (locationId: string) => {
    setSelectedLocationId(locationId);

    // Log the filter change for debugging and usage analytics
    console.log(`Dashboard filtered to location: ${locationId}`);

    // TODO: Future enhancements could include:
    // - Update URL parameters for bookmarkable dashboard states
    // - Track filter usage for analytics and UX improvements
    // - Show loading states while data refreshes
    // - Persist user's last location selection in localStorage
  };

  /*
   * PROCEDURE CATEGORY CHANGE HANDLER
   * =================================
   * 
   * Called when user changes the procedure category filter.
   * Updates the filter state which affects procedure-specific analytics widgets.
   * 
   * @param {string} category - The newly selected procedure category
   * 
   * BUSINESS LOGIC:
   * This filter primarily affects the TopRevenueProcedures widget, but could
   * be extended to filter other procedure-related analytics as the app grows.
   */
  const handleProcedureCategoryChange = (category: string) => {
    setSelectedProcedureCategory(category);
    console.log(`Procedure filter changed to: ${category}`);

    // TODO: Future enhancements:
    // - Update related widgets that show procedure-specific data
    // - Add smooth transitions when filter changes
    // - Implement filter state persistence
  };

  /*
   * TAB CHANGE HANDLER
   * ==================
   * 
   * Called when user switches between Financial Analysis and Clinical Analysis tabs.
   * Updates the active tab state to show the appropriate analysis section.
   * 
   * @param {string} tab - The newly selected tab ("financial" or "clinical")
   */
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    console.log(`Analysis tab changed to: ${tab}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">

      {/* 
        Header Section - Mobile Responsive
        Displays practice branding and user information matching the design
      */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            {/* Brand and Logo Section - Mobile Optimized (bound to user preset) */}
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
              <img
                src={user?.logoUrl ?? mdsLogo}
                alt={`${user?.practiceName ?? "MDS AI Analytics"} Logo`}
                className="w-8 h-8 sm:w-12 sm:h-12 object-contain flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h1 className="text-sm sm:text-xl font-bold text-gray-900 truncate">{user?.practiceName ?? "MDS AI Analytics"}</h1>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">{user?.practiceSubtitle || "Eye Specialists & Surgeons of Northern Virginia"}</p>
              </div>
            </div>

            {/* User Profile Section - Mobile Optimized */}
            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              {/* Settings button - only visible to admin */}
              {isAdmin && (
                <Link href="/settings">
                  <Button variant="ghost" size="sm" className="hidden sm:flex">
                    <SettingsIcon className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                  <Button variant="ghost" size="sm" className="sm:hidden">
                    <SettingsIcon className="h-4 w-4" />
                  </Button>
                </Link>
              )}
              
              {/* Logout button */}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={async () => {
                  await logout();
                  setLocation('/login');
                }}
                className="hidden sm:flex"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={async () => {
                  await logout();
                  setLocation('/login');
                }}
                className="sm:hidden"
              >
                <LogOut className="h-4 w-4" />
              </Button>
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{user?.ownerName ?? "Dr. John Josephson"}</p>
                <p className="text-xs text-gray-600">{user?.ownerTitle ?? "Practice Owner"}</p>
              </div>
              <img
                src={user?.ownerPhotoUrl ?? drJohnJosephsonPhoto}
                alt={user?.ownerName ?? "Owner"}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-blue-100"
                onError={(e) => {
                  // Fallback to default if Base64 image fails to load
                  e.currentTarget.src = drJohnJosephsonPhoto;
                }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* 
        Main Dashboard Content - Mobile Responsive
        Organized in a responsive grid layout matching the design specifications
      */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-8">

        {/* 
          Location Selector Component
          Allows users to filter analytics by practice location
          Supports all 5 demo practice locations plus "All Locations" option
        */}
        <LocationSelector
          selectedLocationId={selectedLocationId}
          onLocationChange={handleLocationChange}
        />

        {/* 
          AI Business Assistant Component
          Main chat interface for natural language analytics queries
          Powered by OpenAI GPT-4o with ophthalmology practice context
        */}
        <AIBusinessAssistant
          selectedLocationId={selectedLocationId}
        />

        {/* 
          Analysis Sections Tabs
          Toggle between Financial Analysis and Clinical Analysis
        */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Tab Headers */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6" data-testid="analysis-tabs">
              <button
                onClick={() => handleTabChange("financial")}
                data-testid="tab-financial"
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${activeTab === "financial"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
              >
                Financial Analysis
              </button>
              <button
                onClick={() => handleTabChange("clinical")}
                data-testid="tab-clinical"
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${activeTab === "clinical"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
              >
                Clinical Analysis
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === "financial" && (
              <div className="space-y-6" data-testid="financial-analysis-content">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <h3 className="text-lg font-semibold text-gray-900">Financial Analysis</h3>

                  {/* Consolidated Date Range Filter */}
                  <div className="flex items-center gap-2" data-testid="financial-date-filter">
                    <span className="text-sm font-medium text-gray-700">Time Period:</span>
                    <div className="flex bg-gray-100 rounded-lg p-1">
                      {[
                        { value: '1M', label: '1M' },
                        { value: '3M', label: '3M' },
                        { value: '6M', label: '6M' },
                        { value: '1Y', label: '1Y' }
                      ].map((period) => (
                        <button
                          key={period.value}
                          onClick={() => setSelectedFinancialPeriod(period.value)}
                          data-testid={`period-${period.value.toLowerCase()}`}
                          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${selectedFinancialPeriod === period.value
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                            }`}
                        >
                          {period.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Revenue and Expenses Widgets Row */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {/* Financial Revenue Widget */}
                  <div data-testid="widget-financial-revenue">
                    <FinancialRevenueWidget
                      selectedLocationId={selectedLocationId}
                      selectedPeriod={selectedFinancialPeriod}
                      title={user?.revenueTitle || "Revenue"}
                      subheadingOverrides={user?.revenueSubheadings || {}}
                    />
                  </div>

                  {/* Financial Expenses Widget */}
                  <div data-testid="widget-financial-expenses">
                    <FinancialExpensesWidget
                      selectedLocationId={selectedLocationId}
                      selectedPeriod={selectedFinancialPeriod}
                      title={user?.expensesTitle || "Expenses"}
                      subheadingOverrides={user?.expensesSubheadings || {}}
                    />
                  </div>
                </div>

                {/* Additional Financial Widgets */}
                <div className="space-y-6">
                  {/* P&L Statement Widget */}
                  <div data-testid="widget-profit-loss">
                    <ProfitLossWidget
                      selectedLocationId={selectedLocationId}
                      selectedPeriod={selectedFinancialPeriod}
                      profitLossTitle={user?.profitLossTitle || 'Profit & Loss'}
                      revenueSubheadings={user?.revenueSubheadings || {}}
                      expensesSubheadings={user?.expensesSubheadings || {}}
                    />
                  </div>

                  {/* Cash In vs Cash Out Widgets Row */}
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {/* Cash In Widget */}
                    <div data-testid="widget-cash-in">
                      <CashInWidget
                        selectedLocationId={selectedLocationId}
                        selectedPeriod={selectedFinancialPeriod}
                        title={user?.cashInTitle || "Cash In"}
                        subheadingOverrides={user?.cashInSubheadings || {}}
                      />
                    </div>

                    {/* Cash Out Widget */}
                    <div data-testid="widget-cash-out">
                      <CashOutWidget
                        selectedLocationId={selectedLocationId}
                        selectedPeriod={selectedFinancialPeriod}
                        title={user?.cashOutTitle || "Cash Out"}
                        subheadingOverrides={user?.cashOutSubheadings || {}}
                      />
                    </div>
                  </div>

                  {/* Cash Flow Statement Widget */}
                  <div data-testid="widget-cash-flow">
                    <CashFlowWidget
                      selectedLocationId={selectedLocationId}
                      selectedPeriod={selectedFinancialPeriod}
                      title="Cash Flow Statement"
                      subheadingOverrides={user?.cashFlowSubheadings || {}}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "clinical" && (
              <div className="space-y-6" data-testid="clinical-analysis-content">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Clinical Analysis</h3>

                {/* 
                  Key Metrics Trends Chart Component
                  Advanced charting with actual vs projected data
                  Modified: Default to 1 year, add EBITDA, replace AR Days with Write-Offs
                */}
                <KeyMetricsTrendsChart
                  selectedLocationId={selectedLocationId}
                  selectedTimePeriod={selectedFinancialPeriod}
                />
                {/* 
                  Collections Breakdown Per Provider Widget
                  Shows provider-level collection data with graph and list views
                  Only visible if user has showCollectionsWidget enabled
                */}
                {user?.showCollectionsWidget && (
                  <CollectionsBreakdownWidget
                    selectedLocationId={selectedLocationId}
                    selectedTimePeriod={selectedFinancialPeriod}
                  />
                )}
                {/* 
                  Insurance Claims Tracker Component
                  Claims organized by status (Pending, Submitted, Denied) with provider breakdown
                */}
                <InsuranceClaimsTracker
                  selectedLocationId={selectedLocationId}
                  selectedTimePeriod={selectedFinancialPeriod}
                />

                {/* 
                  Clinical Analysis Grid Layout - Mobile Responsive
                  Two-column responsive grid for procedure analytics and practice insights
                */}
                <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 md:gap-8">

                  {/* 
                    Top Revenue Procedures Component
                    Modified: Remove category filter, show fixed procedure list
                  */}
                  <TopRevenueProcedures
                    selectedLocationId={selectedLocationId}
                    selectedTimePeriod={selectedFinancialPeriod}
                    title={user?.topRevenueTitle || "Top Revenue Procedures"}
                    procedureNameOverrides={user?.procedureNameOverrides || {}}
                  />

                  {/* 
                    Practice Insights Component
                    Key performance indicators and insurance payer analytics
                  */}
                  <PracticeInsights
                    selectedLocationId={selectedLocationId}
                    selectedTimePeriod={selectedFinancialPeriod}
                  />

                </div>

                {/* 
                  Bottom Row - Billing and AR Analytics (50/50 Layout)
                  Two-column responsive grid for billing analytics and AR aging
                */}
                <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 md:gap-8">

                  {/* 
                    Patient Billing Analytics Component
                    Half-width widget for patient payment insights
                    Tracks overdue balances, collection rates, and aging breakdown
                  */}
                  <PatientBillingAnalytics
                    selectedLocationId={selectedLocationId}
                    selectedTimePeriod={selectedFinancialPeriod}
                  />

                  {/* 
                    AR Buckets Widget Component
                    Half-width widget for accounts receivable aging analysis
                    Shows outstanding insurance claims by aging buckets (0-30, 31-60, 61-90, 90+ days)
                  */}
                  <ARBucketsWidget
                    selectedLocationId={selectedLocationId}
                    selectedTimePeriod={selectedFinancialPeriod}
                    title="AR Buckets (Outstanding Claims)"
                    subheadingOverrides={user?.arSubheadings ?? {}}
                  />

                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
