import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { useState } from "react";

interface FinancialExpensesWidgetProps {
  selectedLocationId: string;
  selectedPeriod: string;
}

// Expense categories specific to ophthalmology practice
const expenseCategories = [
  {
    id: "staff",
    name: "Staff Salaries & Benefits",
    amount: 125000,
    change: 8.5,
    trend: "up"
  },
  {
    id: "equipment",
    name: "Medical Equipment & Supplies",
    amount: 89500,
    change: -3.2,
    trend: "down"
  },
  {
    id: "facility",
    name: "Facility Rent & Utilities",
    amount: 42000,
    change: 2.1,
    trend: "up"
  },
  {
    id: "insurance",
    name: "Insurance & Legal",
    amount: 28700,
    change: 0.0,
    trend: "neutral"
  },
  {
    id: "marketing",
    name: "Marketing & Advertising",
    amount: 15800,
    change: 12.4,
    trend: "up"
  },
  {
    id: "professional",
    name: "Professional Services",
    amount: 22100,
    change: -1.8,
    trend: "down"
  },
  {
    id: "technology",
    name: "Technology & Software",
    amount: 18900,
    change: 5.6,
    trend: "up"
  },
  {
    id: "pharmaceuticals",
    name: "Medical Supplies & Pharmaceuticals",
    amount: 34200,
    change: -4.1,
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

export default function FinancialExpensesWidget({ selectedLocationId, selectedPeriod }: FinancialExpensesWidgetProps) {

  // Calculate total expenses
  const totalExpenses = expenseCategories.reduce((sum, category) => sum + category.amount, 0);
  
  // Calculate weighted average change
  const weightedChange = expenseCategories.reduce((sum, category) => {
    return sum + (category.change * category.amount);
  }, 0) / totalExpenses;

  const getTrendIcon = (trend: string, change: number) => {
    if (trend === "up") return <TrendingUp className="h-3 w-3" />;
    if (trend === "down") return <TrendingDown className="h-3 w-3" />;
    return <Minus className="h-3 w-3" />;
  };

  const getTrendColor = (trend: string) => {
    // For expenses, up is bad (red) and down is good (green)
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
    <Card className="bg-white shadow-sm border border-gray-200" data-testid="financial-expenses-widget">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold text-gray-900 flex items-center justify-between">
          Expenses
          {/* Total Expenses with Overall Trend */}
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</span>
            <Badge 
              variant="secondary" 
              className={`${getTrendColor(weightedChange > 0 ? "up" : weightedChange < 0 ? "down" : "neutral")} border-0`}
              data-testid="expenses-total-change"
            >
              {getTrendIcon(weightedChange > 0 ? "up" : weightedChange < 0 ? "down" : "neutral", weightedChange)}
              {Math.abs(weightedChange).toFixed(1)}%
            </Badge>
          </div>
        </CardTitle>

      </CardHeader>

      <CardContent>
        {/* Scrollable Expense Categories List */}
        <div 
          className="space-y-3 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-red-200 scrollbar-track-gray-100"
          data-testid="expenses-categories-list"
        >
          {expenseCategories.map((category) => (
            <div
              key={category.id}
              className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-red-200 hover:bg-red-50/30 transition-all duration-200"
              data-testid={`expense-category-${category.id}`}
            >
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 text-sm">{category.name}</h4>
                <p className="text-red-600 font-semibold text-lg">{formatCurrency(category.amount)}</p>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge 
                  variant="secondary"
                  className={`${getTrendColor(category.trend)} border-0 text-xs`}
                  data-testid={`expense-trend-${category.id}`}
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
          <p className="text-xs text-gray-500 text-center" data-testid="expenses-period-label">
            Showing expenses for {timePeriods.find(p => p.id === selectedPeriod)?.label.toLowerCase()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}