import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  TrendingUp, 
  Activity, 
  Search, 
  Microscope, 
  Syringe,
  Zap,
  UserCheck,
  Stethoscope
} from "lucide-react";
import type { ProcedureAnalytics } from "../../../shared/schema";

interface TopRevenueProceduresProps {
  selectedLocationId: string;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

/**
 * TopRevenueProcedures Component
 * 
 * Displays analytics for highest performing procedures by revenue.
 * Includes medical/cosmetic filtering and real-time growth metrics.
 * Integrates with location filtering and uses actual dermatology CPT codes.
 * 
 * Features:
 * - Medical/Cosmetic/All procedure category filtering
 * - Real CPT codes and dermatology procedures
 * - Revenue and growth rate analytics
 * - Professional medical iconography
 * - Location-based filtering integration
 * - Responsive design matching specifications
 * 
 * @param {Object} props - Component properties
 * @param {string} props.selectedLocationId - Currently selected location for filtering
 * @param {string} props.selectedCategory - Currently selected procedure category
 * @param {Function} props.onCategoryChange - Callback when category filter changes
 */
export default function TopRevenueProcedures({ 
  selectedLocationId, 
  selectedCategory, 
  onCategoryChange 
}: TopRevenueProceduresProps) {

  // State for time range filtering - default to 1 month
  const [timeRange, setTimeRange] = useState("1");

  /**
   * Fetch top revenue procedures from API
   * Includes location and category filtering
   */
  const { data: procedures = [], isLoading, error } = useQuery<ProcedureAnalytics[]>({
    queryKey: ['/api/analytics/top-procedures', selectedLocationId, selectedCategory, timeRange],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/top-procedures/${selectedLocationId}/${selectedCategory}?timeRange=${timeRange}`);
      if (!response.ok) {
        throw new Error('Failed to fetch top procedures data');
      }
      return response.json();
    },
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes for fresh analytics
  });

  /**
   * Handle procedure category filter change
   * @param {string} category - The selected category (medical|cosmetic|all)
   */
  const handleCategoryChange = (category: string): void => {
    onCategoryChange(category);
  };

  /**
   * Get appropriate icon for each procedure type
   * @param {string} cptCode - The CPT code or procedure identifier
   * @returns {JSX.Element} The appropriate icon component
   */
  const getProcedureIcon = (cptCode: string) => {
    const iconMap = {
      // Mohs surgery procedures
      "17311": Activity,
      "17312": Activity,
      
      // Biopsy procedures  
      "11104": Microscope,
      "11105": Microscope,
      "11106": Microscope,
      
      // Excision procedures
      "11603": Search,
      "11604": Search,
      
      // Destruction procedures
      "17000": Zap,
      "17003": Zap,
      "17110": Zap,
      
      // E/M codes
      "99202": Stethoscope,
      "99213": Stethoscope,
      "99214": Stethoscope,
      
      // Cosmetic procedures
      "BOTOX": Syringe,
      "FILLER": Syringe,
      "CHEM_PEEL": Activity,
      "LASER_HAIR": Zap,
      
      // Default
      "default": UserCheck
    };
    
    const IconComponent = iconMap[cptCode as keyof typeof iconMap] || iconMap.default;
    return IconComponent;
  };

  /**
   * Get color scheme for procedure categories
   * @param {string} category - The procedure category
   * @returns {string} CSS class for background color
   */
  const getProcedureColor = (category: string): string => {
    const colorMap = {
      medical: "bg-blue-500",
      cosmetic: "bg-purple-500",
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
        
        {/* Header with Category Toggle */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-primary" />
              Top Revenue Procedures
            </h3>
            <p className="text-gray-600">Highest performing services by revenue</p>
          </div>
          
          {/* Procedure Type Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {['medical', 'cosmetic', 'all'].map((category) => (
              <Button
                key={category}
                variant="ghost"
                size="sm"
                className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                  selectedCategory === category
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => handleCategoryChange(category)}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Time Range Filter */}
        <div className="flex items-center gap-2 mb-6">
          <span className="text-sm font-medium text-gray-700">Time Range:</span>
          {['1', '3', '6', '12'].map((months) => (
            <Button
              key={months}
              variant="ghost"
              size="sm"
              className={`px-3 py-1 text-sm rounded transition-colors ${
                timeRange === months
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => setTimeRange(months)}
            >
              {months === '1' ? '1 Month' : months === '3' ? '3 Months' : months === '6' ? '6 Months' : '1 Year'}
            </Button>
          ))}
        </div>

        {/* Procedures List - Scrollable Container (shows 5 items max) */}
        <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          <div className="space-y-4 pr-2">
            {procedures.length === 0 ? (
              <div className="text-center py-8">
                <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No procedure data available</p>
                <p className="text-sm text-gray-500 mt-2">
                  {selectedLocationId === "all" 
                    ? "Data will appear when procedures are recorded"
                    : "Try selecting 'All Locations' or a different location"
                  }
                </p>
              </div>
            ) : (
              procedures.map((procedure, index) => {
                const IconComponent = getProcedureIcon(procedure.cptCode);
                const colorClass = getProcedureColor(procedure.category);
                
                return (
                  <div 
                    key={procedure.cptCode || index} 
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      {/* Procedure Icon */}
                      <div className={`w-10 h-10 ${colorClass} rounded-lg flex items-center justify-center`}>
                        <IconComponent className="h-5 w-5 text-white" />
                      </div>
                      
                      {/* Procedure Details */}
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {procedure.description || `${procedure.cptCode} Procedure`}
                        </h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <p className="text-sm text-gray-600">
                            CPT: {procedure.cptCode}
                          </p>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
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
                    
                    {/* Revenue and Growth */}
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {formatRevenue(procedure.revenue || 0)}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
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

        {/* Category Summary */}
        {procedures.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                Showing {procedures.length} {selectedCategory === 'all' ? '' : selectedCategory} procedures
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
