import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart3, List, TrendingUp, TrendingDown } from "lucide-react";
import { useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface ProfitLossWidgetProps {
  selectedLocationId: string;
}

// P&L Statement data structure for ophthalmology practice
const profitLossData = {
  revenue: {
    officeVisits: 180000,
    cataractSurgeries: 145000,
    intravitealInjections: 95000,
    diagnostics: 72000,
    refractiveCash: 55000,
    cornealProcedures: 48000,
    oculoplastics: 35000,
    optical: 28000
  },
  expenses: {
    staffSalaries: 125000,
    medicalEquipment: 89500,
    facilityRent: 42000,
    insurance: 28700,
    marketing: 15800,
    professional: 22100,
    technology: 18900,
    pharmaceuticals: 34200
  }
};

const timePeriods = [
  { id: "1M", label: "1 Month", active: false },
  { id: "3M", label: "3 Months", active: false },
  { id: "6M", label: "6 Months", active: true },
  { id: "1Y", label: "1 Year", active: false },
  { id: "custom", label: "Custom", active: false }
];

// Mock historical data for chart
const chartData = {
  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
  datasets: [
    {
      label: "Total Revenue",
      data: [620000, 635000, 658000, 642000, 675000, 658000],
      borderColor: "rgb(34, 197, 94)",
      backgroundColor: "rgba(34, 197, 94, 0.1)",
      tension: 0.3,
    },
    {
      label: "Total Expenses",
      data: [376200, 382000, 395000, 388500, 401000, 376200],
      borderColor: "rgb(239, 68, 68)",
      backgroundColor: "rgba(239, 68, 68, 0.1)",
      tension: 0.3,
    },
    {
      label: "Net Profit",
      data: [243800, 253000, 263000, 253500, 274000, 281800],
      borderColor: "rgb(59, 130, 246)",
      backgroundColor: "rgba(59, 130, 246, 0.1)",
      tension: 0.3,
    }
  ]
};

const chartOptions = {
  responsive: true,
  plugins: {
    legend: {
      position: "top" as const,
    },
    title: {
      display: false,
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: function(value: any) {
          return '$' + (value / 1000) + 'K';
        }
      }
    }
  }
};

export default function ProfitLossWidget({ selectedLocationId }: ProfitLossWidgetProps) {
  const [selectedPeriod, setSelectedPeriod] = useState("6M");
  const [viewMode, setViewMode] = useState<"list" | "graph">("list");

  // Calculate totals
  const totalRevenue = Object.values(profitLossData.revenue).reduce((sum, val) => sum + val, 0);
  const totalExpenses = Object.values(profitLossData.expenses).reduce((sum, val) => sum + val, 0);
  const netProfit = totalRevenue - totalExpenses;
  const netProfitMargin = ((netProfit / totalRevenue) * 100);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(1)}%`;
  };

  return (
    <Card className="bg-white shadow-sm border border-gray-200" data-testid="profit-loss-widget">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center justify-between">
          P&L Statement
          
          {/* View Mode Toggle */}
          <div className="flex items-center gap-2" data-testid="pl-view-toggle">
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
              className={viewMode === "list" ? "bg-blue-600 hover:bg-blue-700" : "border-blue-200 text-blue-700 hover:bg-blue-50"}
              data-testid="pl-view-list"
            >
              <List className="h-4 w-4 mr-1" />
              List
            </Button>
            <Button
              variant={viewMode === "graph" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("graph")}
              className={viewMode === "graph" ? "bg-blue-600 hover:bg-blue-700" : "border-blue-200 text-blue-700 hover:bg-blue-50"}
              data-testid="pl-view-graph"
            >
              <BarChart3 className="h-4 w-4 mr-1" />
              Graph
            </Button>
          </div>
        </CardTitle>

        {/* Time Period Filter */}
        <div className="flex flex-wrap gap-2 mt-4" data-testid="pl-time-filters">
          {timePeriods.map((period) => (
            <Button
              key={period.id}
              variant={selectedPeriod === period.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedPeriod(period.id)}
              className={
                selectedPeriod === period.id
                  ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                  : "border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300"
              }
              data-testid={`pl-filter-${period.id.toLowerCase()}`}
            >
              {period.label}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        {viewMode === "list" ? (
          <div className="space-y-6" data-testid="pl-list-view">
            {/* Revenue Section */}
            <div>
              <h4 className="font-semibold text-green-700 mb-3 text-sm uppercase tracking-wide">Revenue</h4>
              <div className="space-y-2">
                {Object.entries(profitLossData.revenue).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center py-1" data-testid={`pl-revenue-${key}`}>
                    <span className="text-gray-700 text-sm">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </span>
                    <span className="text-green-600 font-medium">{formatCurrency(value)}</span>
                  </div>
                ))}
                <div className="border-t pt-2 mt-2" data-testid="pl-total-revenue">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-900">Total Revenue</span>
                    <span className="font-bold text-green-600 text-lg">{formatCurrency(totalRevenue)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Expenses Section */}
            <div>
              <h4 className="font-semibold text-red-700 mb-3 text-sm uppercase tracking-wide">Expenses</h4>
              <div className="space-y-2">
                {Object.entries(profitLossData.expenses).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center py-1" data-testid={`pl-expense-${key}`}>
                    <span className="text-gray-700 text-sm">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </span>
                    <span className="text-red-600 font-medium">({formatCurrency(value)})</span>
                  </div>
                ))}
                <div className="border-t pt-2 mt-2" data-testid="pl-total-expenses">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-900">Total Expenses</span>
                    <span className="font-bold text-red-600 text-lg">({formatCurrency(totalExpenses)})</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Net Profit Section */}
            <div className="border-t pt-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center" data-testid="pl-net-profit">
                  <span className="font-semibold text-gray-900">Net Profit</span>
                  <span className={`font-bold text-lg ${netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    {formatCurrency(netProfit)}
                  </span>
                </div>
                <div className="flex justify-between items-center" data-testid="pl-profit-margin">
                  <span className="font-semibold text-gray-900">Net Profit Margin</span>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${netProfitMargin >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      {formatPercentage(netProfitMargin)}
                    </span>
                    <Badge 
                      variant="secondary"
                      className={`${netProfitMargin >= 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'} border-0`}
                      data-testid="pl-profit-trend"
                    >
                      {netProfitMargin >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      Healthy
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4" data-testid="pl-graph-view">
            <div className="h-80">
              <Line data={chartData} options={chartOptions} />
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-gray-500">Avg Revenue</p>
                <p className="font-semibold text-green-600">{formatCurrency(totalRevenue)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Avg Expenses</p>
                <p className="font-semibold text-red-600">{formatCurrency(totalExpenses)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Avg Profit</p>
                <p className="font-semibold text-blue-600">{formatCurrency(netProfit)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Period Label */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500 text-center" data-testid="pl-period-label">
            Showing P&L for {timePeriods.find(p => p.id === selectedPeriod)?.label.toLowerCase()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}