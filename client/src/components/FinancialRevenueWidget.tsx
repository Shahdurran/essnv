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
export default function FinancialRevenueWidget({ selectedLocationId, selectedPeriod }: FinancialRevenueWidgetProps) {

  /*
   * OPHTHALMOLOGY REVENUE CATEGORIES
   * ================================
   * Based on P&L file structure - simulated realistic financial data
   */
  const revenueCategories: RevenueCategory[] = [
    {
      id: 'office-visits',
      name: 'Office Visits',
      amount: 1200000,
      previousAmount: 1050000,
      percentage: 28.5,
      trend: 'up'
    },
    {
      id: 'cataract-surgeries',
      name: 'Cataract Surgeries',
      amount: 980000,
      previousAmount: 850000,
      percentage: 23.3,
      trend: 'up'
    },
    {
      id: 'intravitreal-injections',
      name: 'Intravitreal Injections',
      amount: 720000,
      previousAmount: 680000,
      percentage: 17.1,
      trend: 'up'
    },
    {
      id: 'refractive-cash',
      name: 'Refractive Cash',
      amount: 560000,
      previousAmount: 520000,
      percentage: 13.3,
      trend: 'up'
    },
    {
      id: 'diagnostics-procedures',
      name: 'Diagnostics & Minor Procedures',
      amount: 380000,
      previousAmount: 390000,
      percentage: 9.0,
      trend: 'down'
    },
    {
      id: 'corneal-procedures',
      name: 'Corneal Procedures',
      amount: 180000,
      previousAmount: 165000,
      percentage: 4.3,
      trend: 'up'
    },
    {
      id: 'oculoplastics',
      name: 'Oculoplastics',
      amount: 120000,
      previousAmount: 115000,
      percentage: 2.9,
      trend: 'up'
    },
    {
      id: 'optical-sales',
      name: 'Optical / Contact Lens Sales',
      amount: 80000,
      previousAmount: 75000,
      percentage: 1.9,
      trend: 'up'
    }
  ];

  /*
   * CALCULATE TOTAL REVENUE
   * =======================
   */
  const totalRevenue = revenueCategories.reduce((sum, category) => sum + category.amount, 0);
  const totalPreviousRevenue = revenueCategories.reduce((sum, category) => sum + category.previousAmount, 0);
  const overallGrowth = ((totalRevenue - totalPreviousRevenue) / totalPreviousRevenue) * 100;

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
    <Card className="bg-white shadow-sm border border-gray-200" data-testid="financial-revenue-widget">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold text-gray-900 flex items-center justify-between">
          Revenue
          {/* Total Revenue with Overall Trend */}
          <div className="flex items-center gap-2">
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
        </CardTitle>

      </CardHeader>

      <CardContent>

        {/* Scrollable Revenue Categories List */}
        <div 
          className="space-y-3 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-green-200 scrollbar-track-gray-100"
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
      </CardContent>
    </Card>
  );
}