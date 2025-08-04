import { useQuery } from '@tanstack/react-query';
import { Clock, TrendingDown, AlertTriangle } from 'lucide-react';

/**
 * AR Buckets Widget - Displays aging buckets for outstanding insurance claims
 * Shows accounts receivable aging in 0-30, 31-60, 61-90, and 90+ day buckets
 * Uses color coding to indicate urgency levels for collections
 */

interface ARBucket {
  ageRange: string;
  amount: number;
  claimCount: number;
  color: {
    bg: string;
    border: string;
    text: string;
  };
}

interface ARBucketsWidgetProps {
  selectedLocationId: string;
}

export default function ARBucketsWidget({ selectedLocationId }: ARBucketsWidgetProps) {
  
  /**
   * Fetch AR buckets data from the API
   * This data shows aging of outstanding insurance claims by location
   */
  const { data: arData, isLoading, error } = useQuery({
    queryKey: ['/api/analytics/ar-buckets', selectedLocationId],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/ar-buckets/${selectedLocationId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch AR buckets data');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes - AR data changes frequently
  });

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
   * Calculate total outstanding AR amount
   * @returns {number} Sum of all AR bucket amounts
   */
  const getTotalAR = (): number => {
    if (!arData?.buckets) return 0;
    return arData.buckets.reduce((total: number, bucket: ARBucket) => total + bucket.amount, 0);
  };

  /**
   * Get color scheme for AR aging buckets
   * @param {string} ageRange - The age range (0-30, 31-60, 61-90, 90+)
   * @returns {Object} Color classes for background, border, and text
   */
  const getBucketColors = (ageRange: string) => {
    const colorMap = {
      '0-30': {
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-800',
        bar: 'bg-green-500'
      },
      '31-60': {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        text: 'text-yellow-800',
        bar: 'bg-yellow-500'
      },
      '61-90': {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        text: 'text-orange-800',
        bar: 'bg-orange-500'
      },
      '90+': {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-800',
        bar: 'bg-red-500'
      }
    };
    
    return colorMap[ageRange as keyof typeof colorMap] || {
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      text: 'text-gray-800',
      bar: 'bg-gray-500'
    };
  };

  /**
   * Render loading state
   */
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Clock className="w-6 h-6 mr-2 text-blue-600" />
              AR Buckets (Outstanding Claims)
            </h2>
            <p className="text-sm text-gray-600 mt-1">Loading aging analysis...</p>
          </div>
        </div>
        <div className="space-y-4">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="bg-gray-100 rounded-lg p-4 animate-pulse">
              <div className="w-24 h-4 bg-gray-300 rounded mb-2"></div>
              <div className="w-full h-6 bg-gray-300 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /**
   * Render error state
   */
  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center text-red-600">
          <AlertTriangle className="w-5 h-5 mr-2" />
          <span>Unable to load AR buckets data</span>
        </div>
      </div>
    );
  }

  const totalAR = getTotalAR();
  const maxAmount = Math.max(...(arData?.buckets?.map((b: ARBucket) => b.amount) || [0]));

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Clock className="w-6 h-6 mr-2 text-blue-600" />
            AR Buckets (Outstanding Claims)
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Aging analysis of unpaid insurance claims
          </p>
        </div>

        {/* Total Outstanding AR */}
        <div className="mt-4 sm:mt-0 text-right">
          <p className="text-sm text-gray-600">Total Outstanding</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(totalAR)}
          </p>
        </div>
      </div>

      {/* AR Buckets Display */}
      <div className="space-y-4">
        {arData?.buckets?.map((bucket: ARBucket, index: number) => {
          const colors = getBucketColors(bucket.ageRange);
          const percentage = maxAmount > 0 ? (bucket.amount / maxAmount) * 100 : 0;
          
          return (
            <div 
              key={bucket.ageRange}
              className={`${colors.bg} ${colors.border} border rounded-lg p-4`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full ${colors.bar} mr-3`}></div>
                  <h3 className={`font-medium ${colors.text}`}>
                    {bucket.ageRange} days
                  </h3>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${colors.text}`}>
                    {formatCurrency(bucket.amount)}
                  </p>
                  <p className="text-xs text-gray-600">
                    {bucket.claimCount} claims
                  </p>
                </div>
              </div>
              
              {/* Progress bar showing relative amount */}
              <div className="w-full bg-white rounded-full h-2">
                <div 
                  className={`${colors.bar} h-2 rounded-full transition-all duration-300`}
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-600">Current (0-60 days)</p>
            <p className="text-lg font-semibold text-green-700">
              {formatCurrency(
                (arData?.buckets?.filter((b: ARBucket) => ['0-30', '31-60'].includes(b.ageRange))
                  .reduce((sum: number, b: ARBucket) => sum + b.amount, 0)) || 0
              )}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Aged (60+ days)</p>
            <p className="text-lg font-semibold text-red-700">
              {formatCurrency(
                (arData?.buckets?.filter((b: ARBucket) => ['61-90', '90+'].includes(b.ageRange))
                  .reduce((sum: number, b: ARBucket) => sum + b.amount, 0)) || 0
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}