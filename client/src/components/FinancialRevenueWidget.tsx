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
import { Card, CardContent } from "@/components/ui/card";
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
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toLocaleString()}`;
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
    <Card className="bg-white rounded-xl shadow-sm border border-gray-200 h-full">
      <CardContent className="p-6">
        {/* Header with Green Theme */}
        <div className="flex flex-col space-y-4 mb-6 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <span className="truncate">Revenue Analysis</span>
                <p className="text-sm text-gray-600 mt-1">Revenue streams breakdown</p>
              </div>
            </h3>
          </div>
          
        </div>

        {/* Total Revenue Summary */}
        <div className="bg-green-50 rounded-lg p-4 mb-6 border border-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800">Total Revenue</p>
              <p className="text-2xl font-bold text-green-900" data-testid="text-total-revenue">
                {formatCurrency(totalRevenue)}
              </p>
            </div>
            <div className="text-right">
              <Badge 
                variant="secondary"
                className="text-green-700 bg-green-100 border-green-200"
                data-testid="badge-total-growth"
              >
                {formatGrowth(totalRevenue, totalPreviousRevenue)}
              </Badge>
              <p className="text-xs text-green-600 mt-1">{selectedPeriod} period</p>
            </div>
          </div>
        </div>

        {/* Revenue Categories List - Scrollable */}
        <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          <div className="space-y-3 pr-2">
            {revenueCategories.map((category, index) => (
              <div 
                key={category.id} 
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-green-50 transition-colors group"
                data-testid={`row-revenue-${category.id}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-8 bg-green-500 rounded-full"></div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-gray-900 text-sm truncate">
                        {category.name}
                      </h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge 
                          variant="outline" 
                          className="text-xs text-gray-600 border-gray-300"
                        >
                          {category.percentage.toFixed(1)}% of total
                        </Badge>
                        {getTrendIcon(category.trend)}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="text-right ml-4">
                  <p className="font-semibold text-gray-900" data-testid={`text-revenue-${category.id}`}>
                    {formatCurrency(category.amount)}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {formatGrowth(category.amount, category.previousAmount)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Summary */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 flex items-center">
              <Filter className="h-4 w-4 mr-1" />
              {revenueCategories.length} revenue categories
            </span>
            <span className="text-green-600 font-medium">
              Period: {selectedPeriod}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}