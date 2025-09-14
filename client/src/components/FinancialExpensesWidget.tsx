import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

interface FinancialExpensesWidgetProps {
  selectedLocationId: string;
  selectedPeriod: string;
}

// Interface for expense API response  
interface ExpenseApiResponse {
  categories: { id: string; name: string; amount: number; change: number; trend: 'up' | 'down' | 'neutral' }[];
  totalExpenses: number;
  period: string;
}

const timePeriods = [
  { id: "1M", label: "1 Month", active: false },
  { id: "3M", label: "3 Months", active: false },
  { id: "6M", label: "6 Months", active: true },
  { id: "1Y", label: "1 Year", active: false },
  { id: "custom", label: "Custom", active: false }
];

export default function FinancialExpensesWidget({ selectedLocationId, selectedPeriod }: FinancialExpensesWidgetProps) {

  // Fetch real expense data from CSV-based API
  const { data: expenseApiData, isLoading, error } = useQuery<ExpenseApiResponse>({
    queryKey: ['/api/financial/expenses', selectedLocationId, selectedPeriod],
    enabled: Boolean(selectedLocationId && selectedPeriod),
  });

  // Use API data or fallback to empty array
  const expenseCategories = expenseApiData?.categories || [];
  
  // Calculate total expenses from API data
  const totalExpenses = expenseApiData?.totalExpenses || 0;
  
  // Calculate weighted average change
  const weightedChange = totalExpenses > 0 ? expenseCategories.reduce((sum, category) => {
    return sum + (category.change * category.amount);
  }, 0) / totalExpenses : 0;

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
    <Card className="bg-white shadow-sm border border-gray-200 flex flex-col h-[28rem]" data-testid="financial-expenses-widget">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold text-gray-900">
          Expenses
        </CardTitle>
        {/* Total Expenses with Overall Trend */}
        <div className="flex items-center gap-2 mt-2">
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
      </CardHeader>

      <CardContent className="flex-1 flex flex-col min-h-0">
        {/* Scrollable Expense Categories List */}
        <div 
          className="space-y-3 flex-1 min-h-0 overflow-y-auto scrollbar-thin scrollbar-thumb-red-200 scrollbar-track-gray-100"
          data-testid="expenses-categories-list"
        >
          {isLoading ? (
            <div className="space-y-3">
              <div className="h-16 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-16 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-16 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ) : error ? (
            <div className="text-red-600 text-sm text-center">Error loading expense data</div>
          ) : expenseCategories.length === 0 ? (
            <div className="text-gray-500 text-sm text-center">No expense data available</div>
          ) : (
            expenseCategories.map((category) => (
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
          ))
          )}
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