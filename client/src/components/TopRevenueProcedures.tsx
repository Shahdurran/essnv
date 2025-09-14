/*
 * TOP REVENUE PROCEDURES COMPONENT
 * ================================
 * 
 * This component displays analytics for the highest-performing medical and cosmetic
 * procedures by revenue generation. It provides crucial insights into which treatments
 * drive practice profitability and growth.
 * 
 * MEDICAL PRACTICE VALUE:
 * Understanding procedure performance helps practices:
 * - Identify their most profitable services
 * - Plan staffing and equipment needs
 * - Focus marketing efforts on high-value procedures
 * - Optimize scheduling for revenue generation
 * - Compare performance across locations
 * - Track trends in procedure popularity
 * 
 * DERMATOLOGY-SPECIFIC FEATURES:
 * - Real CPT codes used in dermatology practices
 * - Medical vs cosmetic procedure categorization
 * - Appropriate procedure groupings (Mohs surgery, biopsies, cosmetic treatments)
 * - Revenue scaling appropriate for dermatology practice sizes
 * 
 * DATA VISUALIZATION CONCEPTS:
 * - Ranked list display (top performers first)
 * - Color-coded categories (medical vs cosmetic)
 * - Growth indicators with directional arrows
 * - Professional iconography for medical context
 * 
 * REACT COMPONENT PATTERNS:
 * - Controlled component (parent manages category state)
 * - TanStack Query for data fetching and caching
 * - Conditional rendering for loading/error states
 * - TypeScript interfaces for type safety
 */

// React hooks for state management
import { useState } from "react";
// TanStack Query for efficient server state management
import { useQuery } from "@tanstack/react-query";
// Shadcn UI components for consistent design
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
// Lucide React icons representing medical procedures and analytics
import { 
  DollarSign,   // Revenue indicators
  TrendingUp,   // Growth metrics
  Activity,     // General medical procedures
  Search,       // Diagnostic procedures
  Microscope,   // Laboratory/pathology work
  Syringe,      // Injection-based treatments
  Zap,          // Laser/energy-based treatments
  UserCheck,    // Patient care procedures
  Stethoscope   // Medical examination procedures
} from "lucide-react";
// TypeScript interface for procedure analytics data
import type { ProcedureAnalytics } from "../../../shared/schema";

/*
 * TYPESCRIPT INTERFACE DEFINITION
 * ===============================
 * 
 * Define the component props interface for type safety and clear API documentation.
 * This component only needs location context for display purposes.
 */
interface TopRevenueProceduresProps {
  selectedLocationId: string;                           // Location filter for display context
}

/*
 * MAIN TOP REVENUE PROCEDURES COMPONENT
 * =====================================
 * 
 * This component fetches and displays procedure performance analytics with filtering
 * capabilities. It provides insights into which treatments generate the most revenue
 * for the medical practice.
 * 
 * COMPONENT RESPONSIBILITIES:
 * 1. Fetch procedure analytics data from API
 * 2. Provide category filtering (medical/cosmetic/all)
 * 3. Display ranked list of top-performing procedures
 * 4. Show revenue, growth, and volume metrics
 * 5. Handle loading states and error conditions
 * 6. Integrate with location-based filtering
 * 
 * BUSINESS INSIGHTS PROVIDED:
 * - Which procedures generate the most revenue
 * - Growth trends for each procedure type
 * - Comparison between medical and cosmetic procedures
 * - Performance variations across locations
 * - CPT code and description for billing reference
 * 
 * @param {TopRevenueProceduresProps} props - Component properties
 */
export default function TopRevenueProcedures({ 
  selectedLocationId
}: TopRevenueProceduresProps) {

  /**
   * Fixed ophthalmology procedures list as per requirements
   * No API call needed - this is a static list for clinical analysis
   */
  const procedures: ProcedureAnalytics[] = [
    {
      cptCode: "99213",
      description: "Office Visits",
      category: "medical" as const,
      revenue: 850000,
      growth: "+12.5",
      basePrice: "$280",
      monthlyVolume: 1250
    },
    {
      cptCode: "92235",
      description: "Diagnostics & Minor Procedures",
      category: "medical" as const,
      revenue: 680000,
      growth: "+8.3",
      basePrice: "$180",
      monthlyVolume: 890
    },
    {
      cptCode: "66984",
      description: "Cataract Surgeries",
      category: "medical" as const,
      revenue: 2200000,
      growth: "+15.8",
      basePrice: "$3200",
      monthlyVolume: 185
    },
    {
      cptCode: "67028",
      description: "Intravitreal Injections",
      category: "medical" as const,
      revenue: 1800000,
      growth: "+22.1",
      basePrice: "$2100",
      monthlyVolume: 240
    },
    {
      cptCode: "LASIK",
      description: "Refractive Cash",
      category: "cosmetic" as const,
      revenue: 1200000,
      growth: "+18.7",
      basePrice: "$4500",
      monthlyVolume: 75
    },
    {
      cptCode: "65710",
      description: "Corneal Procedures",
      category: "medical" as const,
      revenue: 450000,
      growth: "+5.2",
      basePrice: "$2800",
      monthlyVolume: 45
    },
    {
      cptCode: "15823",
      description: "Oculoplastics",
      category: "cosmetic" as const,
      revenue: 380000,
      growth: "+9.8",
      basePrice: "$3500",
      monthlyVolume: 28
    },
    {
      cptCode: "OPTICAL",
      description: "Optical / Contact Lens Sales",
      category: "medical" as const,
      revenue: 320000,
      growth: "+6.4",
      basePrice: "$350",
      monthlyVolume: 450
    }
  ];

  // No loading state needed since this is static data
  const isLoading = false;
  const error = null;

  /**
   * Get appropriate icon for each ophthalmology procedure type
   * @param {string} cptCode - The CPT code or procedure identifier
   * @returns {JSX.Element} The appropriate icon component
   */
  const getProcedureIcon = (cptCode: string) => {
    const iconMap = {
      // Office visits
      "99213": Stethoscope,
      
      // Diagnostics
      "92235": Search,
      
      // Cataract surgeries
      "66984": Activity,
      
      // Intravitreal injections
      "67028": Syringe,
      
      // Refractive surgery
      "LASIK": Zap,
      
      // Corneal procedures
      "65710": Microscope,
      
      // Oculoplastics
      "15823": Activity,
      
      // Optical sales
      "OPTICAL": UserCheck,
      
      // Default
      "default": UserCheck
    };
    
    const IconComponent = iconMap[cptCode as keyof typeof iconMap] || iconMap.default;
    return IconComponent;
  };

  /**
   * Get color scheme for ophthalmology procedure categories
   * @param {string} category - The procedure category
   * @returns {string} CSS class for background color
   */
  const getProcedureColor = (category: string): string => {
    const colorMap = {
      medical: "bg-blue-500",
      cosmetic: "bg-green-500",
      default: "bg-teal-500"
    };
    
    return colorMap[category as keyof typeof colorMap] || colorMap.default;
  };

  /**
   * Format revenue values for display
   * @param {number} revenue - Revenue amount in dollars
   * @returns {string} Formatted revenue string
   */
  const formatRevenue = (revenue: number): string => {
    if (revenue >= 1000000) {
      return `$${(revenue / 1000000).toFixed(1)}M`;
    } else if (revenue >= 1000) {
      return `$${(revenue / 1000).toFixed(0)}K`;
    }
    return `$${revenue.toLocaleString()}`;
  };

  /**
   * Format growth percentage for display
   * @param {string|number} growth - Growth percentage value (could be number or string)
   * @returns {JSX.Element} Formatted growth badge with % symbol
   */
  const formatGrowth = (growth: string | number) => {
    // Convert to number if it's a string, handle both formats
    let numericGrowth: number;
    if (typeof growth === 'string') {
      // Remove any existing % symbol and convert to number
      numericGrowth = parseFloat(growth.replace('%', ''));
    } else {
      numericGrowth = growth;
    }
    
    // Format as percentage with + or - sign
    const isPositive = numericGrowth > 0;
    const isNegative = numericGrowth < 0;
    const sign = isPositive ? '+' : ''; // Negative numbers already have - sign
    const formattedValue = `${sign}${numericGrowth.toFixed(1)}%`;
    
    return (
      <Badge 
        variant="secondary"
        className={`text-xs font-medium ${
          isPositive ? 'text-green-600 bg-green-50' : 
          isNegative ? 'text-red-600 bg-red-50' : 
          'text-gray-600 bg-gray-50'
        }`}
      >
        {formattedValue}
      </Badge>
    );
  };

  /**
   * Render loading state
   */
  if (isLoading) {
    return (
      <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Top Revenue Procedures</h3>
              <p className="text-gray-600">Loading procedure analytics...</p>
            </div>
          </div>
          <div className="space-y-4">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-100 rounded-lg animate-pulse">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gray-300 rounded-lg"></div>
                  <div className="space-y-2">
                    <div className="w-32 h-4 bg-gray-300 rounded"></div>
                    <div className="w-24 h-3 bg-gray-300 rounded"></div>
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <div className="w-16 h-4 bg-gray-300 rounded"></div>
                  <div className="w-12 h-3 bg-gray-300 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  /**
   * Render error state
   */
  if (error) {
    return (
      <Card className="bg-white rounded-xl shadow-sm border border-red-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Top Revenue Procedures</h3>
              <p className="text-red-600">Failed to load procedure analytics</p>
            </div>
          </div>
          <div className="text-center py-8">
            <DollarSign className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <p className="text-gray-600">Please try refreshing the page</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
      <CardContent className="p-6">
        
        {/* Header - Simplified for Fixed Procedure List */}
        <div className="mb-6">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-primary flex-shrink-0" />
              <span className="truncate">Top Revenue Procedures</span>
            </h3>
            <p className="text-sm text-gray-600 mt-1">Ophthalmology practice services by revenue</p>
          </div>
        </div>


        {/* Procedures List - Scrollable Container (shows 5 items max) */}
        <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          <div className="space-y-4 pr-2">
            {procedures.length === 0 ? (
              <div className="text-center py-8">
                <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No procedure data available</p>
                <p className="text-sm text-gray-500 mt-2">
                  Procedure list is currently empty
                </p>
              </div>
            ) : (
              procedures.map((procedure, index) => {
                const IconComponent = getProcedureIcon(procedure.cptCode);
                const colorClass = getProcedureColor(procedure.category);
                
                return (
                  <div 
                    key={procedure.cptCode || index} 
                    className="flex flex-col space-y-3 p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors sm:flex-row sm:items-center sm:justify-between sm:space-y-0"
                  >
                    <div className="flex items-start space-x-3 sm:items-center sm:space-x-4 min-w-0">
                      {/* Procedure Icon */}
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 ${colorClass} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <IconComponent className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      </div>
                      
                      {/* Procedure Details */}
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate">
                          {procedure.description || `${procedure.cptCode} Procedure`}
                        </h4>
                        <div className="flex flex-col space-y-1 mt-1 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-2">
                          <p className="text-xs sm:text-sm text-gray-600">
                            CPT: {procedure.cptCode}
                          </p>
                          <Badge 
                            variant="outline" 
                            className={`text-xs self-start ${
                              procedure.category === 'medical' 
                                ? 'text-blue-600 border-blue-200' 
                                : 'text-purple-600 border-purple-200'
                            }`}
                          >
                            {procedure.category}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    {/* Revenue and Growth - Mobile Stacked */}
                    <div className="flex items-center justify-between sm:flex-col sm:text-right sm:justify-start">
                      <p className="font-semibold text-gray-900 text-sm sm:text-base">
                        {formatRevenue(procedure.revenue || 0)}
                      </p>
                      <div className="flex items-center space-x-1 sm:space-x-2 mt-0 sm:mt-1">
                        {formatGrowth(procedure.growth || 0)}
                        <TrendingUp className="h-3 w-3 text-green-500" />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Procedure Summary */}
        {procedures.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                Showing {procedures.length} ophthalmology procedures
                {selectedLocationId !== 'all' && ` for selected location`}
              </span>
              <div className="flex items-center space-x-4">
                <span className="text-gray-600">Total Revenue:</span>
                <span className="font-semibold text-gray-900">
                  {formatRevenue(procedures.reduce((sum, proc) => sum + (proc.revenue || 0), 0))}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
