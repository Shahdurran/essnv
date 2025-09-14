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

interface CashFlowWidgetProps {
  selectedLocationId: string;
  selectedPeriod: string;
}

// Cash Flow Statement data structure for ophthalmology practice
const cashFlowData = {
  operating: {
    patientCollections: 285000,
    insuranceReimbursements: 175000,
    supplierPayments: -89500,
    staffPayroll: -125000,
    rentUtilities: -42000,
    otherOperating: -15200
  },
  investing: {
    equipmentPurchases: -45000,
    technologyInvestments: -18900,
    facilityImprovements: -12000,
    assetSales: 8500
  },
  financing: {
    loanPayments: -15800,
    ownerDraws: -25000,
    lineOfCredit: 12000,
    equipmentFinancing: -8200
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

  // Calculate totals
  const operatingCashFlow = Object.values(cashFlowData.operating).reduce((sum, val) => sum + val, 0);
  const investingCashFlow = Object.values(cashFlowData.investing).reduce((sum, val) => sum + val, 0);
  const financingCashFlow = Object.values(cashFlowData.financing).reduce((sum, val) => sum + val, 0);
  const netCashFlow = operatingCashFlow + investingCashFlow + financingCashFlow;

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
              <h4 className="font-semibold text-green-700 mb-3 text-sm uppercase tracking-wide">Cash Flow from Operating Activities</h4>
              <div className="space-y-2">
                {Object.entries(cashFlowData.operating).map(([key, value]) => 
                  formatCashFlowItem(key, value)
                )}
                <div className="border-t pt-2 mt-2" data-testid="cf-operating-total">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-900">Net Operating Cash Flow</span>
                    <span className={`font-bold text-lg ${operatingCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {operatingCashFlow >= 0 ? '' : '('}{formatCurrency(Math.abs(operatingCashFlow))}{operatingCashFlow < 0 ? ')' : ''}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Investing Activities Section */}
            <div>
              <h4 className="font-semibold text-red-700 mb-3 text-sm uppercase tracking-wide">Cash Flow from Investing Activities</h4>
              <div className="space-y-2">
                {Object.entries(cashFlowData.investing).map(([key, value]) => 
                  formatCashFlowItem(key, value)
                )}
                <div className="border-t pt-2 mt-2" data-testid="cf-investing-total">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-900">Net Investing Cash Flow</span>
                    <span className={`font-bold text-lg ${investingCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {investingCashFlow >= 0 ? '' : '('}{formatCurrency(Math.abs(investingCashFlow))}{investingCashFlow < 0 ? ')' : ''}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Financing Activities Section */}
            <div>
              <h4 className="font-semibold text-purple-700 mb-3 text-sm uppercase tracking-wide">Cash Flow from Financing Activities</h4>
              <div className="space-y-2">
                {Object.entries(cashFlowData.financing).map(([key, value]) => 
                  formatCashFlowItem(key, value)
                )}
                <div className="border-t pt-2 mt-2" data-testid="cf-financing-total">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-900">Net Financing Cash Flow</span>
                    <span className={`font-bold text-lg ${financingCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {financingCashFlow >= 0 ? '' : '('}{formatCurrency(Math.abs(financingCashFlow))}{financingCashFlow < 0 ? ')' : ''}
                    </span>
                  </div>
                </div>
              </div>
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