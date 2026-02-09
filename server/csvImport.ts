// CSV Import functionality for P&L data
import { db } from './storage';
import { plMonthlyData } from '../shared/schema';
import { sql } from 'drizzle-orm';

interface ParsedCSVData {
  locationId: string;
  lineItem: string;
  categoryType: string;
  month: string;
  amount: number;
}

// Helper function to convert "Jan 2024" to "2024-01" format
function convertMonthFormat(monthYear: string): string {
  const parts = monthYear.split(' ');
  if (parts.length !== 2) {
    return monthYear; // Return as-is if format doesn't match
  }
  
  const months: Record<string, string> = {
    'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06',
    'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
  };
  
  const month = months[parts[0]];
  const year = parts[1];
  
  if (month && year) {
    return `${year}-${month}`;
  }
  
  return monthYear;
}

// Helper function to clean and parse currency strings
function parseCurrency(value: string): number {
  // Remove $, commas, and whitespace
  const cleaned = value.replace(/[$,\s]/g, '');
  // Handle parentheses for negative numbers
  const isNegative = cleaned.includes('(') || cleaned.startsWith('-');
  const numericPart = cleaned.replace(/[()]/g, '');
  const parsed = parseFloat(numericPart);
  return isNegative ? -parsed : parsed;
}

// Main function to import P&L data from CSV
export async function importPLData(
  csvContent: string,
  locationId: string,
  userId: string = 'default'
): Promise<{ success: boolean; message: string; recordsInserted: number }> {
  const lines = csvContent.trim().split('\n');
  const insertData: ParsedCSVData[] = [];
  
  // Skip header row and process data
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Split CSV line (handling quoted values)
    const values = parseCSVLine(line);
    
    if (values.length < 4) continue;
    
    const [lineItem, , monthYear, amountStr] = values;
    
    // Skip if any required field is empty
    if (!lineItem || !monthYear || !amountStr) continue;
    
    // Determine category type based on line item
    const lowerLineItem = lineItem.toLowerCase();
    let categoryType = 'expenses';
    
    if (lowerLineItem.includes('gross') || lowerLineItem.includes('revenue') || lowerLineItem.includes('income')) {
      categoryType = 'revenue';
    } else if (lowerLineItem.includes('net') || lowerLineItem.includes('profit') || lowerLineItem.includes('loss')) {
      categoryType = 'profit';
    }
    
    // Parse the amount
    const amount = parseCurrency(amountStr);
    
    // Skip invalid amounts
    if (isNaN(amount)) continue;
    
    insertData.push({
      locationId,
      lineItem,
      categoryType,
      month: convertMonthFormat(monthYear),
      amount
    });
  }
  
  console.log(`Prepared ${insertData.length} records for insert`);
  
  // Clear existing data for this location (if any)
  await db.delete(plMonthlyData);
  console.log('Cleared existing P&L data');
  
  // Insert all records in a single transaction
  if (insertData.length > 0) {
    await db.insert(plMonthlyData).values(
      insertData.map(d => ({
        userId,
        locationId: d.locationId,
        category: d.categoryType,
        subcategory: d.lineItem,
        month: d.month,
        amount: d.amount
      }))
    );
    
    console.log(`Successfully inserted ${insertData.length} P&L records for location ${locationId}`);
  }
  
  return {
    success: true,
    message: `Successfully imported ${insertData.length} records`,
    recordsInserted: insertData.length
  };
}

// Helper function to parse CSV lines (handles quoted values)
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

// Function to get available months from imported data
export async function getAvailableMonths(locationId: string): Promise<string[]> {
  const result = await db
    .select({ month: plMonthlyData.month })
    .from(plMonthlyData)
    .where(sql`${plMonthlyData.locationId} = ${locationId}`)
    .distinct();
  
  return result.map((r: { month: string }) => r.month).sort();
}

// Function to get P&L data by month
export async function getPLDataByMonth(
  locationId: string,
  month: string
): Promise<typeof plMonthlyData.$inferSelect[]> {
  return db
    .select()
    .from(plMonthlyData)
    .where(sql`${plMonthlyData.locationId} = ${locationId} AND ${plMonthlyData.month} = ${month}`)
    .execute();
}

// Function to get summary by category for a month
export async function getPLSummaryByCategory(
  locationId: string,
  month: string
): Promise<{ category: string; total: number }[]> {
  const result = await db
    .select({
      category: plMonthlyData.category,
      total: sql<number>`SUM(${plMonthlyData.amount})`
    })
    .from(plMonthlyData)
    .where(sql`${plMonthlyData.locationId} = ${locationId} AND ${plMonthlyData.month} = ${month}`)
    .groupBy(plMonthlyData.category)
    .execute();
  
  return result;
}
