import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { useState } from "react";

interface CashInWidgetProps {
  selectedLocationId: string;
  selectedPeriod: string;
}

// Cash inflow categories specific to ophthalmology practice
const cashInCategories = [
  {
    id: "patient-payments",
    name: "Patient Payments",
    amount: 95000,
    change: 8.3,
    trend: "up"
  },
  {
    id: "insurance-reimbursements",
    name: "Insurance Reimbursements",
    amount: 185000,
    change: 4.7,
    trend: "up"
  },
  {
    id: "procedure-payments",
    name: "Procedure Payments",
    amount: 145000,
    change: 12.1,
    trend: "up"
  },
  {
    id: "optical-sales",
    name: "Optical & Contact Lens Sales",
    amount: 28000,
    change: -2.4,
    trend: "down"
  },
  {
    id: "cash-procedures",
    name: "Cash-Pay Procedures",
    amount: 55000,
    change: 15.6,
    trend: "up"
  },
  {
    id: "refunds-adjustments",
    name: "Refunds & Adjustments",
    amount: -8200,
    change: -5.1,
    trend: "down"
  }
];

const timePeriods = [
  { id: "1M", label: "1 Month", active: false },
  { id: "3M", label: "3 Months", active: false },
  { id: "6M", label: "6 Months", active: true },
  { id: "1Y", label: "1 Year", active: false },
  { id: "custom", label: "Custom", active: false }
];

export default function CashInWidget({ selectedLocationId, selectedPeriod }: CashInWidgetProps) {

  // Calculate total cash in (excluding negative adjustments for net calculation)
  const totalCashIn = cashInCategories
    .filter(category => category.amount > 0)
    .reduce((sum, category) => sum + category.amount, 0);
  
  // Calculate net cash in (including negative adjustments)
  const netCashIn = cashInCategories.reduce((sum, category) => sum + category.amount, 0);
  
  // Calculate weighted average change for positive cash flows
  const positiveCashFlows = cashInCategories.filter(category => category.amount > 0);
  const weightedChange = positiveCashFlows.reduce((sum, category) => {
    return sum + (category.change * category.amount);
  }, 0) / totalCashIn;

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

  return (
    <Card className="bg-white shadow-sm border border-gray-200" data-testid="cash-in-widget">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center justify-between">
          Cash In
          {/* Total Cash In with Overall Trend */}
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-green-600">{formatCurrency(netCashIn)}</span>
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
          {cashInCategories.map((category) => (
            <div
              key={category.id}
              className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-green-200 hover:bg-green-50/30 transition-all duration-200"
              data-testid={`cash-in-category-${category.id}`}
            >
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 text-sm">{category.name}</h4>
                <p className={`font-semibold text-lg ${category.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {category.amount >= 0 ? '' : '-'}{formatCurrency(category.amount)}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge 
                  variant="secondary"
                  className={`${getTrendColor(category.trend)} border-0 text-xs`}
                  data-testid={`cash-in-trend-${category.id}`}
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
            Showing cash inflows for {timePeriods.find(p => p.id === selectedPeriod)?.label.toLowerCase()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}