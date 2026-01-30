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
// Shadcn UI components for consistent design
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
// Mock data for procedure analytics
import { generateTopRevenueProcedures } from "@/lib/mockData";
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
  Stethoscope,  // Medical examination procedures
  Calendar      // Date filtering
} from "lucide-react";
// TypeScript interface for financial data
import type { FinancialRevenueCategory } from "../../../shared/schema";
// Authentication context for user information
import { useAuth } from "@/contexts/AuthContext";

/*
 * TYPESCRIPT INTERFACE DEFINITION
 * ===============================
 * 
 * Define the component props interface for type safety and clear API documentation.
 */
interface TopRevenueProceduresProps {
  selectedLocationId: string;                           // Location filter for display context
  selectedTimePeriod: string;                           // Time period filter for data
  title?: string;                                       // Widget title from user preset
  procedureNameOverrides?: Record<string, string>;       // Custom labels: key = description or CPT code
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
  selectedLocationId,
  selectedTimePeriod,
  title = "Top Revenue Procedures",
  procedureNameOverrides = {}
}: TopRevenueProceduresProps) {
  // Get user context to determine practice type
  const { user } = useAuth();
  
  // Determine practice type based on user's practice name
  const practiceType = user?.practiceName?.toLowerCase().includes('orthodontic') 
    ? 'orthodontic' 
    : 'ophthalmology';

  // State for local time range filtering - Initialize with "last-month" preset
  const [localTimeRange, setLocalTimeRange] = useState("last-month");

  /**
   * Convert local time range to time period format
   */
  const getTimePeriodFromLocalRange = (range: string): string => {
    switch (range) {
      case 'last-month':
        return '1M';
      case 'last-3-months':
        return '3M';
      case 'last-6-months':
        return '6M';
      case 'last-year':
        return '1Y';
      default:
        return selectedTimePeriod; // Fallback to global time period
    }
  };

  /**
   * Get procedure data from mock data
   * Uses local time range if set, otherwise uses global time period
   */
  const effectiveTimePeriod = getTimePeriodFromLocalRange(localTimeRange);
  const procedures = generateTopRevenueProcedures(effectiveTimePeriod, practiceType);
  
  /** Resolve display name: override by description or CPT code, else default. Revenue amounts unchanged. */
  const getProcedureDisplayName = (proc: { description?: string; cptCode?: string }) => {
    const d = proc.description ?? '';
    const c = proc.cptCode ?? '';
    if (procedureNameOverrides[d]?.trim()) return procedureNameOverrides[d];
    if (procedureNameOverrides[c]?.trim()) return procedureNameOverrides[c];
    return d || 'Procedure';
  };
  
  const revenueData = {
    categories: procedures.map(proc => ({
      id: proc.id,
      name: proc.name,
      amount: proc.monthlyRevenue,
      change: parseFloat(proc.growth.replace('%', '')),
      trend: parseFloat(proc.growth.replace('%', '')) > 0 ? 'up' as const : 'down' as const
    })),
    totalRevenue: procedures.reduce((sum, proc) => sum + proc.monthlyRevenue, 0),
    period: selectedTimePeriod
  };





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

  return (
    <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
      <CardContent className="p-6">
        
        {/* Header - title from user preset */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <DollarSign className="h-5 w-5 mr-2 text-primary flex-shrink-0" />
            <span className="truncate">{title}</span>
          </h3>
        </div>

        {/* Local Time Range Filter */}
        <div className="mb-6">
          <div className="flex items-center flex-wrap gap-2">
            <span className="text-sm font-medium text-gray-700">Revenue Period:</span>
            {[
              { key: 'last-month', label: 'Last Month' },
              { key: 'last-3-months', label: 'Last 3 Months' },
              { key: 'last-6-months', label: 'Last 6 Months' },
              { key: 'last-year', label: 'Last Year' }
            ].map((period) => (
              <button
                key={period.key}
                onClick={() => setLocalTimeRange(period.key)}
                className={`px-3 py-1 text-sm rounded-md border transition-colors ${
                  localTimeRange === period.key
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Showing procedure revenue for {localTimeRange.replace('-', ' ')} period
          </p>
        </div>


        {/* Procedures List - Scrollable Container */}
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
                
                return (
                  <div 
                    key={procedure.cptCode || index} 
                    className="flex flex-col space-y-3 p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors sm:flex-row sm:items-center sm:justify-between sm:space-y-0"
                  >
                    <div className="flex items-start space-x-3 sm:items-center sm:space-x-4 min-w-0">
                      {/* Procedure Icon */}
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <IconComponent className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      </div>
                      
                      {/* Procedure Details - label from procedureNameOverrides or default */}
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate">
                          {getProcedureDisplayName(procedure)}
                        </h4>
                      </div>
                    </div>
                    
                    {/* Revenue and Growth - Mobile Stacked */}
                    <div className="flex items-center justify-between sm:flex-col sm:text-right sm:justify-start">
                      <p className="font-semibold text-gray-900 text-sm sm:text-base">
                        {formatRevenue(procedure.monthlyRevenue || 0)}
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
                Showing {procedures.length} revenue procedures ({localTimeRange.replace('-', ' ')})
                {selectedLocationId !== 'all' && ` for selected location`}
              </span>
              <div className="flex items-center space-x-4">
                <span className="text-gray-600">Total Revenue:</span>
                <span className="font-semibold text-gray-900">
                  {formatRevenue(revenueData?.totalRevenue || 0)}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
