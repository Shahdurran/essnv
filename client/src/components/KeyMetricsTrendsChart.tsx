import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Calendar, BarChart3 } from "lucide-react";
import { generateRevenueTimeSeriesData } from "@/lib/mockData";
import type { RevenueDataPoint } from "../../../shared/schema";

// Chart.js imports
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  type ChartConfiguration,
  type Chart
} from 'chart.js';

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

interface KeyMetricsTrendsChartProps {
  selectedLocationId: string;
}

/**
 * KeyMetricsTrendsChart Component
 * 
 * Advanced analytics chart component with projections and time series visualization.
 * Displays key business metrics with actual vs projected performance comparison.
 * Supports multiple time periods and metric types for comprehensive analysis.
 * 
 * Features:
 * - Interactive Chart.js visualization with actual and projected data
 * - Time period selection (1yr, 2yr, 5yr)
 * - Multiple metric types (revenue, patient volume, AR days, etc.)
 * - Location-based filtering integration
 * - Professional medical UI design matching specifications
 * - Real-time data updates and projections
 */
export default function KeyMetricsTrendsChart({ selectedLocationId }: KeyMetricsTrendsChartProps) {
  
  // State management for chart controls
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<string>("2yr");
  const [selectedMetric, setSelectedMetric] = useState<string>("revenue");
  
  // Chart.js instance reference
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  /**
   * Fetch revenue trends data from API
   */
  const { data: revenueData = [], isLoading, error } = useQuery<RevenueDataPoint[]>({
    queryKey: ['/api/analytics/revenue-trends', selectedLocationId, selectedTimePeriod],
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes for fresh analytics
  });

  /**
   * Process chart data based on selected metric and time period
   */
  const processChartData = (): RevenueDataPoint[] => {
    if (!revenueData.length) {
      // Generate mock data for development
      return generateRevenueTimeSeriesData(24, 420000);
    }

    // Filter data based on time period
    let filteredData = revenueData;
    const now = new Date();
    
    if (selectedTimePeriod === "1yr") {
      const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      filteredData = revenueData.filter((item: RevenueDataPoint) => new Date(item.date) >= oneYearAgo);
    } else if (selectedTimePeriod === "2yr") {
      const twoYearsAgo = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate());
      filteredData = revenueData.filter((item: RevenueDataPoint) => new Date(item.date) >= twoYearsAgo);
    }
    // 5yr shows all available data

    return filteredData;
  };

  /**
   * Get chart configuration based on selected metric
   */
  const getChartConfig = (data: RevenueDataPoint[]): ChartConfiguration<'line'> => {
    const labels = data.map((item: RevenueDataPoint) => 
      item.monthName || new Date(item.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    );

    // Split data into actual and projected
    const actualData = data.filter((item: RevenueDataPoint) => !item.isProjected);
    const projectedData = data.filter((item: RevenueDataPoint) => item.isProjected);

    // Get values based on selected metric
    const getMetricValue = (item: RevenueDataPoint): number => {
      switch (selectedMetric) {
        case 'revenue':
          return item.revenue || 0;
        case 'patients':
          return item.patientCount || 0;
        case 'arDays':
          return item.arDays || 0;
        default:
          return item.revenue || 0;
      }
    };

    const actualValues = actualData.map(getMetricValue);
    const projectedValues = projectedData.map(getMetricValue);

    // Chart configuration
    const config: ChartConfiguration<'line'> = {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: `Actual ${selectedMetric === 'revenue' ? 'Revenue' : selectedMetric === 'patients' ? 'Patients' : 'AR Days'}`,
            data: actualValues,
            borderColor: '#0EA5E9',
            backgroundColor: 'rgba(14, 165, 233, 0.1)',
            borderWidth: 3,
            fill: false,
            tension: 0.4,
            pointRadius: 6,
            pointHoverRadius: 8,
            pointBackgroundColor: '#0EA5E9',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2
          },
          {
            label: `Projected ${selectedMetric === 'revenue' ? 'Revenue' : selectedMetric === 'patients' ? 'Patients' : 'AR Days'}`,
            data: projectedValues,
            borderColor: '#10B981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderWidth: 3,
            fill: false,
            tension: 0.4,
            pointRadius: 6,
            pointHoverRadius: 8,
            pointBackgroundColor: '#10B981',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            borderDash: [8, 4]
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              padding: 20,
              usePointStyle: true,
              font: {
                size: 12,
                weight: 500
              }
            }
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            titleColor: '#1F2937',
            bodyColor: '#374151',
            borderColor: '#E5E7EB',
            borderWidth: 1,
            cornerRadius: 8,
            padding: 12,
            callbacks: {
              label: function(context: any) {
                const label = context.dataset.label || '';
                const value = formatMetricValue(context.parsed.y, selectedMetric);
                return `${label}: ${value}`;
              }
            }
          }
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: 'Time Period',
              font: {
                size: 12,
                weight: 600
              }
            },
            grid: {
              display: false
            }
          },
          y: {
            display: true,
            title: {
              display: true,
              text: getYAxisLabel(selectedMetric),
              font: {
                size: 12,
                weight: 600
              }
            },
            grid: {
              color: 'rgba(156, 163, 175, 0.2)'
            },
            ticks: {
              callback: function(value: any) {
                return formatMetricValue(value, selectedMetric);
              }
            }
          }
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false
        }
      }
    };

    return config;
  };

  /**
   * Initialize and update chart
   */
  useEffect(() => {
    if (!chartRef.current) return;

    const data = processChartData();
    const config = getChartConfig(data);

    // Destroy existing chart instance
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Create new chart instance
    chartInstance.current = new ChartJS(chartRef.current, config);

    // Cleanup function
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [selectedTimePeriod, selectedMetric, selectedLocationId, revenueData]);

  /**
   * Format metric values for display
   */
  const formatMetricValue = (value: number, metric: string): string => {
    if (metric === 'revenue') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value);
    } else if (metric === 'patients') {
      return new Intl.NumberFormat('en-US').format(value);
    } else if (metric === 'arDays') {
      return `${value} days`;
    }
    return value.toString();
  };

  /**
   * Get Y-axis label based on metric
   */
  const getYAxisLabel = (metric: string): string => {
    switch (metric) {
      case 'revenue':
        return 'Revenue ($)';
      case 'patients':
        return 'Patient Count';
      case 'arDays':
        return 'AR Days';
      default:
        return 'Value';
    }
  };

  /**
   * Handle time period change
   */
  const handleTimePeriodChange = (period: string): void => {
    setSelectedTimePeriod(period);
  };

  /**
   * Handle metric change
   */
  const handleMetricChange = (metric: string): void => {
    setSelectedMetric(metric);
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center space-x-2 text-slate-600">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span>Loading analytics data...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center text-slate-500">
              <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Unable to load analytics data</p>
              <p className="text-sm">Please try again later</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        {/* Chart Header with Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Key Metrics Trends</h3>
              <p className="text-sm text-slate-500">Performance analysis with projections</p>
            </div>
          </div>

          {/* Chart Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
            
            {/* Metric Selection */}
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4 text-slate-500" />
              <Select value={selectedMetric} onValueChange={handleMetricChange}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Select metric" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="revenue">Revenue</SelectItem>
                  <SelectItem value="patients">Patient Count</SelectItem>
                  <SelectItem value="arDays">AR Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Time Period Selection */}
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-slate-500" />
              <div className="flex space-x-1 bg-slate-100 rounded-lg p-1">
                {['1yr', '2yr', '5yr'].map((period) => (
                  <Button
                    key={period}
                    variant={selectedTimePeriod === period ? "default" : "ghost"}
                    size="sm"
                    onClick={() => handleTimePeriodChange(period)}
                    className={`px-3 py-1 text-xs font-medium transition-all ${
                      selectedTimePeriod === period
                        ? 'bg-white shadow-sm text-slate-900'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {period.toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Chart Container */}
        <div className="relative h-80 w-full">
          <canvas ref={chartRef} className="w-full h-full" />
        </div>

        {/* Chart Legend/Summary */}
        <div className="flex flex-wrap items-center justify-center mt-4 space-x-6 text-sm text-slate-600">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Actual Performance</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-1 bg-green-500 rounded" style={{ borderTop: '2px dashed #10B981' }}></div>
            <span>Projected Trends</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}