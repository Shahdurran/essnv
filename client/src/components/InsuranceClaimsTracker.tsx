import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  Send, 
  XCircle, 
  FileText,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  DollarSign
} from "lucide-react";
import DateFilter from "./DateFilter";
import type { ClaimsBreakdown } from "../../../shared/schema";

interface InsuranceClaimsTrackerProps {
  selectedLocationId: string;
}

/**
 * InsuranceClaimsTracker Component
 * 
 * Displays insurance claim statuses organized into 4 buckets (Submitted, Paid, Pending, Denied).
 * Each bucket shows breakdown by insurance provider with claim counts and amounts.
 * Includes location-based filtering and unified date filtering.
 * 
 * Features:
 * - Four status buckets: Submitted, Paid, Pending, Denied
 * - Insurance provider breakdown within each bucket (scrollable)
 * - Real-time claim counts and dollar amounts
 * - Location filtering integration 
 * - Unified date filtering with presets and custom range
 * - Professional medical claim management UI
 * - Responsive design matching dashboard specifications
 * 
 * @param {Object} props - Component properties
 * @param {string} props.selectedLocationId - Currently selected location for filtering
 */
export default function InsuranceClaimsTracker({ selectedLocationId }: InsuranceClaimsTrackerProps) {

  // State for date filtering - Initialize with "last-month" preset
  const [dateRange, setDateRange] = useState(() => {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - 1);
    
    return {
      start,
      end,
      preset: "last-month"
    };
  });

  /**
   * Fetch insurance claims data from API
   * Includes location-based and date-based filtering
   */
  const { data: claimsData = [], isLoading, error } = useQuery<ClaimsBreakdown[]>({
    queryKey: ['/api/analytics/insurance-claims', selectedLocationId, dateRange.start, dateRange.end],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateRange.start) {
        params.append('startDate', dateRange.start.toISOString());
      }
      if (dateRange.end) {
        params.append('endDate', dateRange.end.toISOString());
      }
      
      const url = `/api/analytics/insurance-claims/${selectedLocationId}?${params.toString()}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch claims data');
      }
      return response.json();
    },
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes for fresh claims data
  });

  /**
   * Handle date range changes from DateFilter
   * @param {Date|null} startDate - Start date
   * @param {Date|null} endDate - End date  
   * @param {string} preset - Selected preset
   */
  const handleDateRangeChange = (startDate: Date | null, endDate: Date | null, preset: string) => {
    setDateRange({ start: startDate, end: endDate, preset });
  };

  /**
   * Get appropriate icon for each claim status
   * @param {string} status - The claim status (Submitted|Paid|Pending|Denied)
   * @returns {JSX.Element} The appropriate icon component
   */
  const getStatusIcon = (status: string) => {
    const iconMap = {
      'Submitted': Send,
      'Paid': CheckCircle2,
      'Pending': Clock,
      'Denied': XCircle
    };
    
    const IconComponent = iconMap[status as keyof typeof iconMap] || FileText;
    return IconComponent;
  };

  /**
   * Get color scheme for claim statuses
   * @param {string} status - The claim status
   * @returns {Object} Color classes for background, text, and borders
   */
  const getStatusColors = (status: string) => {
    const colorMap = {
      'Submitted': {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-800',
        icon: 'text-blue-600',
        badge: 'bg-blue-100 text-blue-800'
      },
      'Paid': {
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-800',
        icon: 'text-green-600',
        badge: 'bg-green-100 text-green-800'
      },
      'Pending': {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        text: 'text-yellow-800',
        icon: 'text-yellow-600',
        badge: 'bg-yellow-100 text-yellow-800'
      },
      'Denied': {
        bg: 'bg-red-50',
        border: 'border-red-200', 
        text: 'text-red-800',
        icon: 'text-red-600',
        badge: 'bg-red-100 text-red-800'
      }
    };
    
    return colorMap[status as keyof typeof colorMap] || {
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      text: 'text-gray-800', 
      icon: 'text-gray-600',
      badge: 'bg-gray-100 text-gray-800'
    };
  };

  /**
   * Format currency values for display
   * @param {number} amount - Amount in dollars
   * @returns {string} Formatted currency string
   */
  const formatCurrency = (amount: number): string => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toLocaleString()}`;
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
              <h3 className="text-lg font-semibold text-gray-900">Insurance Claims Tracker</h3>
              <p className="text-gray-600">Loading claims data...</p>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="bg-gray-100 rounded-lg p-4 animate-pulse">
                <div className="w-24 h-6 bg-gray-300 rounded mb-4"></div>
                <div className="space-y-3">
                  <div className="w-full h-4 bg-gray-300 rounded"></div>
                  <div className="w-3/4 h-4 bg-gray-300 rounded"></div>
                  <div className="w-1/2 h-4 bg-gray-300 rounded"></div>
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
              <h3 className="text-lg font-semibold text-gray-900">Insurance Claims Tracker</h3>
              <p className="text-red-600">Failed to load claims data</p>
            </div>
          </div>
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <p className="text-gray-600">Please try refreshing the page</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  /**
   * Calculate dynamic success rate based on claims data
   * Success rate = (Submitted claims) / (Submitted + Denied claims) * 100
   * Excludes pending claims as they are still in process
   */
  const calculateSuccessRate = (): number => {
    if (claimsData.length === 0) return 0;
    
    const submittedClaims = claimsData.find(b => b.status === 'Submitted')?.totalClaims || 0;
    const deniedClaims = claimsData.find(b => b.status === 'Denied')?.totalClaims || 0;
    
    // Only count processed claims (submitted + denied) for success rate calculation
    const processedClaims = submittedClaims + deniedClaims;
    
    if (processedClaims === 0) return 0;
    
    return Math.round((submittedClaims / processedClaims) * 100);
  };

  return (
    <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
      <CardContent className="p-6">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-primary" />
              Insurance Claims Tracker
            </h3>
            <p className="text-gray-600">Claims organized by status with provider breakdown</p>
          </div>
          
          {/* Summary Stats */}
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Claims</p>
              <p className="text-xl font-semibold text-gray-900">
                {claimsData.reduce((sum, bucket) => sum + bucket.totalClaims, 0)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Value</p>
              <p className="text-xl font-semibold text-gray-900">
                {formatCurrency(claimsData.reduce((sum, bucket) => sum + bucket.totalAmount, 0))}
              </p>
            </div>
          </div>
        </div>

        {/* Date Filter */}
        <DateFilter 
          onDateRangeChange={handleDateRangeChange}
          className="mb-6"
          initialPreset="last-month"
        />

        {/* Claims Buckets Grid - Updated to 4 columns for 4 status buckets */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {claimsData.map((bucket) => {
            const StatusIcon = getStatusIcon(bucket.status);
            const colors = getStatusColors(bucket.status);
            
            return (
              <div 
                key={bucket.status}
                className={`${colors.bg} ${colors.border} border rounded-lg p-4 transition-all hover:shadow-md`}
              >
                {/* Bucket Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <StatusIcon className={`h-5 w-5 ${colors.icon}`} />
                    <h4 className={`font-semibold ${colors.text}`}>
                      {bucket.status}
                    </h4>
                  </div>
                  <Badge className={colors.badge} variant="secondary">
                    {bucket.totalClaims}
                  </Badge>
                </div>

                {/* Bucket Summary */}
                <div className="mb-4 pb-3 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Amount:</span>
                    <span className={`font-semibold ${colors.text}`}>
                      {formatCurrency(bucket.totalAmount)}
                    </span>
                  </div>
                </div>

                {/* Provider Breakdown with Scrollable List */}
                <div className="space-y-3">
                  <h5 className="text-sm font-medium text-gray-700">By Insurance Provider:</h5>
                  <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                    {bucket.providers.map((provider) => (
                      <div 
                        key={provider.name}
                        className="flex justify-between items-center py-2 px-3 bg-white rounded border border-gray-100"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {provider.name}
                          </p>
                          <p className="text-xs text-gray-600">
                            {provider.claimCount} claims
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">
                            {formatCurrency(provider.amount)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bucket Footer with Action Hint */}
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>
                      {bucket.status === 'Denied' ? 'Requires follow-up' : 
                       bucket.status === 'Pending' ? 'Awaiting review' : 
                       'In processing'}
                    </span>
                    {bucket.status === 'Denied' && (
                      <AlertTriangle className="h-3 w-3 text-red-500" />
                    )}
                    {bucket.status === 'Submitted' && (
                      <CheckCircle2 className="h-3 w-3 text-blue-500" />
                    )}
                    {bucket.status === 'Pending' && (
                      <Clock className="h-3 w-3 text-yellow-500" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Summary */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              Showing claims for {selectedLocationId === 'all' ? 'all locations' : 'selected location'}
            </span>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">Success Rate:</span>
              <span className="font-semibold text-gray-900">
                {calculateSuccessRate()}%
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}