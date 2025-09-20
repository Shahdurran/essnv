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

    console.log(`[API] Cash Flow Request: ${req.method} ${req.url}`);
    console.log(`[API] Params - Location: ${locationId}, Period: ${period}`);

    // Mock cash flow data
    const cashFlowData = {
      cashIn: [
        {
          category: 'Patient Payments',
          amount: 2800000,
          percentage: 74.5,
          trend: 'up',
          change: 8.2
        },
        {
          category: 'Insurance Payments',
          amount: 850000,
          percentage: 22.6,
          trend: 'stable',
          change: 2.1
        },
        {
          category: 'Other Income',
          amount: 110000,
          percentage: 2.9,
          trend: 'up',
          change: 15.3
        }
      ],
      cashOut: [
        {
          category: 'Staff Salaries',
          amount: 450000,
          percentage: 35.2,
          trend: 'up',
          change: 5.2
        },
        {
          category: 'Medical Supplies',
          amount: 180000,
          percentage: 14.1,
          trend: 'stable',
          change: 2.1
        },
        {
          category: 'Equipment & Technology',
          amount: 120000,
          percentage: 9.4,
          trend: 'up',
          change: 8.7
        },
        {
          category: 'Facility Costs',
          amount: 200000,
          percentage: 15.6,
          trend: 'stable',
          change: 1.5
        },
        {
          category: 'Other Operating Expenses',
          amount: 330000,
          percentage: 25.7,
          trend: 'stable',
          change: 3.2
        }
      ],
      netCashFlow: 2480000,
      period: period.toString().toUpperCase(),
      locationId: locationId.toString(),
      lastUpdated: new Date().toISOString()
    };

    console.log(`[API] Cash Flow Response: ${JSON.stringify(cashFlowData, null, 2)}`);

    return res.status(200).json(cashFlowData);

  } catch (error: any) {
    console.error('Error in cash flow API:', error);
    return res.status(500).json({ 
      message: 'Failed to fetch cash flow data',
      error: error.message 
    });
  }
}
