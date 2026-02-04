import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, TrendingUp, Minus, Loader2 } from "lucide-react";
import { useState } from "react";
import { getCashFlowDataForLocation } from "@/lib/staticData";
import { getDynamicLabel } from "@/lib/utils";

interface CashOutWidgetProps {
  selectedLocationId: string;
  selectedPeriod: string;
  title?: string;
  subheadingOverrides?: Record<string, string>;
}

// Define the cash flow API response interface
interface CashFlowItem {
  name: string;
  amount: number;
  change: number;
  trend: string;
}

interface CashFlowApiResponse {
  operating: CashFlowItem[];
  investing: CashFlowItem[];
  financing: CashFlowItem[];
  operatingCashFlow: number;
  investingCashFlow: number;
  financingCashFlow: number;
  netCashFlow: number;
  period: string;
  totals: {
    operating: number;
    investing: number;
    financing: number;
    netCashFlow: number;
  };
}

const timePeriods = [
  { id: "1M", label: "1 Month", active: false },
  { id: "3M", label: "3 Months", active: false },
  { id: "6M", label: "6 Months", active: true },
  { id: "1Y", label: "1 Year", active: false },
  { id: "custom", label: "Custom", active: false }
];

export default function CashOutWidget({ 
  selectedLocationId, 
  selectedPeriod,
  title = "Cash Out",
  subheadingOverrides = {}
}: CashOutWidgetProps) {
  // Get cash flow data from static data
  const cashFlowData = getCashFlowDataForLocation(selectedLocationId, selectedPeriod);

  // Filter operating activities for negative cash flows (Cash Out), excluding summary items, and convert to positive amounts for display
  // Apply subheading overrides: key by default name (item.name); empty override falls back to default. Amounts unchanged.
  const cashOutCategories = cashFlowData?.operating
    .filter(item => 
      item.amount < 0 && 
      !item.name.includes('Net Cash') && 
      !item.name.includes('Total')
    )
    .map(item => ({
      ...item,
      name: getDynamicLabel(item.name, item.name, subheadingOverrides),
      amount: Math.abs(item.amount) // Convert to positive for display
    })) || [];
  
  // Calculate total cash out
  const totalCashOut = cashOutCategories.reduce((sum, category) => sum + category.amount, 0);
  
  // Calculate weighted average change
  const weightedChange = totalCashOut > 0 
    ? cashOutCategories.reduce((sum, category) => {
        return sum + (category.change * category.amount);
      }, 0) / totalCashOut
    : 0;

  const getTrendIcon = (trend: string, change: number) => {
    if (trend === "up") return <TrendingUp className="h-3 w-3" />;
    if (trend === "down") return <TrendingDown className="h-3 w-3" />;
    return <Minus className="h-3 w-3" />;
  };

  const getTrendColor = (trend: string) => {
    // For cash out, up is bad (red) and down is good (green)
    if (trend === "up") return "text-red-600 bg-red-50";
    if (trend === "down") return "text-green-600 bg-green-50";
    return "text-gray-600 bg-gray-50";
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };


  return (
    <Card className="bg-white shadow-sm border border-gray-200" data-testid="cash-out-widget">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold text-gray-900 flex items-center justify-between">
          {title}
          {/* Total Cash Out with Overall Trend */}
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-red-600">{formatCurrency(totalCashOut)}</span>
            <Badge 
              variant="secondary" 
              className={`${getTrendColor(weightedChange > 0 ? "up" : weightedChange < 0 ? "down" : "neutral")} border-0`}
              data-testid="cash-out-total-change"
            >
              {getTrendIcon(weightedChange > 0 ? "up" : weightedChange < 0 ? "down" : "neutral", weightedChange)}
              {isNaN(weightedChange) ? '0.0' : Math.abs(weightedChange).toFixed(1)}%
            </Badge>
          </div>
        </CardTitle>

      </CardHeader>

      <CardContent>
        {/* Scrollable Cash Out Categories List */}
        <div 
          className="space-y-3 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-red-200 scrollbar-track-gray-100"
          data-testid="cash-out-categories-list"
        >
          {cashOutCategories.map((category, index) => (
            <div
              key={`cash-out-${index}`}
              className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-red-200 hover:bg-red-50/30 transition-all duration-200"
              data-testid={`cash-out-category-${category.name.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 text-sm">{category.name}</h4>
                <p className="text-red-600 font-semibold text-lg">{formatCurrency(category.amount)}</p>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge 
                  variant="secondary"
                  className={`${getTrendColor(category.trend)} border-0 text-xs`}
                  data-testid={`cash-out-trend-${category.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {getTrendIcon(category.trend, category.change)}
                  {isNaN(category.change) ? '0.0' : Math.abs(category.change).toFixed(1)}%
                </Badge>
              </div>
            </div>
          ))}
        </div>

        {/* Period Label */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500 text-center" data-testid="cash-out-period-label">
            Showing cash outflows for {selectedPeriod === '1M' ? '1 month' : selectedPeriod === '3M' ? '3 months' : selectedPeriod === '6M' ? '6 months' : '1 year'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}