/*
 * COLLECTIONS BREAKDOWN PER PROVIDER WIDGET
 * ==========================================
 * 
 * Displays provider-level collection data in both graph and list views
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, List } from "lucide-react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { useAuth } from "@/contexts/AuthContext";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface CollectionsBreakdownProps {
  selectedLocationId: string;
  selectedTimePeriod?: string;
}

// Time period options
const timePeriods = [
  { value: '1M', label: '1M' },
  { value: '3M', label: '3M' },
  { value: '6M', label: '6M' },
  { value: '1Y', label: '1Y' }
];

interface ProviderData {
  name: string;
  amount: number;
  percentage: number;
}

export default function CollectionsBreakdownWidget({
  selectedLocationId,
  selectedTimePeriod = "1Y"
}: CollectionsBreakdownProps) {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<'graph' | 'list'>('graph');
  const [providers, setProviders] = useState<ProviderData[]>([]);
  const [totalCollections, setTotalCollections] = useState(0);
  const [loading, setLoading] = useState(false);
  const [localTimePeriod, setLocalTimePeriod] = useState(selectedTimePeriod);

  // Update local time period when prop changes
  useEffect(() => {
    setLocalTimePeriod(selectedTimePeriod);
  }, [selectedTimePeriod]);

  useEffect(() => {
    generateCollectionsData();
  }, [selectedLocationId, localTimePeriod, user]);

  const generateCollectionsData = () => {
    if (!user || !user.providers) {
      setProviders([]);
      setTotalCollections(0);
      return;
    }

    // Calculate base monthly collections from revenue
    // Collections should match the revenue data from FinancialRevenueWidget
    const practiceType = user.practiceName?.toLowerCase().includes('orthodontic') 
      ? 'orthodontic' 
      : 'ophthalmology';
    
    // Base monthly collections (should match revenue from staticData)
    // Orthodontic: $959,510/month, Ophthalmology: ~$360,000/month
    const baseMonthlyCollections = practiceType === 'orthodontic' ? 959510 : 360000;
    
    // Scale by time period
    const multiplier = localTimePeriod === '1M' ? 1 : 
                      localTimePeriod === '3M' ? 3 : 
                      localTimePeriod === '6M' ? 6 : 
                      localTimePeriod === '1Y' ? 12 : 12;
    
    const totalColls = baseMonthlyCollections * multiplier;
    setTotalCollections(totalColls);
    
    // Calculate provider amounts based on their percentages
    const providerData = user.providers.map(provider => ({
      name: provider.name,
      amount: Math.round((totalColls * provider.percentage) / 100),
      percentage: provider.percentage
    }));
    
    setProviders(providerData);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const chartData = {
    labels: providers.map(p => p.name),
    datasets: [
      {
        label: 'Collections',
        data: providers.map(p => p.amount),
        backgroundColor: [
          '#3B82F6', // blue
          '#10B981', // green
          '#F59E0B', // amber
          '#A855F7', // purple
          '#EC4899', // pink
          '#06B6D4', // cyan
          '#22C55E', // lime
          '#F97316', // orange
          '#8B5CF6', // violet
          '#EF4444'  // red
        ],
        borderRadius: 4,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return formatCurrency(context.parsed.y);
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return '$' + (value / 1000) + 'K';
          }
        }
      },
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45
        }
      }
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Collections Breakdown Per Provider</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <CardTitle>Revenue Breakdown Per Provider</CardTitle>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4 mr-1" />
                List
              </Button>
              <Button
                variant={viewMode === 'graph' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('graph')}
              >
                <BarChart3 className="h-4 w-4 mr-1" />
                Graph
              </Button>
            </div>
          </div>
          
          {/* Time Period Filter */}
          <div className="flex items-center justify-end gap-2">
            <span className="text-sm font-medium text-gray-700">Time Period:</span>
            <div className="flex bg-gray-100 rounded-lg p-1">
              {timePeriods.map((period) => (
                <button
                  key={period.value}
                  onClick={() => setLocalTimePeriod(period.value)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    localTimePeriod === period.value
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {viewMode === 'graph' ? (
          <div className="h-80">
            <Bar data={chartData} options={chartOptions} />
          </div>
        ) : (
          <div className="space-y-3">
            {providers.map((provider, index) => (
              <div
                key={provider.name}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{provider.name}</p>
                    <p className="text-sm text-gray-500">{Math.round(provider.percentage)}%</p>
                  </div>
                </div>
                <p className="text-lg font-semibold text-green-600">
                  {formatCurrency(provider.amount)}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Total Collections */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900">Total Revenue</span>
            </div>
            <span className="text-2xl font-bold text-green-600">
              {formatCurrency(totalCollections)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

