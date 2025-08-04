import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Filter } from "lucide-react";
import { format } from "date-fns";

interface DateFilterProps {
  onDateRangeChange: (startDate: Date | null, endDate: Date | null, preset: string) => void;
  className?: string;
}

/**
 * DateFilter Component
 * 
 * Unified date filtering component shared across multiple dashboard widgets.
 * Provides both preset date ranges and custom date range picker functionality.
 * 
 * Features:
 * - Preset options: Today, Last Week, Last Month, Last Quarter, Last 6 Months, Last Year
 * - Custom date range picker (From → To)
 * - Consistent styling across all widgets
 * - Professional medical dashboard UI
 * 
 * @param {Object} props - Component properties
 * @param {Function} props.onDateRangeChange - Callback when date range changes
 * @param {string} props.className - Additional CSS classes
 */
export default function DateFilter({ onDateRangeChange, className = "" }: DateFilterProps) {
  
  const [selectedPreset, setSelectedPreset] = useState("last-month");
  const [customFromDate, setCustomFromDate] = useState<Date | undefined>();
  const [customToDate, setCustomToDate] = useState<Date | undefined>();
  const [isCustomRange, setIsCustomRange] = useState(false);

  // Preset date range options
  const presetOptions = [
    { value: "today", label: "Today" },
    { value: "last-week", label: "Last Week" },
    { value: "last-month", label: "Last Month" },
    { value: "last-quarter", label: "Last Quarter" },
    { value: "last-6-months", label: "Last 6 Months" },
    { value: "last-year", label: "Last Year" },
    { value: "custom", label: "Custom Range" }
  ];

  /**
   * Calculate date range based on preset selection
   * @param {string} preset - The selected preset option
   * @returns {Object} Object with startDate and endDate
   */
  const getPresetDateRange = (preset: string) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (preset) {
      case "today":
        return { startDate: today, endDate: today };
      
      case "last-week":
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        return { startDate: weekAgo, endDate: today };
      
      case "last-month":
        const monthAgo = new Date(today);
        monthAgo.setMonth(today.getMonth() - 1);
        return { startDate: monthAgo, endDate: today };
      
      case "last-quarter":
        const quarterAgo = new Date(today);
        quarterAgo.setMonth(today.getMonth() - 3);
        return { startDate: quarterAgo, endDate: today };
      
      case "last-6-months":
        const sixMonthsAgo = new Date(today);
        sixMonthsAgo.setMonth(today.getMonth() - 6);
        return { startDate: sixMonthsAgo, endDate: today };
      
      case "last-year":
        const yearAgo = new Date(today);
        yearAgo.setFullYear(today.getFullYear() - 1);
        return { startDate: yearAgo, endDate: today };
      
      default:
        return { startDate: null, endDate: null };
    }
  };

  /**
   * Handle preset selection change
   * @param {string} preset - The selected preset
   */
  const handlePresetChange = (preset: string) => {
    setSelectedPreset(preset);
    
    if (preset === "custom") {
      setIsCustomRange(true);
      // Don't trigger callback until custom dates are selected
    } else {
      setIsCustomRange(false);
      const { startDate, endDate } = getPresetDateRange(preset);
      onDateRangeChange(startDate, endDate, preset);
    }
  };

  /**
   * Handle custom date range selection
   */
  const handleCustomDateChange = () => {
    if (customFromDate && customToDate) {
      onDateRangeChange(customFromDate, customToDate, "custom");
    }
  };

  return (
    <div className={`flex flex-col sm:flex-row gap-3 p-4 bg-gray-50 rounded-lg border ${className}`}>
      
      {/* Date Range Preset Selector */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <Filter className="h-4 w-4 text-gray-500 flex-shrink-0" />
        <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Date Range:</span>
        
        <Select value={selectedPreset} onValueChange={handlePresetChange}>
          <SelectTrigger className="w-full sm:w-[180px] bg-white">
            <SelectValue placeholder="Select range" />
          </SelectTrigger>
          <SelectContent>
            {presetOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Custom Date Range Picker */}
      {isCustomRange && (
        <div className="flex flex-col sm:flex-row gap-2 items-center">
          
          {/* From Date */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 whitespace-nowrap">From:</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-[140px] justify-start text-left font-normal bg-white"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {customFromDate ? format(customFromDate, "MMM dd, yyyy") : "Pick date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={customFromDate}
                  onSelect={(date) => {
                    setCustomFromDate(date);
                    if (date && customToDate) {
                      setTimeout(handleCustomDateChange, 100);
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* To Date */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 whitespace-nowrap">To:</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-[140px] justify-start text-left font-normal bg-white"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {customToDate ? format(customToDate, "MMM dd, yyyy") : "Pick date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={customToDate}
                  onSelect={(date) => {
                    setCustomToDate(date);
                    if (customFromDate && date) {
                      setTimeout(handleCustomDateChange, 100);
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

        </div>
      )}

    </div>
  );
}