import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { plMonthlyData, practiceLocations } from '@shared/schema';
import type { InsertPlMonthlyData } from '@shared/schema';
import * as fs from 'fs';
import * as path from 'path';

// Database connection setup
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

/**
 * CSV Import Script for P&L Monthly Data
 * ======================================
 * 
 * This script parses the uploaded P&L CSV file and imports it into the database.
 * The CSV contains monthly financial data from Sep-2024 to Aug-2025.
 * 
 * Data Structure:
 * - Revenue items: Office Visits, Diagnostics, Cataract Surgeries, etc.
 * - Direct Costs: Drug Acquisition, Surgical Supplies, etc. (negative amounts)
 * - Operating Expenses: Staff Wages, Rent, Technology, etc. (negative amounts)
 * - Calculated Totals: Total Revenue, Gross Profit, EBITDA
 */

// Define the category mapping for each line item
const CATEGORY_MAPPING = {
  // Revenue items (positive amounts)
  'Office Visits': 'revenue',
  'Diagnostics & Minor Procedures': 'revenue', 
  'Cataract Surgeries': 'revenue',
  'Intravitreal Injections': 'revenue',
  'Refractive Cash': 'revenue',
  'Corneal Procedures': 'revenue',
  'Oculoplastics': 'revenue',
  'Optical / Contact Lens Sales': 'revenue',
  
  // Direct costs (negative amounts)
  'Drug Acquisition (injections)': 'direct_costs',
  'Surgical Supplies & IOLs': 'direct_costs',
  'Optical Cost of Goods': 'direct_costs',
  
  // Operating expenses (negative amounts)
  'Bad Debt Expense ': 'operating_expenses', // Note the trailing space in CSV
  'Staff Wages & Benefits': 'operating_expenses',
  'Billing & Coding Vendors': 'operating_expenses',
  'Rent & Utilities': 'operating_expenses',
  'Technology': 'operating_expenses',
  'Insurance': 'operating_expenses',
  'Equipment Service & Leases': 'operating_expenses',
  'Marketing & Outreach': 'operating_expenses',
  'Office & Miscellaneous': 'operating_expenses',
  
  // Calculated totals
  'Total Revenue': 'calculated_totals',
  'Total Direct Costs': 'calculated_totals',
  'Gross Profit': 'calculated_totals',
  'Total Operating Expenses': 'calculated_totals',
  'EBITDA': 'calculated_totals'
} as const;

// Month headers from the CSV (columns 1-12)
const MONTH_HEADERS = [
  'Sep-2024', 'Oct-2024', 'Nov-2024', 'Dec-2024',
  'Jan-2025', 'Feb-2025', 'Mar-2025', 'Apr-2025', 
  'May-2025', 'Jun-2025', 'Jul-2025', 'Aug-2025'
];

// Convert month-year format to database format
function convertMonthFormat(monthYear: string): string {
  const [month, year] = monthYear.split('-');
  const monthMap: Record<string, string> = {
    'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12',
    'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
    'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08'
  };
  return `${year}-${monthMap[month]}`;
}

// Parse CSV line and extract values
function parseCsvLine(line: string): string[] {
  // Handle CSV parsing with potential commas in quoted strings
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

// Main import function
async function importCsvData(): Promise<void> {
  console.log('Starting CSV import...');
  
  // First, get the first practice location to associate data with
  const locations = await db.select().from(practiceLocations).limit(1);
  let locationId: string;
  
  if (locations.length === 0) {
    console.log('No practice locations found, creating default location...');
    const newLocation = await db.insert(practiceLocations).values({
      name: 'Eye Specialists & Surgeons of Northern Virginia',
      address: '123 Medical Plaza Drive',
      city: 'Fairfax',
      state: 'VA',
      zipCode: '22030',
      phone: '555-0100',
      isActive: true
    }).returning();
    locationId = newLocation[0].id;
  } else {
    locationId = locations[0].id;
  }
  
  // Read the CSV file
  const csvPath = path.join(process.cwd(), 'attached_assets', 'PL_1757878346682.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n').filter(line => line.trim());
  
  // Parse header line (skip the BOM and get month columns)
  const headerLine = lines[0].replace(/^\ufeff/, ''); // Remove BOM
  const headers = parseCsvLine(headerLine);
  
  console.log('CSV headers:', headers);
  console.log('Expected months:', MONTH_HEADERS);
  
  // Prepare data for batch insert
  const insertData: InsertPlMonthlyData[] = [];
  
  // Process each data line (skip header)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    const values = parseCsvLine(line);
    const lineItem = values[0];
    
    // Skip if we don't recognize this line item
    if (!(lineItem in CATEGORY_MAPPING)) {
      console.log(`Skipping unknown line item: ${lineItem}`);
      continue;
    }
    
    const categoryType = CATEGORY_MAPPING[lineItem as keyof typeof CATEGORY_MAPPING];
    
    // Process each month's data
    for (let monthIndex = 0; monthIndex < MONTH_HEADERS.length; monthIndex++) {
      const monthYear = MONTH_HEADERS[monthIndex];
      const amountStr = values[monthIndex + 1]; // +1 because first column is line item
      
      if (!amountStr || amountStr.trim() === '') continue;
      
      // Parse amount (remove commas, handle negative values)
      const amount = parseFloat(amountStr.replace(/,/g, ''));
      if (isNaN(amount)) {
        console.log(`Invalid amount for ${lineItem} in ${monthYear}: ${amountStr}`);
        continue;
      }
      
      insertData.push({
        locationId,
        lineItem,
        categoryType,
        monthYear: convertMonthFormat(monthYear),
        amount: amount.toString()
      });
    }
  }
  
  console.log(`Prepared ${insertData.length} records for insert`);
  
  // Clear existing data for this location (if any)
  await db.delete(plMonthlyData);
  console.log('Cleared existing P&L data');
  
  // Batch insert the data (split into chunks if needed)
  const chunkSize = 100;
  for (let i = 0; i < insertData.length; i += chunkSize) {
    const chunk = insertData.slice(i, i + chunkSize);
    await db.insert(plMonthlyData).values(chunk);
    console.log(`Inserted chunk ${Math.floor(i / chunkSize) + 1}/${Math.ceil(insertData.length / chunkSize)}`);
  }
  
  console.log('CSV import completed successfully!');
  
  // Verify the import by showing some sample data
  const sampleData = await db.select().from(plMonthlyData).limit(5);
  console.log('Sample imported data:', sampleData);
}

// Run the import if this file is executed directly
// In ES modules, we check if the module URL matches the main module URL
if (import.meta.url === `file://${process.argv[1]}`) {
  importCsvData()
    .then(() => {
      console.log('Import process finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Import failed:', error);
      process.exit(1);
    });
}

export { importCsvData };