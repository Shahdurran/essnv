import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  Users,
  ArrowUpRight,
  Target
} from "lucide-react";
import type { ProjectionData } from "../../../shared/schema";

interface RevenueProjectionsProps {
  selectedLocationId: string;
}

/**
 * RevenueProjections Component
 * 
 * Displays monthly revenue and patient volume forecasts based on historical data.
 * Provides 6-month forward projections with confidence levels and growth metrics.
 * Integrates machine learning forecasting algorithms for accurate predictions.
 * 
 * Features:
 * - 6-month revenue and patient projections
 * - Confidence level indicators for each projection
 * - Growth rate calculations vs previous year
 * - Professional projection cards with gradient backgrounds
 * - Location-based projection filtering
 * - Real-time forecast updates
 * 
 * @param {Object} props - Component properties
 * @param {string} props.selectedLocationId - Currently selected location for filtering
 */
export default function RevenueProjections({ selectedLocationId }: RevenueProjectionsProps) {

  /**
   * Fetch revenue and patient volume projections from API
   */
  const { data: projections = [], isLoading, error } = useQuery<ProjectionData[]>({
    queryKey: ['/api/analytics/projections', selectedLocationId],
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes since projections don't change frequently
  });

  /**
   * Format currency values for display
   * @param {number} value - The currency value
   * @returns {string} Formatted currency string
   */
  const formatCurrency = (value: number): string => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value?.toLocaleString() || '0'}`;
  };

  /**
   * Format large numbers for display
   * @param {number} value - The numeric value to format
   * @returns {string} Formatted number string
   */
  const formatNumber = (value: number): string => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value?.toLocaleString() || '0';
  };

  /**
   * Get confidence level color and label
   * @param {number} confidence - Confidence level (0-1)
   * @returns {Object} Color class and label
   */
  const getConfidenceLevel = (confidence: number): { color: string; label: string } => {
    if (confidence >= 0.9) {
      return { color: 'text-green-600 bg-green-50', label: 'High' };
    } else if (confidence >= 0.75) {
      return { color: 'text-blue-600 bg-blue-50', label: 'Medium' };
    } else {
      return { color: 'text-yellow-600 bg-yellow-50', label: 'Low' };
    }
  };

  /**
   * Get gradient background for projection cards
   * @param {number} index - Index of the projection card
   * @returns {string} CSS gradient class
   */
  const getGradientBackground = (index: number): string => {
    const gradients = [
      'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200',
      'bg-gradient-to-br from-green-50 to-green-100 border-green-200',
      'bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200',
      'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200',
      'bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200',
      'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200'
    ];
    
    return gradients[index % gradients.length];
  };

  /**
   * Get text color for projection cards
   * @param {number} index - Index of the projection card
   * @returns {string} CSS text color class
   */
  const getTextColor = (index: number): string => {
    const colors = [
      'text-blue-700',
      'text-green-700', 
      'text-indigo-700',
      'text-purple-700',
      'text-teal-700',
      'text-orange-700'
    ];
    
    return colors[index % colors.length];
  };

  /**
   * Parse growth rate string to number for comparison
   * @param {string} growthRate - Growth rate string (e.g., "+15.3%")
   * @returns {number} Numeric growth rate
   */
  const parseGrowthRate = (growthRate: string): number => {
    if (!growthRate) return 0;
    return parseFloat(growthRate.replace('%', '').replace('+', ''));
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
              <h3 className="text-lg font-semibold text-gray-900">Revenue Projections</h3>
              <p className="text-gray-600">Loading forecasting data...</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="bg-gray-100 p-6 rounded-xl animate-pulse">
                <div className="h-4 bg-gray-300 rounded w-3/4 mb-4"></div>
                <div className="h-8 bg-gray-300 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-2/3 mb-4"></div>
                <div className="border-t border-gray-300 pt-4">
                  <div className="h-3 bg-gray-300 rounded w-full"></div>
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
              <h3 className="text-lg font-semibold text-gray-900">Revenue Projections</h3>
              <p className="text-red-600">Failed to load projection data</p>
            </div>
          </div>
          
          <div className="text-center py-8">
            <TrendingUp className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <p className="text-gray-600">Please try refreshing the page</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
      <CardContent className="p-6">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-primary" />
              Revenue Projections
            </h3>
            <p className="text-gray-600">Monthly forecasts based on historical data and trends</p>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-gray-900">Next 6 Months</span>
          </div>
        </div>

        {/* Projection Cards */}
        {projections.length === 0 ? (
          <div className="text-center py-8">
            <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No projection data available</p>
            <p className="text-sm text-gray-500 mt-2">
              Projections will appear when sufficient historical data is available
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {projections.slice(0, 3).map((projection, index) => {
              const gradientClass = getGradientBackground(index);
              const textColorClass = getTextColor(index);
              const confidence = getConfidenceLevel(projection.confidenceLevel || 0.85);
              const monthName = projection.monthName || 
                new Date(projection.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
              
              return (
                <div 
                  key={projection.month || index} 
                  className={`${gradientClass} p-6 rounded-xl border`}
                >
                  {/* Month Header */}
                  <div className="flex items-center justify-between mb-4">
                    <h4 className={`font-semibold ${textColorClass}`}>
                      {monthName}
                    </h4>
                    <ArrowUpRight className={`h-5 w-5 ${textColorClass}`} />
                  </div>
                  
                  {/* Revenue Projection */}
                  <p className={`text-2xl font-bold ${textColorClass} mb-2`}>
                    {formatCurrency(projection.projectedRevenue)}
                  </p>
                  
                  {/* Growth Rate */}
                  <div className="flex items-center space-x-2 mb-4">
                    <Badge 
                      variant="secondary"
                      className={`text-sm font-medium ${
                        parseGrowthRate(projection.growthRate) > 0 
                          ? 'text-green-600 bg-green-50' 
                          : 'text-red-600 bg-red-50'
                      }`}
                    >
                      {projection.growthRate || '+0.0%'}
                    </Badge>
                    <span className="text-sm text-gray-600">vs last year</span>
                  </div>
                  
                  {/* Additional Metrics */}
                  <div className="border-t border-current/20 pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm ${textColorClass}`}>
                        Expected Patients:
                      </span>
                      <span className={`font-semibold ${textColorClass}`}>
                        {formatNumber(projection.projectedPatients)}
                      </span>
                    </div>
                    
                    {/* Confidence Level */}
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${textColorClass}`}>
                        Confidence:
                      </span>
                      <Badge 
                        variant="secondary"
                        className={`text-xs ${confidence.color}`}
                      >
                        <Target className="h-3 w-3 mr-1" />
                        {confidence.label} ({Math.round((projection.confidenceLevel || 0.85) * 100)}%)
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Additional Projections Summary */}
        {projections.length > 3 && (
          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                Showing first 3 of {projections.length} monthly projections
              </span>
              <div className="flex items-center space-x-4">
                <span className="text-gray-600">Total 6-Month Forecast:</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(projections.reduce((sum, proj) => sum + (proj.projectedRevenue || 0), 0))}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Location Context */}
        {selectedLocationId && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Projections for: {selectedLocationId === "all" ? "All Locations" : "Selected Location"}
                </p>
                <p className="text-xs text-gray-600">
                  Based on historical performance and market trends
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Algorithm:</p>
                <p className="text-sm font-medium text-gray-900">ML Forecasting</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
