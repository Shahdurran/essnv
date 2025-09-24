/*
 * PRACTICE INSIGHTS COMPONENT
 * ===========================
 * 
 * This component displays comprehensive key performance indicators (KPIs) and insurance
 * analytics that give practice managers essential insights into their business health
 * and operational efficiency.
 * 
 * KEY PERFORMANCE INDICATORS (KPIS):
 * Medical practices track specific metrics that indicate business health:
 * - Patient Volume: How many patients are being seen (capacity utilization)
 * - Monthly Revenue: Total income generated from all services
 * - Average Revenue Per Patient: Efficiency of patient encounters
 * - Days in AR (Accounts Receivable): How quickly insurance pays claims
 * - Collection Rate: Percentage of billed amounts actually collected
 * 
 * INSURANCE ANALYTICS VALUE:
 * Understanding insurance payer performance helps practices:
 * - Identify which insurers pay promptly vs slowly
 * - Negotiate better contracts with poor-performing payers
 * - Adjust patient mix to optimize revenue
 * - Plan cash flow based on payment patterns
 * - Spot trends in denial rates by payer
 * 
 * MEDICAL PRACTICE CONTEXT:
 * These metrics are specifically relevant to medical practices because:
 * - Insurance reimbursement is often 60-80% of total revenue
 * - AR days directly impact cash flow and operations
 * - Patient volume affects both revenue and operational costs
 * - Payer mix influences profitability and risk
 * 
 * COMPONENT ARCHITECTURE:
 * - Dual data fetching (key metrics + insurance breakdown)
 * - Grid layout for easy metric comparison
 * - Color-coded indicators for performance trending
 * - Professional medical dashboard styling
 */

// React hooks for state management
import { useState } from "react";
// Shadcn UI components for consistent design
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
// Mock data for practice insights
import { generateKeyMetrics, insurancePayerBreakdown } from "@/lib/mockData";
// Lucide React icons for medical and business metrics
import { 
  Users,        // Patient volume metrics
  DollarSign,   // Revenue and financial metrics
  Clock,        // Time-based metrics (AR days)
  Percent,      // Percentage-based metrics (collection rates)
  TrendingUp,   // Positive trend indicators
  TrendingDown, // Negative trend indicators
  Shield,       // Insurance/protection related
  Heart,        // Patient care quality
  UserCheck,    // Patient satisfaction
  Flag          // Important alerts/indicators
} from "lucide-react";
// TypeScript interfaces for analytics data
import type { KeyMetrics, InsurancePayerData } from "../../../shared/schema";

/*
 * TYPESCRIPT INTERFACE DEFINITION
 * ===============================
 * 
 * Define the component props interface for type safety and documentation.
 * This component needs location context for filtering analytics data.
 */
interface PracticeInsightsProps {
  selectedLocationId: string;  // Location filter for metrics and insurance data
  selectedTimePeriod: string;  // Time period filter for data
}

/*
 * MAIN PRACTICE INSIGHTS COMPONENT
 * ================================
 * 
 * This component fetches and displays key performance indicators and insurance
 * analytics to provide comprehensive practice management insights.
 * 
 * COMPONENT RESPONSIBILITIES:
 * 1. Fetch key performance metrics from API
 * 2. Fetch insurance payer breakdown data from API
 * 3. Display metrics in an organized, scannable format
 * 4. Show trend indicators for performance tracking
 * 5. Provide insurance payer analysis with AR days
 * 6. Handle loading states and error conditions
 * 
 * BUSINESS VALUE PROVIDED:
 * - At-a-glance view of practice health
 * - Quick identification of performance trends
 * - Insurance payer performance comparison
 * - Data-driven insights for operational decisions
 * - Early warning indicators for potential issues
 * 
 * @param {PracticeInsightsProps} props - Component properties
 */
export default function PracticeInsights({ selectedLocationId, selectedTimePeriod }: PracticeInsightsProps) {


  /**
   * Get key performance metrics from mock data
   */
  const keyMetrics = generateKeyMetrics(selectedLocationId, selectedTimePeriod);

  /**
   * Get insurance payer breakdown from mock data
   */
  const insuranceData = insurancePayerBreakdown;

  /**
   * Format large numbers for display
   * @param {number} value - The numeric value to format
   * @returns {string} Formatted number string
   */
  const formatNumber = (value: number): string => {
    // Handle NaN, undefined, or null values
    if (!value || isNaN(value) || !isFinite(value)) {
      return '0';
    }
    
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toLocaleString();
  };

  /**
   * Format currency values for display
   * @param {number} value - The currency value
   * @returns {string} Formatted currency string
   */
  const formatCurrency = (value: number): string => {
    // Handle NaN, undefined, or null values
    if (!value || isNaN(value) || !isFinite(value)) {
      return '$0';
    }
    
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toLocaleString()}`;
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


  return (
    <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
      <CardContent className="p-6">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Practice Insights</h3>
        </div>

        
        {/* Key Metrics Grid - Mobile Responsive */}
        <div className="grid grid-cols-1 gap-3 mb-6 sm:grid-cols-2 sm:gap-4">
          
          {/* Monthly Patients */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 sm:p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
              {getGrowthIndicator(keyMetrics.patientGrowth)}
            </div>
            <p className="text-xl sm:text-2xl font-bold text-blue-700">
              {formatNumber(keyMetrics.monthlyPatients)}
            </p>
            <p className="text-xs sm:text-sm text-blue-600">
              Monthly Patients
            </p>
          </div>
          
          {/* Monthly Revenue */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 sm:p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
              {getGrowthIndicator(keyMetrics.revenueGrowth)}
            </div>
            <p className="text-xl sm:text-2xl font-bold text-green-700">
              {formatCurrency(keyMetrics.monthlyRevenue)}
            </p>
            <p className="text-xs sm:text-sm text-green-600">
              Monthly Revenue
            </p>
          </div>
          
          {/* Average AR Days */}
          <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-3 sm:p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-teal-600 flex-shrink-0" />
              <Badge variant="secondary" className="text-xs text-red-600 bg-red-50">
                -2.1 days
              </Badge>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-teal-700">
              {keyMetrics.arDays || '28.4'}
            </p>
            <p className="text-xs sm:text-sm text-teal-600">Avg AR Days</p>
          </div>
          
          {/* Clean Claims Rate */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 sm:p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <Percent className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 flex-shrink-0" />
              <Badge variant="secondary" className="text-xs text-green-600 bg-green-50">
                +3.2%
              </Badge>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-purple-700">
              {keyMetrics.cleanClaimRate || '94.2'}%
            </p>
            <p className="text-xs sm:text-sm text-purple-600">Clean Claims</p>
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
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                        <IconComponent className="h-3 w-3 sm:h-4 sm:w-4" />
                      </div>
                      <span className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                        {payer.name}
                      </span>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs sm:text-sm font-semibold text-gray-900">
                        {(payer.percentage && !isNaN(payer.percentage)) ? payer.percentage.toFixed(1) : '0.0'}%
                      </p>
                      <p className="text-xs text-gray-600">
                        {(payer.arDays && !isNaN(payer.arDays)) ? payer.arDays.toFixed(1) : '0.0'} days
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
