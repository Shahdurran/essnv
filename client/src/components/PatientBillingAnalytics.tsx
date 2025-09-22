/*
 * PATIENT BILLING ANALYTICS COMPONENT
 * ===================================
 * 
 * This component focuses specifically on patient payment analytics - the portion
 * of practice revenue that comes directly from patients rather than insurance.
 * This includes copays, deductibles, cosmetic procedures, and other out-of-pocket expenses.
 * 
 * PATIENT BILLING CONTEXT:
 * In medical practices, revenue typically comes from two sources:
 * 1. Insurance payments (usually 70-80% of total revenue)
 * 2. Patient payments (usually 20-30% of total revenue)
 * 
 * Patient payments include:
 * - Copays collected at time of service
 * - Deductible amounts patients owe
 * - Cosmetic procedures (usually not covered by insurance)
 * - Self-pay patients without insurance
 * - Patient portions after insurance processing
 * 
 * REVENUE CYCLE CHALLENGES:
 * Patient collections are often more challenging than insurance collections because:
 * - Patients may delay payment due to financial constraints
 * - Collections require more personal communication
 * - Bad debt rates are typically higher for patient accounts
 * - Payment plans and financial hardship considerations
 * 
 * BUSINESS ANALYTICS VALUE:
 * Tracking patient billing performance helps practices:
 * - Monitor collection efficiency for patient accounts
 * - Identify trends in patient payment behavior
 * - Plan cash flow from patient revenue streams
 * - Optimize patient financial counseling processes
 * - Reduce bad debt through early intervention
 * 
 * COMPONENT DESIGN:
 * - Clean, simplified metrics display
 * - Focus on key performance indicators
 * - Professional healthcare financial interface
 * - Time-based filtering for trend analysis
 */

// React hooks for state management
import { useState } from "react";
// TanStack Query for server state management
import { useQuery } from "@tanstack/react-query";
// Lucide React icons for financial and analytics interface
import { DollarSign, TrendingUp, TrendingDown, Clock, AlertCircle } from "lucide-react";

/*
 * TYPESCRIPT INTERFACE DEFINITIONS
 * ================================
 * 
 * Define interfaces for component props and data structures to ensure type safety
 * and provide clear documentation of the expected data format.
 */

/*
 * Component props interface
 */
interface PatientBillingAnalyticsProps {
  selectedLocationId: string;  // Location filter for patient billing data
}

/*
 * Patient billing data structure
 * This simplified structure focuses on the essential metrics for patient revenue analysis
 */
interface PatientBillingData {
  totalRevenue: number;      // Total amount billed to patients (paid + outstanding)
  totalPaid: number;         // Portion successfully collected from patients
  totalOutstanding: number;  // Portion that remains unpaid by patients
}

/*
 * MAIN PATIENT BILLING ANALYTICS COMPONENT
 * ========================================
 * 
 * This component provides focused analytics on patient payment performance,
 * displaying key metrics that help practices understand their patient revenue cycle.
 * 
 * COMPONENT RESPONSIBILITIES:
 * 1. Fetch patient billing data from API
 * 2. Display total revenue, paid amounts, and outstanding balances
 * 3. Calculate collection rates for patient accounts
 * 4. Provide time range filtering for trend analysis
 * 5. Show clean, scannable metrics layout
 * 6. Handle loading states and error conditions
 * 
 * METRICS FOCUS:
 * This component emphasizes simplicity and clarity with three core metrics:
 * - Total Revenue: How much was billed to patients
 * - Total Paid: How much has been collected
 * - Total Outstanding: How much remains uncollected
 * 
 * BUSINESS LOGIC:
 * Total Revenue = Total Paid + Total Outstanding
 * Collection Rate = (Total Paid / Total Revenue) × 100
 * 
 * @param {PatientBillingAnalyticsProps} props - Component properties
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
      <div className="bg-white rounded-lg border border-gray-200 p-6 h-full">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 rounded w-1/3 mb-6 mx-auto"></div>
          <div className="space-y-4">
            <div className="h-24 bg-gray-300 rounded"></div>
            <div className="h-24 bg-gray-300 rounded"></div>
            <div className="h-24 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 h-full flex items-center justify-center">
        <div className="flex items-center text-red-600">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span>Unable to load patient billing data</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 h-full flex flex-col">
      {/* Header Section */}
      <div className="mb-6">
        <div className="mb-4 text-center">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center justify-center">
            <DollarSign className="w-5 h-5 mr-2 text-green-600" />
            Patient Billing Analytics
          </h2>
          <p className="text-sm text-gray-600 mt-2">
            Out-of-pocket payment performance and overdue balance tracking
          </p>
        </div>

        {/* Time Range Filter - Mobile Responsive */}
        <div className="flex flex-col space-y-2 items-center sm:flex-row sm:justify-center sm:space-y-0 sm:gap-2">
          <span className="text-sm font-medium text-gray-700 flex-shrink-0">Time Range:</span>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-2">
            {['1', '3', '6', '12'].map((months) => (
              <button
                key={months}
                onClick={() => setTimeRange(months)}
                className={`px-2 py-1 text-xs sm:px-3 sm:py-1 sm:text-sm rounded border transition-colors ${
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
      </div>

      {/* Simplified Metrics - Vertical Layout */}
      <div className="flex-1 flex flex-col justify-center space-y-4">
        
        {/* Total Revenue from Patient Payments */}
        <div className="bg-green-50 rounded-lg p-4 sm:p-5 border border-green-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700">Total Revenue</h3>
            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
          </div>
          <div className="space-y-2">
            <p className="text-xl sm:text-2xl font-bold text-gray-900">
              {formatCurrency(billingData?.totalRevenue || 0)}
            </p>
            <p className="text-xs sm:text-sm text-gray-600">Total amount billed to patients</p>
          </div>
        </div>

        {/* Total Paid */}
        <div className="bg-blue-50 rounded-lg p-4 sm:p-5 border border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700">Total Paid</h3>
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
          </div>
          <div className="space-y-2">
            <p className="text-xl sm:text-2xl font-bold text-gray-900">
              {formatCurrency(billingData?.totalPaid || 0)}
            </p>
            <p className="text-xs sm:text-sm text-gray-600">
              Collection rate: {getCollectionRate().toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Total Outstanding */}
        <div className="bg-orange-50 rounded-lg p-4 sm:p-5 border border-orange-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700">Total Outstanding</h3>
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 flex-shrink-0" />
          </div>
          <div className="space-y-2">
            <p className="text-xl sm:text-2xl font-bold text-gray-900">
              {formatCurrency(billingData?.totalOutstanding || 0)}
            </p>
            <p className="text-xs sm:text-sm text-gray-600">Unpaid patient balances</p>
          </div>
        </div>

      </div>
    </div>
  );
}