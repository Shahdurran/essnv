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
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

  // State for date filtering
  const [selectedPeriod, setSelectedPeriod] = useState<string>("1Y");

  /**
   * Fetch real revenue data from P&L using Financial Revenue API
   */
  const { data: revenueData, isLoading, error } = useQuery<{
    categories: FinancialRevenueCategory[];
    totalRevenue: number;
    period: string;
  }>({
    queryKey: [`/api/financial/revenue/${selectedLocationId}/${selectedPeriod}`],
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
  });

  /**
   * Map P&L revenue line items to CPT codes
   */
  const getCPTCode = (procedureName: string): string => {
    const cptMap: Record<string, string> = {
      "Office Visits": "99213",
      "Diagnostics & Minor Procedures": "92235", 
      "Cataract Surgeries": "66984",
      "Intravitreal Injections": "67028",
      "Refractive Cash": "LASIK",
      "Corneal Procedures": "65710",
      "Oculoplastics": "15823",
      "Optical / Contact Lens Sales": "OPTICAL"
    };
    return cptMap[procedureName] || "00000";
  };

  /**
   * Calculate base price from revenue and estimated volume
   */
  const calculateBasePrice = (revenue: number): string => {
    // Estimate based on typical procedure volumes
    const volumeMap: Record<string, number> = {
      "Office Visits": 1250,
      "Diagnostics & Minor Procedures": 890,
      "Cataract Surgeries": 185,
      "Intravitreal Injections": 240,
      "Refractive Cash": 75,
      "Corneal Procedures": 45,
      "Oculoplastics": 28,
      "Optical / Contact Lens Sales": 450
    };
    
    // Get appropriate period multiplier based on selected period
    const periodMultiplier = selectedPeriod === "1Y" ? 12 : selectedPeriod === "6M" ? 6 : selectedPeriod === "3M" ? 3 : 1;
    const monthlyRevenue = revenue / periodMultiplier;
    const defaultVolume = 100; // fallback
    const basePrice = monthlyRevenue / defaultVolume;
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(basePrice);
  };

  /**
   * Estimate monthly volume from revenue
   */
  const estimateMonthlyVolume = (revenue: number, procedureName: string): number => {
    const volumeMap: Record<string, number> = {
      "Office Visits": 1250,
      "Diagnostics & Minor Procedures": 890,
      "Cataract Surgeries": 185,
      "Intravitreal Injections": 240,
      "Refractive Cash": 75,
      "Corneal Procedures": 45,
      "Oculoplastics": 28,
      "Optical / Contact Lens Sales": 450
    };
    
    const periodMultiplier = selectedPeriod === "1Y" ? 12 : selectedPeriod === "6M" ? 6 : selectedPeriod === "3M" ? 3 : 1;
    const baseVolume = volumeMap[procedureName] || 100;
    return Math.round(baseVolume / periodMultiplier);
  };

  // Convert P&L revenue data to procedure format and sort by revenue descending
  const procedures = revenueData?.categories?.map((category, index) => ({
    cptCode: getCPTCode(category.name),
    description: category.name,
    revenue: category.amount,
    growth: category.change || 0,
    basePrice: calculateBasePrice(category.amount),
    monthlyVolume: estimateMonthlyVolume(category.amount, category.name)
  })).sort((a, b) => b.revenue - a.revenue) || [];

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
        
        {/* Header with Date Filter */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 space-y-3 lg:space-y-0">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-primary flex-shrink-0" />
              <span className="truncate">Top Revenue Procedures</span>
            </h3>
            <p className="text-sm text-gray-600 mt-1">Eye care services by revenue from P&L data</p>
          </div>
          
          {/* Date Filter */}
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-slate-500" />
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[120px] text-sm">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1M">1 Month</SelectItem>
                <SelectItem value="3M">3 Months</SelectItem>
                <SelectItem value="6M">6 Months</SelectItem>
                <SelectItem value="1Y">1 Year</SelectItem>
              </SelectContent>
            </Select>
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
                      
                      {/* Procedure Details */}
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate">
                          {procedure.description || `${procedure.cptCode} Procedure`}
                        </h4>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1">
                          CPT: {procedure.cptCode}
                        </p>
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
                Showing {procedures.length} revenue procedures ({selectedPeriod})
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
