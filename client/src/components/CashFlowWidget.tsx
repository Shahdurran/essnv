import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart3, List, TrendingUp, TrendingDown, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Line } from "react-chartjs-2";
import { useQuery } from "@tanstack/react-query";
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

interface CashFlowWidgetProps {
  selectedLocationId: string;
  selectedPeriod: string;
}

// Interface for cash flow API response
interface CashFlowApiResponse {
  operating: { name: string; amount: number; change: number; trend: string }[];
  investing: { name: string; amount: number; change: number; trend: string }[];
  financing: { name: string; amount: number; change: number; trend: string }[];
  operatingCashFlow: number;
  investingCashFlow: number;
  financingCashFlow: number;
  netCashFlow: number;
  period: string;
}

// This component now fetches real cash flow data from your CSV via API

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
      label: "Operating Cash Flow",
      data: [188300, 195000, 201500, 185600, 210000, 188300],
      borderColor: "rgb(34, 197, 94)",
      backgroundColor: "rgba(34, 197, 94, 0.1)",
      tension: 0.3,
    },
    {
      label: "Investing Cash Flow",
      data: [-67400, -45000, -55000, -72000, -48500, -67400],
      borderColor: "rgb(239, 68, 68)",
      backgroundColor: "rgba(239, 68, 68, 0.1)",
      tension: 0.3,
    },
    {
      label: "Financing Cash Flow",
      data: [-37000, -25000, -30000, -35000, -28000, -37000],
      borderColor: "rgb(168, 85, 247)",
      backgroundColor: "rgba(168, 85, 247, 0.1)",
      tension: 0.3,
    },
    {
      label: "Net Cash Flow",
      data: [83900, 125000, 116500, 78600, 133500, 83900],
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
      beginAtZero: false,
      ticks: {
        callback: function(value: any) {
          return '$' + (value / 1000) + 'K';
        }
      }
    }
  }
};

export default function CashFlowWidget({ selectedLocationId, selectedPeriod }: CashFlowWidgetProps) {
  const [viewMode, setViewMode] = useState<"list" | "graph">("list");
  const [operatingCollapsed, setOperatingCollapsed] = useState(true);
  const [investingCollapsed, setInvestingCollapsed] = useState(true);
  const [financingCollapsed, setFinancingCollapsed] = useState(true);

  // Fetch real cash flow data from CSV-based API
  const { data: cashFlowApiData, isLoading, error } = useQuery<CashFlowApiResponse>({
    queryKey: ['/api/financial/cashflow', selectedLocationId, selectedPeriod],
    enabled: Boolean(selectedLocationId && selectedPeriod),
  });

  // Calculate totals from API data
  const operatingCashFlow = cashFlowApiData?.operatingCashFlow || 0;
  const investingCashFlow = cashFlowApiData?.investingCashFlow || 0;
  const financingCashFlow = cashFlowApiData?.financingCashFlow || 0;
  const netCashFlow = cashFlowApiData?.netCashFlow || 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatCashFlowItem = (key: string, value: number) => {
    const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    return (
      <div key={key} className="flex justify-between items-center py-1" data-testid={`cf-item-${key}`}>
        <span className="text-gray-700 text-sm">{label}</span>
        <span className={`font-medium ${value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {value >= 0 ? '' : '('}{formatCurrency(Math.abs(value))}{value < 0 ? ')' : ''}
        </span>
      </div>
    );
  };

  return (
    <Card className="bg-white shadow-sm border border-gray-200" data-testid="cash-flow-widget">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold text-gray-900 flex items-center justify-between">
          Cash Flow Statement
          
          {/* View Mode Toggle */}
          <div className="flex items-center gap-2" data-testid="cf-view-toggle">
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
              className={viewMode === "list" ? "bg-blue-600 hover:bg-blue-700" : "border-blue-200 text-blue-700 hover:bg-blue-50"}
              data-testid="cf-view-list"
            >
              <List className="h-4 w-4 mr-1" />
              List
            </Button>
            <Button
              variant={viewMode === "graph" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("graph")}
              className={viewMode === "graph" ? "bg-blue-600 hover:bg-blue-700" : "border-blue-200 text-blue-700 hover:bg-blue-50"}
              data-testid="cf-view-graph"
            >
              <BarChart3 className="h-4 w-4 mr-1" />
              Graph
            </Button>
          </div>
        </CardTitle>

      </CardHeader>

      <CardContent>
        {viewMode === "list" ? (
          <div className="space-y-6" data-testid="cf-list-view">
            {/* Operating Activities Section */}
            <div>
              <div 
                className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                onClick={() => setOperatingCollapsed(!operatingCollapsed)}
              >
                <h4 className="font-semibold text-green-700 text-sm uppercase tracking-wide flex items-center">
                  Cash Flow from Operating Activities
                  <span className={`ml-2 text-lg font-bold ${operatingCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {operatingCashFlow >= 0 ? '' : '('}{formatCurrency(Math.abs(operatingCashFlow))}{operatingCashFlow < 0 ? ')' : ''}
                  </span>
                </h4>
                {operatingCollapsed ? (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronUp className="h-4 w-4 text-gray-500" />
                )}
              </div>
              
              {!operatingCollapsed && (
                <div className="space-y-2 mt-3 ml-4">
                {isLoading ? (
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ) : error ? (
                  <div className="text-red-600 text-sm">Error loading operating data</div>
                ) : (
                  cashFlowApiData?.operating?.map((item) => 
                    formatCashFlowItem(item.name, item.amount)
                  )
                )}
                </div>
              )}
            </div>

            {/* Investing Activities Section */}
            <div>
              <div 
                className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                onClick={() => setInvestingCollapsed(!investingCollapsed)}
              >
                <h4 className="font-semibold text-red-700 text-sm uppercase tracking-wide flex items-center">
                  Cash Flow from Investing Activities
                  <span className={`ml-2 text-lg font-bold ${investingCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {investingCashFlow >= 0 ? '' : '('}{formatCurrency(Math.abs(investingCashFlow))}{investingCashFlow < 0 ? ')' : ''}
                  </span>
                </h4>
                {investingCollapsed ? (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronUp className="h-4 w-4 text-gray-500" />
                )}
              </div>
              
              {!investingCollapsed && (
                <div className="space-y-2 mt-3 ml-4">
                {isLoading ? (
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ) : error ? (
                  <div className="text-red-600 text-sm">Error loading investing data</div>
                ) : cashFlowApiData?.investing?.length === 0 ? (
                  <div className="text-gray-500 text-sm">No investing activities</div>
                ) : (
                  cashFlowApiData?.investing?.map((item) => 
                    formatCashFlowItem(item.name, item.amount)
                  )
                )}
                </div>
              )}
            </div>

            {/* Financing Activities Section */}
            <div>
              <div 
                className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                onClick={() => setFinancingCollapsed(!financingCollapsed)}
              >
                <h4 className="font-semibold text-purple-700 text-sm uppercase tracking-wide flex items-center">
                  Cash Flow from Financing Activities
                  <span className={`ml-2 text-lg font-bold ${financingCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {financingCashFlow >= 0 ? '' : '('}{formatCurrency(Math.abs(financingCashFlow))}{financingCashFlow < 0 ? ')' : ''}
                  </span>
                </h4>
                {financingCollapsed ? (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronUp className="h-4 w-4 text-gray-500" />
                )}
              </div>
              
              {!financingCollapsed && (
                <div className="space-y-2 mt-3 ml-4">
                {isLoading ? (
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ) : error ? (
                  <div className="text-red-600 text-sm">Error loading financing data</div>
                ) : cashFlowApiData?.financing?.length === 0 ? (
                  <div className="text-gray-500 text-sm">No financing activities</div>
                ) : (
                  cashFlowApiData?.financing?.map((item) => 
                    formatCashFlowItem(item.name, item.amount)
                  )
                )}
                </div>
              )}
            </div>

            {/* Net Cash Flow Section */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center" data-testid="cf-net-cash-flow">
                <span className="font-bold text-gray-900 text-lg">Net Change in Cash</span>
                <div className="flex items-center gap-2">
                  <span className={`font-bold text-2xl ${netCashFlow >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    {netCashFlow >= 0 ? '' : '('}{formatCurrency(Math.abs(netCashFlow))}{netCashFlow < 0 ? ')' : ''}
                  </span>
                  <Badge 
                    variant="secondary"
                    className={`${netCashFlow >= 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'} border-0`}
                    data-testid="cf-net-trend"
                  >
                    {netCashFlow >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {netCashFlow >= 0 ? 'Positive' : 'Negative'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4" data-testid="cf-graph-view">
            <div className="h-80">
              <Line data={chartData} options={chartOptions} />
            </div>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-xs text-gray-500">Operating</p>
                <p className="font-semibold text-green-600">{formatCurrency(operatingCashFlow)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Investing</p>
                <p className="font-semibold text-red-600">{formatCurrency(Math.abs(investingCashFlow))}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Financing</p>
                <p className="font-semibold text-purple-600">{formatCurrency(Math.abs(financingCashFlow))}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Net Change</p>
                <p className="font-semibold text-blue-600">{formatCurrency(netCashFlow)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Period Label */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500 text-center" data-testid="cf-period-label">
            Showing cash flow for {timePeriods.find(p => p.id === selectedPeriod)?.label.toLowerCase()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}