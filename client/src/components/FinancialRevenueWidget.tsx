/*
 * FINANCIAL REVENUE WIDGET COMPONENT
 * ==================================
 * 
 * This component displays revenue analytics for ophthalmology practice financial analysis.
 * It provides detailed breakdown of revenue streams with time-based filtering capabilities.
 * 
 * BUSINESS PURPOSE:
 * Financial revenue tracking helps practice owners:
 * - Monitor revenue performance across different service lines
 * - Identify seasonal trends and growth opportunities
 * - Track month-over-month and year-over-year changes
 * - Make data-driven decisions about service offerings
 * - Plan budgets and financial forecasts
 * 
 * DESIGN FEATURES:
 * - Green theme for positive revenue visualization
 * - Time period filtering (1M, 3M, 6M, 1Y, Custom)
 * - Scrollable revenue categories list
 * - Responsive design for all screen sizes
 * - Revenue trending indicators
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Filter
} from "lucide-react";
import { getFinancialRevenueFromPL } from "@/lib/staticData";
import { getDynamicLabel } from "@/lib/utils";

/*
 * REVENUE CATEGORY DATA INTERFACE
 * ===============================
 */
interface RevenueCategory {
  id: string;
  name: string;
  amount: number;
  previousAmount: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
}

/*
 * COMPONENT PROPS INTERFACE
 * =========================
 */
interface FinancialRevenueWidgetProps {
  selectedLocationId: string;
  selectedPeriod: string;
  title?: string;
  subheadingOverrides?: Record<string, string>;
}

/*
 * TIME PERIOD OPTIONS
 * ===================
 */
const TIME_PERIODS = [
  { value: '1M', label: '1 Month' },
  { value: '3M', label: '3 Months' },
  { value: '6M', label: '6 Months' },
  { value: '1Y', label: '1 Year' },
  { value: 'custom', label: 'Custom' }
];

/*
 * MAIN FINANCIAL REVENUE WIDGET COMPONENT
 * ========================================
 */
export default function FinancialRevenueWidget({ 
  selectedLocationId, 
  selectedPeriod,
  title = "Revenue",
  subheadingOverrides = {}
}: FinancialRevenueWidgetProps) {

  // Get revenue data from static data
  const revenueData = getFinancialRevenueFromPL(selectedLocationId, selectedPeriod);

  // Convert static data to expected format with calculated percentages
  // Apply subheading overrides: key by default name (cat.name) then id; fallback to default name. Amounts unchanged.
  const revenueCategories: RevenueCategory[] = revenueData.categories.map(cat => {
    const totalRevenue = revenueData.total;
    const percentage = totalRevenue > 0 ? (cat.amount / totalRevenue) * 100 : 0;
    const previousAmount = cat.amount / (1 + (cat.change / 100)); // Reverse calculate previous amount
    const displayName = getDynamicLabel(cat.name, cat.name, subheadingOverrides);
    
    return {
      id: cat.id,
      name: displayName,
      amount: cat.amount,
      previousAmount: Math.round(previousAmount),
      percentage: percentage,
      trend: cat.trend === 'up' ? 'up' : cat.trend === 'down' ? 'down' : 'stable'
    };
  });

  /*
   * CALCULATE TOTAL REVENUE FROM STATIC DATA
   * ========================================
   */
  const totalRevenue = revenueData.total;
  const totalPreviousRevenue = revenueCategories.reduce((sum, category) => sum + category.previousAmount, 0);
  const overallGrowth = totalPreviousRevenue > 0 ? ((totalRevenue - totalPreviousRevenue) / totalPreviousRevenue) * 100 : 0;

  /*
   * FORMAT CURRENCY VALUES
   * ======================
   */
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  /*
   * FORMAT GROWTH PERCENTAGE
   * ========================
   */
  const formatGrowth = (current: number, previous: number): string => {
    // Handle NaN, undefined, or division by zero
    if (!current || !previous || isNaN(current) || isNaN(previous) || previous === 0) {
      return '+0.0%';
    }
    
    const growth = ((current - previous) / previous) * 100;
    const sign = growth > 0 ? '+' : '';
    return `${sign}${growth.toFixed(1)}%`;
  };

  /*
   * GET TREND ICON
   * ==============
   */
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-3 w-3 text-red-500" />;
      default:
        return <div className="h-3 w-3 bg-gray-300 rounded-full" />;
    }
  };

  return (
    <Card className="bg-white shadow-sm border border-gray-200 flex flex-col h-[28rem]" data-testid="financial-revenue-widget">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold text-gray-900">
          {title}
        </CardTitle>
        {/* Total Revenue with Overall Trend */}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</span>
          <Badge 
            variant="secondary" 
            className="text-green-600 bg-green-50 border-0"
            data-testid="revenue-total-change"
          >
            {getTrendIcon('up')}
            {formatGrowth(totalRevenue, totalPreviousRevenue)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col min-h-0">

        {/* Scrollable Revenue Categories List */}
        <div 
          className="space-y-3 flex-1 min-h-0 overflow-y-auto scrollbar-thin scrollbar-thumb-green-200 scrollbar-track-gray-100"
          data-testid="revenue-categories-list"
        >
          {revenueCategories.map((category) => (
            <div
              key={category.id}
              className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-green-200 hover:bg-green-50/30 transition-all duration-200"
              data-testid={`revenue-category-${category.id}`}
            >
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 text-sm">{category.name}</h4>
                <p className="text-green-600 font-semibold text-lg">{formatCurrency(category.amount)}</p>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge 
                  variant="secondary"
                  className="text-green-600 bg-green-50 border-0 text-xs"
                  data-testid={`revenue-trend-${category.id}`}
                >
                  {getTrendIcon(category.trend)}
                  {formatGrowth(category.amount, category.previousAmount)}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        {/* Period Label */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500 text-center" data-testid="revenue-period-label">
            Showing revenue for {TIME_PERIODS.find(p => p.value === selectedPeriod)?.label.toLowerCase()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}