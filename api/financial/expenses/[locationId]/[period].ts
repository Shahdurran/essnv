import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { locationId, period } = req.query;

    // Validate parameters
    if (!locationId || !period) {
      return res.status(400).json({ 
        message: 'Missing required parameters: locationId and period' 
      });
    }

    const validPeriods = ['1M', '3M', '6M', '1Y', 'CUSTOM'];
    if (!validPeriods.includes(period.toString().toUpperCase())) {
      return res.status(400).json({ 
        message: `Invalid period. Must be one of: ${validPeriods.join(', ')}` 
      });
    }

    console.log(`[API] Financial Expenses Request: ${req.method} ${req.url}`);
    console.log(`[API] Params - Location: ${locationId}, Period: ${period}`);

    // Mock expenses data
    const expensesData = {
      categories: [
        {
          name: 'Staff Salaries',
          value: 450000,
          percentage: 35.2,
          trend: 'up',
          change: 5.2
        },
        {
          name: 'Medical Supplies',
          value: 180000,
          percentage: 14.1,
          trend: 'stable',
          change: 2.1
        },
        {
          name: 'Equipment & Technology',
          value: 120000,
          percentage: 9.4,
          trend: 'up',
          change: 8.7
        },
        {
          name: 'Facility Costs',
          value: 200000,
          percentage: 15.6,
          trend: 'stable',
          change: 1.5
        },
        {
          name: 'Insurance & Legal',
          value: 80000,
          percentage: 6.3,
          trend: 'down',
          change: -2.3
        },
        {
          name: 'Marketing & Advertising',
          value: 60000,
          percentage: 4.7,
          trend: 'up',
          change: 12.5
        },
        {
          name: 'Other Operating Expenses',
          value: 190000,
          percentage: 14.9,
          trend: 'stable',
          change: 3.2
        }
      ],
      totalExpenses: 1280000,
      period: period.toString().toUpperCase(),
      locationId: locationId.toString(),
      lastUpdated: new Date().toISOString()
    };

    console.log(`[API] Financial Expenses Response: ${JSON.stringify(expensesData, null, 2)}`);

    return res.status(200).json(expensesData);

  } catch (error: any) {
    console.error('Error in financial expenses API:', error);
    return res.status(500).json({ 
      message: 'Failed to fetch financial expenses data',
      error: error.message 
    });
  }
}
