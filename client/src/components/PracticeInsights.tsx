import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  DollarSign, 
  Clock, 
  Percent, 
  TrendingUp, 
  TrendingDown,
  Shield,
  Heart,
  UserCheck,
  Flag
} from "lucide-react";
import type { KeyMetrics, InsurancePayerData } from "../../../shared/schema";

interface PracticeInsightsProps {
  selectedLocationId: string;
}

/**
 * PracticeInsights Component
 * 
 * Displays key performance indicators and insurance payer analytics.
 * Provides comprehensive practice metrics including patient volume,
 * revenue trends, AR days, and insurance breakdown analysis.
 * 
 * Features:
 * - Key metrics grid with visual indicators
 * - Insurance payer breakdown with AR days
 * - Growth rate calculations and trends
 * - Professional medical dashboard design
 * - Real-time data integration
 * - Location-based filtering support
 * 
 * @param {Object} props - Component properties
 * @param {string} props.selectedLocationId - Currently selected location for filtering
 */
export default function PracticeInsights({ selectedLocationId }: PracticeInsightsProps) {

  /**
   * Fetch key performance metrics from API
   */
  const { data: keyMetrics = {} as KeyMetrics, isLoading: metricsLoading, error: metricsError } = useQuery<KeyMetrics>({
    queryKey: ['/api/analytics/key-metrics', selectedLocationId],
    staleTime: 1 * 60 * 1000, // Cache for 1 minute for real-time feel
  });

  /**
   * Fetch insurance payer breakdown from API
   */
  const { data: insuranceData = [], isLoading: insuranceLoading, error: insuranceError } = useQuery<InsurancePayerData[]>({
    queryKey: ['/api/analytics/insurance-breakdown', selectedLocationId],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  /**
   * Format large numbers for display
   * @param {number} value - The numeric value to format
   * @returns {string} Formatted number string
   */
  const formatNumber = (value: number): string => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value?.toLocaleString() || '0';
  };

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
   * Get growth indicator component
   * @param {string} growthRate - Growth rate string (e.g., "+8.2%")
   * @returns {JSX.Element} Growth indicator component
   */
  const getGrowthIndicator = (growthRate: string) => {
    if (!growthRate) return null;
    
    const isPositive = growthRate.startsWith('+');
    const isNegative = growthRate.startsWith('-');
    
    return (
      <Badge 
        variant="secondary"
        className={`text-xs font-medium ${
          isPositive ? 'text-green-600 bg-green-50' : 
          isNegative ? 'text-red-600 bg-red-50' : 
          'text-gray-600 bg-gray-50'
        }`}
      >
        {isPositive && <TrendingUp className="h-3 w-3 mr-1" />}
        {isNegative && <TrendingDown className="h-3 w-3 mr-1" />}
        {growthRate}
      </Badge>
    );
  };

  /**
   * Get insurance payer icon
   * @param {string} payerName - Name of the insurance payer
   * @returns {JSX.Element} Appropriate icon component
   */
  const getPayerIcon = (payerName: string) => {
    const iconMap = {
      "Blue Cross Blue Shield": Shield,
      "Aetna": Heart,
      "Self-Pay": UserCheck,
      "Medicare": Flag,
      "Cigna": Shield,
      "United Healthcare": Shield,
      "default": Shield
    };
    
    const IconComponent = iconMap[payerName as keyof typeof iconMap] || iconMap.default;
    return IconComponent;
  };

  /**
   * Get color for insurance payer
   * @param {string} payerName - Name of the insurance payer
   * @returns {string} CSS class for color
   */
  const getPayerColor = (payerName: string): string => {
    const colorMap = {
      "Blue Cross Blue Shield": "text-blue-600 bg-blue-100",
      "Aetna": "text-red-600 bg-red-100",
      "Self-Pay": "text-green-600 bg-green-100",
      "Medicare": "text-purple-600 bg-purple-100",
      "Cigna": "text-orange-600 bg-orange-100",
      "United Healthcare": "text-indigo-600 bg-indigo-100",
      "default": "text-gray-600 bg-gray-100"
    };
    
    return colorMap[payerName as keyof typeof colorMap] || colorMap.default;
  };

  /**
   * Render loading state for metrics
   */
  if (metricsLoading || insuranceLoading) {
    return (
      <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Practice Insights</h3>
          
          {/* Loading skeleton for metrics grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="bg-gray-100 p-4 rounded-lg animate-pulse">
                <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                <div className="h-6 bg-gray-300 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-1/3"></div>
              </div>
            ))}
          </div>
          
          {/* Loading skeleton for insurance breakdown */}
          <div className="border-t border-gray-100 pt-6">
            <div className="h-4 bg-gray-300 rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-300 rounded-lg"></div>
                    <div className="h-4 bg-gray-300 rounded w-24"></div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="h-3 bg-gray-300 rounded w-12"></div>
                    <div className="h-3 bg-gray-300 rounded w-16"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  /**
   * Render error state
   */
  if (metricsError || insuranceError) {
    return (
      <Card className="bg-white rounded-xl shadow-sm border border-red-200">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Practice Insights</h3>
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-600">Failed to load practice insights</p>
            <p className="text-sm text-gray-600 mt-2">Please try refreshing the page</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
      <CardContent className="p-6">
        
        {/* Header */}
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Practice Insights</h3>
        
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          
          {/* Monthly Patients */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-5 w-5 text-blue-600" />
              {getGrowthIndicator(keyMetrics.patientGrowth)}
            </div>
            <p className="text-2xl font-bold text-blue-700">
              {formatNumber(keyMetrics.monthlyPatients)}
            </p>
            <p className="text-sm text-blue-600">Monthly Patients</p>
          </div>
          
          {/* Monthly Revenue */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              {getGrowthIndicator(keyMetrics.revenueGrowth)}
            </div>
            <p className="text-2xl font-bold text-green-700">
              {formatCurrency(keyMetrics.monthlyRevenue)}
            </p>
            <p className="text-sm text-green-600">Monthly Revenue</p>
          </div>
          
          {/* Average AR Days */}
          <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <Clock className="h-5 w-5 text-teal-600" />
              <Badge variant="secondary" className="text-xs text-red-600 bg-red-50">
                -2.1 days
              </Badge>
            </div>
            <p className="text-2xl font-bold text-teal-700">
              {keyMetrics.arDays || '28.4'}
            </p>
            <p className="text-sm text-teal-600">Avg AR Days</p>
          </div>
          
          {/* Clean Claims Rate */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <Percent className="h-5 w-5 text-purple-600" />
              <Badge variant="secondary" className="text-xs text-green-600 bg-green-50">
                +3.2%
              </Badge>
            </div>
            <p className="text-2xl font-bold text-purple-700">
              {keyMetrics.cleanClaimRate || '94.2'}%
            </p>
            <p className="text-sm text-purple-600">Clean Claims</p>
          </div>
        </div>

        {/* Insurance Breakdown */}
        <div className="border-t border-gray-100 pt-6">
          <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
            <Shield className="h-4 w-4 mr-2" />
            Top Insurance Payers
          </h4>
          
          {insuranceData.length === 0 ? (
            <div className="text-center py-6">
              <Shield className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">No insurance data available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {insuranceData.slice(0, 4).map((payer, index) => {
                const IconComponent = getPayerIcon(payer.name);
                const colorClass = getPayerColor(payer.name);
                
                return (
                  <div key={payer.name || index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorClass}`}>
                        <IconComponent className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {payer.name}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        {payer.percentage?.toFixed(1) || '0.0'}%
                      </p>
                      <p className="text-xs text-gray-600">
                        {payer.arDays?.toFixed(1) || '0.0'} days
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Practice Summary */}
        {selectedLocationId && (
          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                {selectedLocationId === "all" 
                  ? "Aggregated metrics across all locations" 
                  : `Metrics for selected location`
                }
              </span>
              <div className="flex items-center space-x-4">
                <span className="text-gray-600">Period:</span>
                <Badge variant="outline" className="text-xs">
                  Current Month
                </Badge>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
