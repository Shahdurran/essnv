import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, TrendingUp, Minus, Loader2 } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

interface CashInWidgetProps {
  selectedLocationId: string;
  selectedPeriod: string;
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

export default function CashInWidget({ selectedLocationId, selectedPeriod }: CashInWidgetProps) {
  // Fetch cash flow data from embedded data service
  const { data: cashFlowData, isLoading, isError } = useQuery<CashFlowApiResponse>({
    queryKey: ['/api/financial/cashflow', selectedLocationId, selectedPeriod],
  });

  // Filter operating activities for positive cash flows (Cash In), excluding summary items
  const cashInCategories = cashFlowData?.operating.filter(item => 
    item.amount > 0 && 
    !item.name.includes('Net Cash') && 
    !item.name.includes('Total')
  ) || [];
  
  // Calculate total cash in
  const totalCashIn = cashInCategories.reduce((sum, category) => sum + category.amount, 0);
  
  // Calculate weighted average change for cash inflows
  const weightedChange = totalCashIn > 0 
    ? cashInCategories.reduce((sum, category) => {
        return sum + (category.change * category.amount);
      }, 0) / totalCashIn
    : 0;

  const getTrendIcon = (trend: string, change: number) => {
    if (trend === "up") return <TrendingUp className="h-3 w-3" />;
    if (trend === "down") return <TrendingDown className="h-3 w-3" />;
    return <Minus className="h-3 w-3" />;
  };

  const getTrendColor = (trend: string) => {
    // For cash in, up is good (green) and down is bad (red)
    if (trend === "up") return "text-green-600 bg-green-50";
    if (trend === "down") return "text-red-600 bg-red-50";
    return "text-gray-600 bg-gray-50";
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.abs(amount));
  };

  // Show loading state
  if (isLoading) {
    return (
      <Card className="bg-white shadow-sm border border-gray-200" data-testid="cash-in-widget">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-bold text-gray-900">Cash In</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2 text-gray-600">Loading cash flow data...</span>
        </CardContent>
      </Card>
    );
  }

  // Show error state
  if (isError || !cashFlowData) {
    return (
      <Card className="bg-white shadow-sm border border-gray-200" data-testid="cash-in-widget">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-bold text-gray-900">Cash In</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <span className="text-gray-600">Unable to load cash flow data</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-sm border border-gray-200" data-testid="cash-in-widget">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold text-gray-900 flex items-center justify-between">
          Cash In
          {/* Total Cash In with Overall Trend */}
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-green-600">{formatCurrency(totalCashIn)}</span>
            <Badge 
              variant="secondary" 
              className={`${getTrendColor(weightedChange > 0 ? "up" : weightedChange < 0 ? "down" : "neutral")} border-0`}
              data-testid="cash-in-total-change"
            >
              {getTrendIcon(weightedChange > 0 ? "up" : weightedChange < 0 ? "down" : "neutral", weightedChange)}
              {Math.abs(weightedChange).toFixed(1)}%
            </Badge>
          </div>
        </CardTitle>

      </CardHeader>

      <CardContent>
        {/* Scrollable Cash In Categories List */}
        <div 
          className="space-y-3 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-green-200 scrollbar-track-gray-100"
          data-testid="cash-in-categories-list"
        >
          {cashInCategories.map((category, index) => (
            <div
              key={`cash-in-${index}`}
              className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-green-200 hover:bg-green-50/30 transition-all duration-200"
              data-testid={`cash-in-category-${category.name.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 text-sm">{category.name}</h4>
                <p className="font-semibold text-lg text-green-600">
                  {formatCurrency(category.amount)}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge 
                  variant="secondary"
                  className={`${getTrendColor(category.trend)} border-0 text-xs`}
                  data-testid={`cash-in-trend-${category.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {getTrendIcon(category.trend, category.change)}
                  {Math.abs(category.change).toFixed(1)}%
                </Badge>
              </div>
            </div>
          ))}
        </div>

        {/* Period Label */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500 text-center" data-testid="cash-in-period-label">
            Showing cash inflows for {selectedPeriod === '1M' ? '1 month' : selectedPeriod === '3M' ? '3 months' : selectedPeriod === '6M' ? '6 months' : '1 year'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}