import { useState } from "react";
import LocationSelector from "@/components/LocationSelector";
import AIBusinessAssistant from "@/components/AIBusinessAssistant";
import KeyMetricsTrendsChart from "@/components/KeyMetricsTrendsChart";
import InsuranceClaimsTracker from "@/components/InsuranceClaimsTracker";
import TopRevenueProcedures from "@/components/TopRevenueProcedures";
import PracticeInsights from "@/components/PracticeInsights";
import RevenueProjections from "@/components/RevenueProjections";
import PatientBillingAnalytics from "@/components/PatientBillingAnalytics";
import ARBucketsWidget from "@/components/ARBucketsWidget";
import mdsLogo from "@assets/MDS Logo_1754254040718.png";
import genericUserPhoto from "@assets/generic user pic_1754672840832.png";

/**
 * Main Dashboard Component for MDS AI Analytics
 * 
 * This is the primary interface for the Demo Dermatology business intelligence platform.
 * It provides a comprehensive view of practice analytics including:
 * - Location-based analytics selection
 * - AI-powered business assistant for natural language queries
 * - Advanced trends charting with projections
 * - Revenue procedure analysis
 * - Key performance indicators
 * - Financial projections and forecasting
 * 
 * The dashboard is designed to match the provided mockups exactly and supports
 * both medical and cosmetic dermatology analytics across 5 practice locations.
 */
export default function Dashboard() {
  // State management for location filtering
  // Supports individual location selection or "all" for aggregated analytics
  const [selectedLocationId, setSelectedLocationId] = useState("all");
  
  // State management for procedure category filtering  
  // Supports medical, cosmetic, or all procedure types
  const [selectedProcedureCategory, setSelectedProcedureCategory] = useState("all");

  /**
   * Handle location selection changes
   * Updates the dashboard to show analytics for the selected location
   * @param {string} locationId - The ID of the selected location or "all"
   */
  const handleLocationChange = (locationId: string) => {
    setSelectedLocationId(locationId);
    // Additional analytics tracking could be added here
    console.log(`Dashboard filtered to location: ${locationId}`);
  };

  /**
   * Handle procedure category filter changes  
   * Updates procedure analytics to show medical, cosmetic, or all procedures
   * @param {string} category - The procedure category: "medical", "cosmetic", or "all"
   */
  const handleProcedureCategoryChange = (category: string) => {
    setSelectedProcedureCategory(category);
    console.log(`Procedure filter changed to: ${category}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      {/* 
        Demo Disclaimer Banner
        Informs users this is a demonstration with static mock data
      */}
      <div className="bg-amber-50 border-b border-amber-200 px-3 sm:px-6 lg:px-8 py-3 relative">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center text-center">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse"></div>
              <p className="text-sm sm:text-base text-amber-900 font-medium">
                <span className="font-bold">DEMO MODE:</span> This is a demonstration using static mock data. Some functionality may be limited.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 
        Header Section - Mobile Responsive
        Displays practice branding and user information matching the design
      */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            {/* Brand and Logo Section - Mobile Optimized */}
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
              <img 
                src={mdsLogo} 
                alt="MDS Medical & Dental Solutions Logo" 
                className="w-8 h-8 sm:w-12 sm:h-12 object-contain flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h1 className="text-sm sm:text-xl font-bold text-gray-900 truncate">MDS AI Analytics</h1>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Demo Dermatology Practice Intelligence</p>
              </div>
            </div>
            
            {/* User Profile Section - Mobile Optimized */}
            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">Dr. Example User</p>
                <p className="text-xs text-gray-600">Practice Owner</p>
              </div>
              <img 
                src={genericUserPhoto} 
                alt="Dr. Example User" 
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-blue-100"
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
          Powered by OpenAI GPT-4o with dermatology practice context
        */}
        <AIBusinessAssistant 
          selectedLocationId={selectedLocationId}
        />

        {/* 
          Key Metrics Trends Chart Component
          Advanced charting with actual vs projected data
          Supports multiple time periods and metric types
        */}
        <KeyMetricsTrendsChart 
          selectedLocationId={selectedLocationId}
        />

        {/* 
          Insurance Claims Tracker Component
          Claims organized by status (Pending, Submitted, Denied) with provider breakdown
          Positioned below revenue chart as requested in requirements
        */}
        <InsuranceClaimsTracker 
          selectedLocationId={selectedLocationId}
        />

        {/* 
          Dashboard Grid Layout - Mobile Responsive
          Two-column responsive grid for procedure analytics and practice insights
        */}
        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2 lg:gap-8">

          {/* 
            Top Revenue Procedures Component
            Analytics for highest performing procedures with medical/cosmetic filtering
          */}
          <TopRevenueProcedures 
            selectedLocationId={selectedLocationId}
            selectedCategory={selectedProcedureCategory}
            onCategoryChange={handleProcedureCategoryChange}
          />

          {/* 
            Practice Insights Component
            Key performance indicators and insurance payer analytics
          */}
          <PracticeInsights 
            selectedLocationId={selectedLocationId}
          />

        </div>

        {/* 
          Revenue Projections Component - Temporarily removed from UI
          Component still exists but not displayed per user request
        */}
        {/* <RevenueProjections 
          selectedLocationId={selectedLocationId}
        /> */}

        {/* 
          Bottom Row - Billing and AR Analytics (50/50 Layout)
          Two-column responsive grid for billing analytics and AR aging
        */}
        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2 lg:gap-8">
          
          {/* 
            Patient Billing Analytics Component
            Half-width widget for patient payment insights
            Tracks overdue balances, collection rates, and aging breakdown
          */}
          <PatientBillingAnalytics 
            selectedLocationId={selectedLocationId}
          />

          {/* 
            AR Buckets Widget Component
            Half-width widget for accounts receivable aging analysis
            Shows outstanding insurance claims by aging buckets (0-30, 31-60, 61-90, 90+ days)
          */}
          <ARBucketsWidget 
            selectedLocationId={selectedLocationId}
          />

        </div>

      </div>
    </div>
  );
}
