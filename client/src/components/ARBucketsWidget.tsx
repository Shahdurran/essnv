/*
 * ACCOUNTS RECEIVABLE (AR) BUCKETS WIDGET COMPONENT
 * =================================================
 * 
 * This component displays aging analysis of outstanding insurance claims organized
 * into time-based buckets. It's a critical tool for medical practice revenue cycle
 * management and cash flow optimization.
 * 
 * ACCOUNTS RECEIVABLE CONCEPT:
 * AR represents money owed to the practice by insurance companies for services
 * already provided to patients. The "aging" refers to how long claims have been
 * outstanding since they were submitted.
 * 
 * AGING BUCKET SYSTEM:
 * Claims are organized into four standard aging buckets:
 * - 0-30 days: Recently submitted claims (normal processing time)
 * - 31-60 days: Slightly delayed claims (may need follow-up)
 * - 61-90 days: Significantly delayed claims (require attention)
 * - 90+ days: Seriously overdue claims (urgent collection action needed)
 * 
 * BUSINESS CRITICAL METRICS:
 * AR aging analysis helps practices:
 * - Identify which payers are slow to pay
 * - Prioritize collection efforts on oldest claims
 * - Monitor cash flow health and trends
 * - Negotiate better payment terms with payers
 * - Detect billing process problems early
 * - Plan working capital needs
 * 
 * COLOR-CODED URGENCY SYSTEM:
 * - Green (0-30 days): Normal, no action needed
 * - Yellow (31-60 days): Monitor, may need follow-up
 * - Orange (61-90 days): Attention required, active follow-up
 * - Red (90+ days): Urgent action needed, collection priority
 * 
 * REVENUE CYCLE IMPACT:
 * Effective AR management directly affects practice profitability:
 * - Faster collections improve cash flow
 * - Reduced aged AR decreases bad debt risk
 * - Better payer relationships improve future payments
 * - Optimized billing processes reduce delays
 */

// TanStack Query for server state management
import { useQuery } from '@tanstack/react-query';
// Lucide React icons for aging and urgency indicators
import { Clock, TrendingDown, AlertTriangle } from 'lucide-react';

/*
 * TYPESCRIPT INTERFACE DEFINITIONS
 * ================================
 * 
 * Define interfaces for AR bucket data structure and component props
 * to ensure type safety and clear data modeling.
 */

/*
 * AR Bucket data structure
 * Represents one aging bucket with amount, count, and visual styling
 */
interface ARBucket {
  ageRange: string;       // Age range label (e.g., "0-30", "31-60")
  amount: number;         // Total dollar amount in this bucket
  claimCount: number;     // Number of claims in this bucket
  color: {                // Color scheme for urgency indication
    bg: string;           // Background color class
    border: string;       // Border color class
    text: string;         // Text color class
  };
}

/*
 * Component props interface
 */
interface ARBucketsWidgetProps {
  selectedLocationId: string;  // Location filter for AR analysis
}

/*
 * MAIN AR BUCKETS WIDGET COMPONENT
 * ================================
 * 
 * This component fetches and displays accounts receivable aging analysis
 * with color-coded urgency indicators and summary statistics.
 * 
 * COMPONENT RESPONSIBILITIES:
 * 1. Fetch AR aging data from API
 * 2. Display four aging buckets with amounts and claim counts
 * 3. Apply color coding based on aging urgency
 * 4. Show summary statistics (total AR, current vs aged)
 * 5. Provide visual progress bars for relative bucket sizes
 * 6. Handle loading states and error conditions
 * 
 * BUSINESS INSIGHTS PROVIDED:
 * - Total outstanding AR amount
 * - Distribution across aging buckets
 * - Percentage of current (0-60 days) vs aged (60+ days) claims
 * - Visual indicators of collection urgency
 * - Claim count analysis by age range
 * 
 * @param {ARBucketsWidgetProps} props - Component properties
 */
export default function ARBucketsWidget({ selectedLocationId }: ARBucketsWidgetProps) {
  
  /**
   * Fetch AR buckets data from the API
   * This data shows aging of outstanding insurance claims by location
   */
  const { data: arData, isLoading, error } = useQuery({
    queryKey: ['/api/analytics/ar-buckets', selectedLocationId],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes - AR data changes frequently
  });

  /**
   * Format currency values for display
   * @param {number} amount - Amount in dollars
   * @returns {string} Formatted currency string
   */
  const formatCurrency = (amount: number): string => {
    // Handle NaN, undefined, or null values
    if (!amount || isNaN(amount) || !isFinite(amount)) {
      return '$0';
    }
    
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
  const maxAmount = Math.max(...(arData?.buckets?.map((b: ARBucket) => b.amount || 0) || [0]));

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