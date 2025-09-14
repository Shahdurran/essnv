import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { useState } from "react";

interface CashOutWidgetProps {
  selectedLocationId: string;
}

// Cash outflow categories specific to ophthalmology practice
const cashOutCategories = [
  {
    id: "staff-salaries",
    name: "Staff Salaries & Payroll",
    amount: 125000,
    change: 6.2,
    trend: "up"
  },
  {
    id: "equipment-purchases",
    name: "Medical Equipment Purchases",
    amount: 45000,
    change: -12.8,
    trend: "down"
  },
  {
    id: "rent-utilities",
    name: "Rent & Utilities",
    amount: 42000,
    change: 3.1,
    trend: "up"
  },
  {
    id: "supplier-payments",
    name: "Supplier Payments",
    amount: 38700,
    change: -2.4,
    trend: "down"
  },
  {
    id: "insurance-premiums",
    name: "Insurance Premiums",
    amount: 22100,
    change: 8.9,
    trend: "up"
  },
  {
    id: "loan-payments",
    name: "Loan & Interest Payments",
    amount: 15800,
    change: 0.0,
    trend: "neutral"
  },
  {
    id: "marketing-advertising",
    name: "Marketing & Advertising",
    amount: 12500,
    change: 15.2,
    trend: "up"
  },
  {
    id: "professional-services",
    name: "Professional Services",
    amount: 18900,
    change: -1.6,
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

export default function CashOutWidget({ selectedLocationId }: CashOutWidgetProps) {
  const [selectedPeriod, setSelectedPeriod] = useState("6M");

  // Calculate total cash out
  const totalCashOut = cashOutCategories.reduce((sum, category) => sum + category.amount, 0);
  
  // Calculate weighted average change
  const weightedChange = cashOutCategories.reduce((sum, category) => {
    return sum + (category.change * category.amount);
  }, 0) / totalCashOut;

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
        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center justify-between">
          Cash Out
          {/* Total Cash Out with Overall Trend */}
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-red-600">{formatCurrency(totalCashOut)}</span>
            <Badge 
              variant="secondary" 
              className={`${getTrendColor(weightedChange > 0 ? "up" : weightedChange < 0 ? "down" : "neutral")} border-0`}
              data-testid="cash-out-total-change"
            >
              {getTrendIcon(weightedChange > 0 ? "up" : weightedChange < 0 ? "down" : "neutral", weightedChange)}
              {Math.abs(weightedChange).toFixed(1)}%
            </Badge>
          </div>
        </CardTitle>

        {/* Time Period Filter */}
        <div className="flex flex-wrap gap-2 mt-4" data-testid="cash-out-time-filters">
          {timePeriods.map((period) => (
            <Button
              key={period.id}
              variant={selectedPeriod === period.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedPeriod(period.id)}
              className={
                selectedPeriod === period.id
                  ? "bg-red-600 hover:bg-red-700 text-white border-red-600"
                  : "border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300"
              }
              data-testid={`cash-out-filter-${period.id.toLowerCase()}`}
            >
              {period.label}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        {/* Scrollable Cash Out Categories List */}
        <div 
          className="space-y-3 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-red-200 scrollbar-track-gray-100"
          data-testid="cash-out-categories-list"
        >
          {cashOutCategories.map((category) => (
            <div
              key={category.id}
              className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-red-200 hover:bg-red-50/30 transition-all duration-200"
              data-testid={`cash-out-category-${category.id}`}
            >
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 text-sm">{category.name}</h4>
                <p className="text-red-600 font-semibold text-lg">{formatCurrency(category.amount)}</p>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge 
                  variant="secondary"
                  className={`${getTrendColor(category.trend)} border-0 text-xs`}
                  data-testid={`cash-out-trend-${category.id}`}
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
          <p className="text-xs text-gray-500 text-center" data-testid="cash-out-period-label">
            Showing cash outflows for {timePeriods.find(p => p.id === selectedPeriod)?.label.toLowerCase()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}