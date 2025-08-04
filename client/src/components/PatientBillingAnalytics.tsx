import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DollarSign, TrendingUp, TrendingDown, Clock, AlertCircle } from "lucide-react";

/**
 * Patient Billing Analytics Widget
 * 
 * Displays patient payment insights and out-of-pocket payment performance
 * Provides overdue balance tracking and collection rate analytics
 * Positioned at bottom of dashboard with full-width layout
 * 
 * Features:
 * - Total outstanding patient balance with trend indicator
 * - Balance aging breakdown (0-30, 31-60, 61-90, 90+ days)
 * - Collection rate percentage with trend
 * - Top 3 overdue accounts with action status
 * - Location-based filtering
 * - Time range filtering (30, 60, 90 days)
 */

interface PatientBillingAnalyticsProps {
  selectedLocationId: string;
}

interface PatientBillingData {
  totalRevenue: number; // Total amount billed to patients (paid + outstanding)
  totalPaid: number; // Portion of billed-to-patients that has been collected
  totalOutstanding: number; // Portion of billed-to-patients that remains unpaid
}

/**
 * Patient Billing Analytics Component
 * Tracks patient payment performance and overdue balances
 * 
 * @param {Object} props - Component properties
 * @param {string} props.selectedLocationId - Currently selected location for filtering
 */
export default function PatientBillingAnalytics({ selectedLocationId }: PatientBillingAnalyticsProps) {

  // State for time range filtering - default to 1 month
  const [timeRange, setTimeRange] = useState("1");

  /**
   * Fetch simplified patient billing data from API
   * Includes total revenue, total paid, and total outstanding
   */
  const { data: billingData, isLoading, error } = useQuery<PatientBillingData>({
    queryKey: ['/api/analytics/patient-billing', selectedLocationId, timeRange],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/patient-billing/${selectedLocationId}?timeRange=${timeRange}`);
      if (!response.ok) {
        throw new Error('Failed to fetch patient billing data');
      }
      return response.json();
    }
  });

  /**
   * Calculate collection rate percentage
   */
  const getCollectionRate = () => {
    if (!billingData) return 0;
    const totalBilled = billingData.totalPaid + billingData.totalOutstanding;
    if (totalBilled === 0) return 0;
    return (billingData.totalPaid / totalBilled) * 100;
  };

  /**
   * Format currency values for display
   */
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  /**
   * Get time range display label
   */
  const getTimeRangeLabel = (range: string) => {
    const labels = {
      '1': '1 Month',
      '3': '3 Months', 
      '6': '6 Months',
      '12': '1 Year'
    };
    return labels[range as keyof typeof labels] || '1 Month';
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="animate-pulse">
          <div className="h-5 bg-gray-300 rounded w-1/3 mb-3"></div>
          <div className="space-y-4">
            <div className="h-20 bg-gray-300 rounded"></div>
            <div className="h-20 bg-gray-300 rounded"></div>
            <div className="h-20 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center text-red-600">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span>Unable to load patient billing data</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      {/* Header Section */}
      <div className="mb-4">
        <div className="mb-3">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <DollarSign className="w-5 h-5 mr-2 text-green-600" />
            Patient Billing Analytics
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Out-of-pocket payment performance and overdue balance tracking
          </p>
        </div>

        {/* Time Range Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Time Range:</span>
          {['1', '3', '6', '12'].map((months) => (
            <button
              key={months}
              onClick={() => setTimeRange(months)}
              className={`px-2 py-1 text-xs rounded border transition-colors ${
                timeRange === months
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {getTimeRangeLabel(months)}
            </button>
          ))}
        </div>
      </div>

      {/* Simplified Metrics - Vertical Layout */}
      <div className="space-y-4">
        
        {/* Total Revenue from Patient Payments */}
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">Total Revenue</h3>
            <DollarSign className="w-4 h-4 text-green-600" />
          </div>
          <div className="space-y-1">
            <p className="text-xl font-bold text-gray-900">
              {formatCurrency(billingData?.totalRevenue || 0)}
            </p>
            <p className="text-xs text-gray-600">Total amount billed to patients</p>
          </div>
        </div>

        {/* Total Paid */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">Total Paid</h3>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="space-y-1">
            <p className="text-xl font-bold text-gray-900">
              {formatCurrency(billingData?.totalPaid || 0)}
            </p>
            <p className="text-xs text-gray-600">
              Collection rate: {getCollectionRate().toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Total Outstanding */}
        <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">Total Outstanding</h3>
            <Clock className="w-4 h-4 text-orange-600" />
          </div>
          <div className="space-y-1">
            <p className="text-xl font-bold text-gray-900">
              {formatCurrency(billingData?.totalOutstanding || 0)}
            </p>
            <p className="text-xs text-gray-600">Unpaid patient balances</p>
          </div>
        </div>

      </div>
    </div>
  );
}