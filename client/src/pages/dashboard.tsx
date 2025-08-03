import { useState } from "react";
import LocationSelector from "@/components/LocationSelector";
import AIBusinessAssistant from "@/components/AIBusinessAssistant";
import KeyMetricsTrendsChart from "@/components/KeyMetricsTrendsChart";
import TopRevenueProcedures from "@/components/TopRevenueProcedures";
import PracticeInsights from "@/components/PracticeInsights";
import RevenueProjections from "@/components/RevenueProjections";

/**
 * Main Dashboard Component for MDS AI Analytics
 * 
 * This is the primary interface for the Rao Dermatology business intelligence platform.
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
  const handleLocationChange = (locationId) => {
    setSelectedLocationId(locationId);
    // Additional analytics tracking could be added here
    console.log(`Dashboard filtered to location: ${locationId}`);
  };

  /**
   * Handle procedure category filter changes  
   * Updates procedure analytics to show medical, cosmetic, or all procedures
   * @param {string} category - The procedure category: "medical", "cosmetic", or "all"
   */
  const handleProcedureCategoryChange = (category) => {
    setSelectedProcedureCategory(category);
    console.log(`Procedure filter changed to: ${category}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 
        Header Section
        Displays practice branding and user information matching the design
      */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Brand and Logo Section */}
            <div className="flex items-center space-x-4">
              <img 
                src="/attached_assets/MDS Logo_1754254040718.png" 
                alt="MDS Medical & Dental Solutions Logo" 
                className="w-12 h-12 object-contain"
              />
              <div>
                <h1 className="text-xl font-bold text-gray-900">MDS AI Analytics</h1>
                <p className="text-sm text-gray-600">Rao Dermatology Business Intelligence</p>
              </div>
            </div>
            
            {/* User Profile Section */}
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">Dr. Babar K. Rao</p>
                <p className="text-xs text-gray-600">Practice Owner</p>
              </div>
              <img 
                src="/attached_assets/image_1754253968575.png" 
                alt="Dr. Babar K. Rao" 
                className="w-10 h-10 rounded-full object-cover border-2 border-blue-100"
              />
            </div>
          </div>
        </div>
      </header>

      {/* 
        Main Dashboard Content
        Organized in a responsive grid layout matching the design specifications
      */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        
        {/* 
          Location Selector Component
          Allows users to filter analytics by practice location
          Supports all 5 Rao Dermatology locations plus "All Locations" option
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
          Dashboard Grid Layout
          Two-column responsive grid for procedure analytics and practice insights
        */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

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
          Revenue Projections Component
          Monthly forecasting and projections based on historical data
        */}
        <RevenueProjections 
          selectedLocationId={selectedLocationId}
        />

      </div>
    </div>
  );
}
