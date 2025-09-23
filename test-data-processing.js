// Simple test script to verify data processing
import { 
  getFinancialRevenueFromPL, 
  getFinancialExpensesFromPL, 
  getPLDataForLocation,
  calculateKeyMetrics 
} from './client/src/lib/staticData.js';

console.log('Testing data processing...\n');

try {
  // Test revenue data
  console.log('=== REVENUE DATA ===');
  const revenueData = getFinancialRevenueFromPL('all', '1Y');
  console.log('Revenue categories:', revenueData.categories.length);
  console.log('Total revenue:', revenueData.total);
  console.log('Sample categories:', revenueData.categories.slice(0, 3));
  
  // Test expenses data
  console.log('\n=== EXPENSES DATA ===');
  const expensesData = getFinancialExpensesFromPL('all', '1Y');
  console.log('Expense categories:', expensesData.categories.length);
  console.log('Total expenses:', expensesData.total);
  console.log('Sample categories:', expensesData.categories.slice(0, 3));
  
  // Test P&L data
  console.log('\n=== P&L DATA ===');
  const plData = getPLDataForLocation('all', '1Y');
  console.log('Revenue items:', Object.keys(plData.revenue).length);
  console.log('Expense items:', Object.keys(plData.expenses).length);
  console.log('Gross Profit:', plData.grossProfit);
  console.log('EBITDA:', plData.ebitda);
  console.log('Net Income:', plData.netIncome);
  
  // Test key metrics
  console.log('\n=== KEY METRICS ===');
  const keyMetrics = calculateKeyMetrics('all', '1');
  console.log('Monthly Revenue:', keyMetrics.monthlyRevenue);
  console.log('Monthly Patients:', keyMetrics.monthlyPatients);
  console.log('Average Revenue Per Patient:', keyMetrics.averageRevenuePerPatient);
  
  console.log('\n✅ All tests passed!');
  
} catch (error) {
  console.error('❌ Test failed:', error.message);
  console.error(error.stack);
}
