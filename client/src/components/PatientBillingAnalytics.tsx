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
  totalOutstanding: number;
  totalOutstandingTrend: number; // Percentage change from previous period
  collectionRate: number;
  collectionRateTrend: number;
  agingBreakdown: {
    days0to30: number;
    days31to60: number;
    days61to90: number;
    days90plus: number;
  };
  topOverdueAccounts: {
    patientId: string;
    patientName: string;
    balance: number;
    daysOverdue: number;
    actionStatus: 'Uncontacted' | 'Reminder Sent' | 'Payment Plan' | 'Collection Agency';
  }[];
}

/**
 * Patient Billing Analytics Component
 * Tracks patient payment performance and overdue balances
 * 
 * @param {Object} props - Component properties
 * @param {string} props.selectedLocationId - Currently selected location for filtering
 */
export default function PatientBillingAnalytics({ selectedLocationId }: PatientBillingAnalyticsProps) {

  // State for time range filtering - default to 30 days
  const [timeRange, setTimeRange] = useState("30");

  /**
   * Fetch patient billing data from API
   * Includes outstanding balances, collection rates, and overdue accounts
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
   * Calculate aging breakdown percentages for visualization
   */
  const getAgingPercentages = () => {
    if (!billingData?.agingBreakdown) return { days0to30: 0, days31to60: 0, days61to90: 0, days90plus: 0 };
    
    const total = Object.values(billingData.agingBreakdown).reduce((sum, value) => sum + value, 0);
    if (total === 0) return { days0to30: 0, days31to60: 0, days61to90: 0, days90plus: 0 };
    
    return {
      days0to30: (billingData.agingBreakdown.days0to30 / total) * 100,
      days31to60: (billingData.agingBreakdown.days31to60 / total) * 100,
      days61to90: (billingData.agingBreakdown.days61to90 / total) * 100,
      days90plus: (billingData.agingBreakdown.days90plus / total) * 100
    };
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
   * Format trend indicator with appropriate icon and color
   */
  const formatTrend = (trend: number, isPositiveGood: boolean = true) => {
    const isPositive = trend > 0;
    const isGood = isPositiveGood ? isPositive : !isPositive;
    const color = isGood ? "text-green-600" : "text-red-600";
    const Icon = isPositive ? TrendingUp : TrendingDown;
    
    return (
      <span className={`flex items-center ${color} text-sm ml-2`}>
        <Icon className="w-4 h-4 mr-1" />
        {Math.abs(trend).toFixed(1)}%
      </span>
    );
  };

  /**
   * Get status badge styling based on action status
   */
  const getStatusBadge = (status: string) => {
    const statusStyles = {
      'Uncontacted': 'bg-red-100 text-red-800',
      'Reminder Sent': 'bg-yellow-100 text-yellow-800',
      'Payment Plan': 'bg-blue-100 text-blue-800',
      'Collection Agency': 'bg-purple-100 text-purple-800'
    };
    
    return statusStyles[status as keyof typeof statusStyles] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="h-32 bg-gray-300 rounded"></div>
            <div className="h-32 bg-gray-300 rounded"></div>
            <div className="h-32 bg-gray-300 rounded"></div>
            <div className="h-32 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center text-red-600">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span>Unable to load patient billing data</span>
        </div>
      </div>
    );
  }

  const agingPercentages = getAgingPercentages();

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <DollarSign className="w-6 h-6 mr-2 text-green-600" />
            Patient Billing Analytics
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Out-of-pocket payment performance and overdue balance tracking
          </p>
        </div>

        {/* Time Range Filter */}
        <div className="flex gap-2 mt-4 sm:mt-0">
          <span className="text-sm font-medium text-gray-700 mr-2">Time Range:</span>
          {['30', '60', '90'].map((days) => (
            <button
              key={days}
              onClick={() => setTimeRange(days)}
              className={`px-3 py-1 text-sm rounded-md border transition-colors ${
                timeRange === days
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {days} Days
            </button>
          ))}
        </div>
      </div>

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Total Outstanding Balance */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700">Total Outstanding</h3>
            <Clock className="w-4 h-4 text-gray-500" />
          </div>
          <div className="flex items-center">
            <span className="text-2xl font-bold text-gray-900">
              {formatCurrency(billingData?.totalOutstanding || 0)}
            </span>
            {billingData?.totalOutstandingTrend && formatTrend(billingData.totalOutstandingTrend, false)}
          </div>
        </div>

        {/* Collection Rate */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700">Collection Rate</h3>
            <TrendingUp className="w-4 h-4 text-gray-500" />
          </div>
          <div className="flex items-center">
            <span className="text-2xl font-bold text-gray-900">
              {billingData?.collectionRate?.toFixed(1) || 0}%
            </span>
            {billingData?.collectionRateTrend && formatTrend(billingData.collectionRateTrend, true)}
          </div>
        </div>

        {/* Balance Aging Breakdown */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Balance Aging</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">0-30 days</span>
              <span className="text-xs font-medium">{agingPercentages.days0to30.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${agingPercentages.days0to30}%` }}
              ></div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">31-60 days</span>
              <span className="text-xs font-medium">{agingPercentages.days31to60.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-yellow-500 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${agingPercentages.days31to60}%` }}
              ></div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">61-90 days</span>
              <span className="text-xs font-medium">{agingPercentages.days61to90.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-orange-500 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${agingPercentages.days61to90}%` }}
              ></div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">90+ days</span>
              <span className="text-xs font-medium">{agingPercentages.days90plus.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-red-500 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${agingPercentages.days90plus}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Top 3 Overdue Accounts */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Top Overdue Accounts</h3>
          <div className="space-y-3">
            {billingData?.topOverdueAccounts?.slice(0, 3).map((account, index) => (
              <div key={account.patientId} className="border-l-4 border-red-400 pl-3">
                <div className="flex justify-between items-start">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {account.patientName}
                    </p>
                    <p className="text-xs text-gray-600">
                      {account.daysOverdue} days overdue
                    </p>
                  </div>
                  <div className="text-right ml-2">
                    <p className="text-sm font-bold text-gray-900">
                      {formatCurrency(account.balance)}
                    </p>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(account.actionStatus)}`}>
                      {account.actionStatus}
                    </span>
                  </div>
                </div>
              </div>
            )) || (
              <p className="text-sm text-gray-500 text-center py-4">No overdue accounts</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}