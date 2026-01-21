/*
 * STATIC DATA MODULE FOR MDS AI ANALYTICS
 * =======================================
 * 
 * This module processes the static JSON data files and provides utility functions
 * to convert them into the formats expected by the frontend components.
 * 
 * DATA SOURCES:
 * - practice_locations.json: Practice location information
 * - cash_flow_monthly_data.json: Monthly cash flow data
 * - pl_monthly_data.json: Profit & Loss monthly data
 */

// Import the static JSON data
import practiceLocationsData from '../data/practice_locations.json';
import cashFlowData from '../data/cash_flow_monthly_data.json';
import plData from '../data/pl_monthly_data.json';

// Types for the raw data
interface RawPracticeLocation {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  phone: string;
  is_active: boolean;
}

interface RawCashFlowItem {
  id: string;
  location_id: string;
  line_item: string;
  category_type: string;
  month_year: string;
  amount: string;
  created_at: string;
  updated_at: string;
}

interface RawPLItem {
  id: string;
  location_id: string;
  line_item: string;
  category_type: string;
  month_year: string;
  amount: string;
  created_at: string;
  updated_at: string;
}

// Cast the imported JSON data to the correct types
const rawPracticeLocations = practiceLocationsData as RawPracticeLocation[];
const rawCashFlowData = cashFlowData as RawCashFlowItem[];
const rawPLData = plData as RawPLItem[];

/**
 * Process practice locations data
 */
export function getProcessedLocations() {
  return rawPracticeLocations.map(location => ({
    id: location.id,
    name: location.name,
    address: location.address,
    city: location.city,
    state: location.state,
    zipCode: location.zip_code,
    phone: location.phone,
    isActive: location.is_active
  }));
}

/**
 * Get cash flow data for a specific location and time period
 */
export function getCashFlowDataForLocation(locationId: string = 'all', period: string = '1Y') {
  // Ignore locationId - data remains the same for all locations
  let filteredData = rawCashFlowData;
  
  // Filter by time period
  filteredData = filterDataByPeriod(filteredData, period);
  
  // Group data by category type
  const operatingData = filteredData.filter(item => item.category_type === 'operating');
  const investingData = filteredData.filter(item => item.category_type === 'investing');
  const financingData = filteredData.filter(item => item.category_type === 'financing');
  const calculatedTotals = filteredData.filter(item => item.category_type === 'calculated_totals');
  
  // Calculate totals
  const operatingTotal = operatingData.reduce((sum, item) => sum + parseFloat(item.amount), 0);
  const investingTotal = investingData.reduce((sum, item) => sum + parseFloat(item.amount), 0);
  const financingTotal = financingData.reduce((sum, item) => sum + parseFloat(item.amount), 0);
  
  // Get net cash flow from calculated totals
  const netCashFlowItems = calculatedTotals.filter(item => item.line_item === 'Net Cash Flow');
  const netCashFlow = netCashFlowItems.reduce((sum, item) => sum + parseFloat(item.amount), 0);
  
  // Group operating items by line_item and sum amounts
  const operatingItems = groupAndSumByLineItem(operatingData);
  const investingItems = groupAndSumByLineItem(investingData);
  const financingItems = groupAndSumByLineItem(financingData);
  
  return {
    operating: operatingItems.map(item => ({
      name: item.line_item,
      amount: item.total_amount,
      change: Math.random() * 10 - 5, // Random change for now
      trend: item.total_amount > 0 ? 'up' : 'down'
    })),
    investing: investingItems.map(item => ({
      name: item.line_item,
      amount: item.total_amount,
      change: Math.random() * 10 - 5,
      trend: item.total_amount > 0 ? 'up' : 'down'
    })),
    financing: financingItems.map(item => ({
      name: item.line_item,
      amount: item.total_amount,
      change: Math.random() * 10 - 5,
      trend: item.total_amount > 0 ? 'up' : 'down'
    })),
    operatingCashFlow: operatingTotal,
    investingCashFlow: investingTotal,
    financingCashFlow: financingTotal,
    netCashFlow: netCashFlow,
    period: period,
    totals: {
      operating: operatingTotal,
      investing: investingTotal,
      financing: financingTotal,
      netCashFlow: netCashFlow
    }
  };
}

/**
 * Get P&L data for a specific location and time period
 */
export function getPLDataForLocation(locationId: string = 'all', period: string = '1Y') {
  // Ignore locationId - data remains the same for all locations
  let filteredData = rawPLData;
  
  // Filter by time period
  filteredData = filterDataByPeriod(filteredData, period);
  
  // Group data by category type and aggregate across filtered months
  const revenueData = filteredData.filter(item => item.category_type === 'revenue');
  const directCostsData = filteredData.filter(item => item.category_type === 'direct_costs');
  const operatingExpensesData = filteredData.filter(item => item.category_type === 'operating_expenses');
  const calculatedTotals = filteredData.filter(item => item.category_type === 'calculated_totals');
  
  // Group and sum by line item across filtered months
  const revenueItems = groupAndSumByLineItem(revenueData);
  const expenseItems = [
    ...groupAndSumByLineItem(directCostsData),
    ...groupAndSumByLineItem(operatingExpensesData)
  ];
  
  // Create revenue and expenses objects
  const revenue: Record<string, number> = {};
  revenueItems.forEach(item => {
    revenue[item.line_item] = Math.round(item.total_amount);
  });
  
  const expenses: Record<string, number> = {};
  expenseItems.forEach(item => {
    expenses[item.line_item] = Math.round(Math.abs(item.total_amount)); // Make expenses positive for display
  });
  
  // Get calculated totals (sum across filtered months)
  const grossProfitItems = calculatedTotals.filter(item => item.line_item === 'Gross Profit');
  const ebitdaItems = calculatedTotals.filter(item => item.line_item === 'EBITDA');
  
  const grossProfit = grossProfitItems.reduce((sum, item) => sum + parseFloat(item.amount), 0);
  const ebitda = ebitdaItems.reduce((sum, item) => sum + parseFloat(item.amount), 0);
  
  // Calculate net income (simplified as EBITDA for now)
  const netIncome = ebitda * 0.85; // Assume 85% of EBITDA after taxes and interest
  
  // Calculate totals for the widget
  const totalRevenue = Object.values(revenue).reduce((sum, amount) => sum + amount, 0);
  const totalExpenses = Object.values(expenses).reduce((sum, amount) => sum + amount, 0);
  const netProfit = ebitda; // Use EBITDA as net profit for the widget

  return {
    revenue,
    expenses,
    totalRevenue: Math.round(totalRevenue),
    totalExpenses: Math.round(totalExpenses),
    netProfit: Math.round(netProfit),
    grossProfit: Math.round(grossProfit),
    ebitda: Math.round(ebitda),
    netIncome: Math.round(netIncome),
    period
  };
}

/**
 * Get revenue trends data from P&L data
 */
export function getRevenueTrendsFromPL(locationId: string = 'all', period: string = '1Y') {
  // Ignore locationId - data remains the same for all locations
  let filteredData = rawPLData;
  
  // Group by month_year
  const monthlyData: Record<string, any> = {};
  
  filteredData.forEach(item => {
    const monthYear = item.month_year;
    if (!monthlyData[monthYear]) {
      monthlyData[monthYear] = {
        month: monthYear,
        revenue: 0,
        expenses: 0,
        ebitda: 0,
        writeOffs: 0,
        patientCount: 0
      };
    }
    
    const amount = parseFloat(item.amount);
    
    if (item.category_type === 'revenue') {
      monthlyData[monthYear].revenue += amount;
    } else if (item.category_type === 'direct_costs' || item.category_type === 'operating_expenses') {
      monthlyData[monthYear].expenses += Math.abs(amount);
    } else if (item.line_item === 'EBITDA') {
      monthlyData[monthYear].ebitda = amount;
    }
  });
  
  // Convert to array and sort by month
  const trendsArray = Object.values(monthlyData).sort((a: any, b: any) => {
    return new Date(a.month + '-01').getTime() - new Date(b.month + '-01').getTime();
  });
  
  // Calculate derived values
  trendsArray.forEach((item: any) => {
    item.writeOffs = Math.round(item.revenue * 0.08); // Assume 8% write-off rate
    item.patientCount = Math.round(item.revenue / 340); // $340 average per patient
    item.isProjected = false; // All data is historical
  });
  
  return trendsArray;
}

/**
 * Helper function to filter data by time period
 */
function filterDataByPeriod(data: RawPLItem[] | RawCashFlowItem[], period: string) {
  if (period === '1Y') {
    return data; // Return all data for 1 year
  }
  
  // Get the most recent month from the data
  const allMonths = [...new Set(data.map(item => item.month_year))].sort();
  const mostRecentMonth = allMonths[allMonths.length - 1];
  
  // Calculate the start month based on period
  const [year, month] = mostRecentMonth.split('-').map(Number);
  let startMonth: string;
  
  switch (period) {
    case '1M':
      startMonth = mostRecentMonth;
      break;
    case '3M':
      const threeMonthsAgo = new Date(year, month - 3, 1);
      startMonth = `${threeMonthsAgo.getFullYear()}-${String(threeMonthsAgo.getMonth() + 1).padStart(2, '0')}`;
      break;
    case '6M':
      const sixMonthsAgo = new Date(year, month - 6, 1);
      startMonth = `${sixMonthsAgo.getFullYear()}-${String(sixMonthsAgo.getMonth() + 1).padStart(2, '0')}`;
      break;
    default:
      return data; // Return all data for 1Y or unknown periods
  }
  
  return data.filter(item => item.month_year >= startMonth);
}

/**
 * Orthodontic practice revenue data (for Elite Orthodontics)
 */
const ORTHODONTIC_REVENUE_DATA = {
  monthly: {
    'Comprehensive Orthodontic Treatment': 319000,
    'Dental Implants': 179200,
    'Crowns': 143750,
    'Wisdom Tooth Extractions': 94500,
    'Root Canal Therapy': 78200,
    'Limited Orthodontic Treatment': 61600,
    'Surgical Extractions': 48160,
    'Teeth Whitening': 35100
  }
};

/**
 * Get financial revenue data from P&L
 */
export function getFinancialRevenueFromPL(locationId: string = 'all', period: string = '1Y', practiceType: string = 'ophthalmology') {
  // Check if this is an orthodontic practice
  if (practiceType === 'orthodontic') {
    // Use orthodontic revenue data
    const multiplier = period === '1M' ? 1 : 
                      period === '3M' ? 3 : 
                      period === '6M' ? 6 : 
                      period === '1Y' ? 12 : 12;
    
    const categories = Object.entries(ORTHODONTIC_REVENUE_DATA.monthly).map(([name, baseAmount]) => ({
      id: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      name: name,
      amount: Math.round(baseAmount * multiplier),
      change: Math.random() * 15 + 5, // 5-20% positive growth
      trend: 'up' as const
    }));
    
    const total = categories.reduce((sum, cat) => sum + cat.amount, 0);
    
    return {
      categories,
      total,
      period
    };
  }
  
  // Otherwise use ophthalmology data from P&L
  // Ignore locationId - data remains the same for all locations
  let filteredData = rawPLData;
  
  // Filter by time period
  filteredData = filterDataByPeriod(filteredData, period);
  
  // Get revenue items only and aggregate across filtered months
  const revenueData = filteredData.filter(item => item.category_type === 'revenue');
  const revenueItems = groupAndSumByLineItem(revenueData);
  
  // Convert to expected format
  const categories = revenueItems.map((item, index) => ({
    id: item.line_item.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
    name: item.line_item,
    amount: Math.round(item.total_amount), // Round to whole numbers
    change: Math.random() * 10 - 2, // Random positive change
    trend: 'up' as const
  }));
  
  const total = categories.reduce((sum, cat) => sum + cat.amount, 0);
  
  return {
    categories,
    total,
    period
  };
}

/**
 * Orthodontic practice expense data (for Elite Orthodontics)
 */
const ORTHODONTIC_EXPENSE_DATA = {
  monthly: {
    'Salaries & Wages': 185000,
    'Dental Supplies': 95000,
    'Rent & Facilities': 42000,
    'Equipment & Maintenance': 28000,
    'Marketing & Advertising': 22000,
    'Insurance': 18000,
    'Utilities': 12000,
    'Professional Services': 9000
  }
};

/**
 * Get financial expenses data from P&L
 */
export function getFinancialExpensesFromPL(locationId: string = 'all', period: string = '1Y', practiceType: string = 'ophthalmology') {
  // Check if this is an orthodontic practice
  if (practiceType === 'orthodontic') {
    // Use orthodontic expense data
    const multiplier = period === '1M' ? 1 : 
                      period === '3M' ? 3 : 
                      period === '6M' ? 6 : 
                      period === '1Y' ? 12 : 12;
    
    const categories = Object.entries(ORTHODONTIC_EXPENSE_DATA.monthly).map(([name, baseAmount]) => ({
      id: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      name: name,
      amount: Math.round(baseAmount * multiplier),
      change: Math.random() * 8 - 2, // -2 to +6% change
      trend: Math.random() > 0.6 ? 'up' : 'down' as const
    }));
    
    const total = categories.reduce((sum, cat) => sum + cat.amount, 0);
    
    return {
      categories,
      total,
      period
    };
  }
  
  // Otherwise use ophthalmology data from P&L
  // Ignore locationId - data remains the same for all locations
  let filteredData = rawPLData;
  
  // Filter by time period
  filteredData = filterDataByPeriod(filteredData, period);
  
  // Get expense items (direct costs and operating expenses) and aggregate across filtered months
  const expenseData = filteredData.filter(item => 
    item.category_type === 'direct_costs' || item.category_type === 'operating_expenses'
  );
  const expenseItems = groupAndSumByLineItem(expenseData);
  
  // Convert to expected format
  const categories = expenseItems.map((item, index) => ({
    id: item.line_item.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
    name: item.line_item,
    amount: Math.round(Math.abs(item.total_amount)), // Make positive and round for display
    change: Math.random() * 6 - 3, // Random change
    trend: Math.random() > 0.5 ? 'up' : 'down' as const
  }));
  
  const total = categories.reduce((sum, cat) => sum + cat.amount, 0);
  
  return {
    categories,
    total,
    period
  };
}

/**
 * Calculate key metrics from the data
 */
export function calculateKeyMetrics(locationId: string = 'all', timeRange: string = '1') {
  // Get recent month data for calculations - use the most recent month available
  const recentMonth = '2025-08'; // Use the most recent month in the data
  
  let filteredPLData = rawPLData;
  let filteredCashFlowData = rawCashFlowData;
  
  if (locationId !== 'all') {
    filteredPLData = rawPLData.filter(item => item.location_id === locationId);
    filteredCashFlowData = rawCashFlowData.filter(item => item.location_id === locationId);
  }
  
  // Get current month data
  const currentMonthPL = filteredPLData.filter(item => item.month_year === recentMonth);
  const currentMonthCF = filteredCashFlowData.filter(item => item.month_year === recentMonth);
  
  // Calculate monthly revenue from current month
  const revenueItems = currentMonthPL.filter(item => item.category_type === 'revenue');
  const monthlyRevenue = revenueItems.reduce((sum, item) => sum + parseFloat(item.amount), 0);
  
  // Estimate monthly patients (based on average revenue per patient)
  const monthlyPatients = Math.round(monthlyRevenue / 340);
  
  // Calculate AR days (simplified estimate)
  const arDays = 28.4; // Use a reasonable estimate
  
  // Clean claim rate (estimate)
  const cleanClaimRate = 94.2;
  
  return {
    monthlyPatients,
    monthlyRevenue: Math.round(monthlyRevenue),
    arDays,
    cleanClaimRate,
    patientGrowth: "+8.2%", // Static for now
    revenueGrowth: "+12.5%", // Static for now
    averageRevenuePerPatient: monthlyPatients > 0 ? Math.round(monthlyRevenue / monthlyPatients) : 0,
    noShowRate: 6.8,
    cancellationRate: 4.2,
    newPatientRate: 18.5,
    referralRate: 23.7
  };
}

/**
 * Utility function to group data by line_item and sum amounts
 */
function groupAndSumByLineItem(data: RawCashFlowItem[] | RawPLItem[]) {
  const grouped: Record<string, { line_item: string; total_amount: number }> = {};
  
  data.forEach(item => {
    if (!grouped[item.line_item]) {
      grouped[item.line_item] = {
        line_item: item.line_item,
        total_amount: 0
      };
    }
    grouped[item.line_item].total_amount += parseFloat(item.amount);
  });
  
  return Object.values(grouped);
}

/**
 * Get unique months from the data for time series
 */
export function getAvailableMonths() {
  const months = new Set<string>();
  
  rawCashFlowData.forEach(item => months.add(item.month_year));
  rawPLData.forEach(item => months.add(item.month_year));
  
  return Array.from(months).sort();
}

/**
 * Format month string to readable format
 */
export function formatMonth(monthYear: string) {
  const [year, month] = monthYear.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}
