/*
 * INSURANCE CLAIMS TRACKER COMPONENT
 * ==================================
 * 
 * This component provides comprehensive tracking and analysis of insurance claims
 * throughout their lifecycle, from submission to final payment or denial. It's
 * essential for medical practice revenue cycle management.
 * 
 * MEDICAL BILLING CONTEXT:
 * Insurance claims follow a predictable workflow:
 * 1. Submitted: Claims sent to insurance for processing
 * 2. Pending: Claims under review (may need additional information)
 * 3. Paid: Claims approved and payment received
 * 4. Denied: Claims rejected (may require appeal or patient billing)
 * 
 * BUSINESS VALUE FOR PRACTICES:
 * Tracking claims by status helps practices:
 * - Identify bottlenecks in the revenue cycle
 * - Monitor payer performance and reliability
 * - Manage cash flow expectations
 * - Prioritize follow-up efforts on pending claims
 * - Track denial rates by insurance provider
 * - Optimize billing processes for faster payment
 * 
 * REVENUE CYCLE MANAGEMENT:
 * This component supports key RCM activities:
 * - Claims aging analysis
 * - Payer performance monitoring
 * - Denial management workflows
 * - Cash flow forecasting
 * - AR (Accounts Receivable) optimization
 * 
 * COMPONENT FEATURES:
 * - Four-bucket organization matches industry standards
 * - Provider-level breakdown within each status
 * - Date filtering for trend analysis
 * - Real-time claim counts and dollar amounts
 * - Professional medical billing interface
 */

// React hooks for state management
import { useState } from "react";
// Shadcn UI components for consistent design
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
// Mock data generator for insurance claims
import { generateInsuranceClaimsBreakdown } from "@/lib/mockData";
// Lucide React icons for claims management interface
import { 
  Clock,         // Pending/timing indicators
  Send,          // Submitted claims
  XCircle,       // Denied claims
  FileText,      // General claims/documents
  TrendingUp,    // Performance trends
  AlertTriangle, // Attention/warning indicators
  CheckCircle2,  // Approved/paid claims
  DollarSign     // Financial amounts
} from "lucide-react";
// TypeScript interface for claims data
import type { ClaimsBreakdown } from "../../../shared/schema";

/*
 * TYPESCRIPT INTERFACE DEFINITION
 * ===============================
 * 
 * Define the component props interface for type safety and documentation.
 * This component needs location context for filtering claims data.
 */
interface InsuranceClaimsTrackerProps {
  selectedLocationId: string;  // Location filter for claims analysis
  selectedTimePeriod: string;  // Time period filter for data
}

/*
 * MAIN INSURANCE CLAIMS TRACKER COMPONENT
 * =======================================
 * 
 * This component fetches and displays insurance claims data organized by status
 * with detailed breakdown by insurance provider and time-based filtering.
 * 
 * COMPONENT RESPONSIBILITIES:
 * 1. Fetch claims data from API with location and date filtering
 * 2. Organize claims into four status buckets
 * 3. Show provider breakdown within each status
 * 4. Display claim counts and dollar amounts
 * 5. Provide date range filtering functionality
 * 6. Handle loading states and error conditions
 * 
 * CLAIMS WORKFLOW VISUALIZATION:
 * The four-bucket display helps users understand claim progression:
 * - Submitted: Total claims sent to insurers
 * - Pending: Claims awaiting approval/denial decision
 * - Paid: Claims successfully processed and paid
 * - Denied: Claims rejected (may require appeal)
 * 
 * @param {InsuranceClaimsTrackerProps} props - Component properties
 */
export default function InsuranceClaimsTracker({ selectedLocationId, selectedTimePeriod }: InsuranceClaimsTrackerProps) {

  // State for local date filtering - Initialize with "last-month" preset
  const [localDateFilter, setLocalDateFilter] = useState("last-month");

  /**
   * Convert local date filter to time period format
   */
  const getTimePeriodFromLocalFilter = (filter: string): string => {
    switch (filter) {
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
   * Get insurance claims data from mock data
   * Uses local date filter if set, otherwise uses global time period
   */
  const effectiveTimePeriod = getTimePeriodFromLocalFilter(localDateFilter);
  const claimsData = generateInsuranceClaimsBreakdown(selectedLocationId, effectiveTimePeriod);


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

        {/* Local Date Filter - Claims specific filtering */}
        <div className="mb-6">
          <div className="flex items-center flex-wrap gap-2">
            <span className="text-sm font-medium text-gray-700">Claims Period:</span>
            {[
              { key: 'last-month', label: 'Last Month' },
              { key: 'last-3-months', label: 'Last 3 Months' },
              { key: 'last-6-months', label: 'Last 6 Months' },
              { key: 'last-year', label: 'Last Year' }
            ].map((period) => (
              <button
                key={period.key}
                onClick={() => setLocalDateFilter(period.key)}
                className={`px-3 py-1 text-sm rounded-md border transition-colors ${
                  localDateFilter === period.key
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Showing claims data for {localDateFilter.replace('-', ' ')} period
          </p>
        </div>

        {/* Claims Buckets Grid - Updated to 4 columns for 4 status buckets */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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