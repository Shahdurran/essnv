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
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const pathname = url.pathname;
    const searchParams = url.searchParams;

    console.log(`[API] Financial Request: ${req.method} ${pathname}`);
    console.log(`[API] Query params:`, Object.fromEntries(searchParams.entries()));

    // Parse the path to determine which financial endpoint
    const pathParts = pathname.split('/').filter(Boolean);
    const endpoint = pathParts[pathParts.length - 1];
    const locationId = pathParts[pathParts.length - 2] || searchParams.get('locationId') || 'all';
    const period = pathParts[pathParts.length - 1] || searchParams.get('period') || '1Y';

    // Validate period
    const validPeriods = ['1M', '3M', '6M', '1Y', 'CUSTOM'];
    if (!validPeriods.includes(period.toUpperCase())) {
      return res.status(400).json({ 
        message: `Invalid period. Must be one of: ${validPeriods.join(', ')}` 
      });
    }

    let response;

    switch (endpoint) {
      case 'revenue':
        response = {
          categories: [
            {
              name: 'Medical Procedures',
              value: 2450000,
              percentage: 65.2,
              trend: 'up',
              change: 8.5
            },
            {
              name: 'Cosmetic Procedures',
              value: 980000,
              percentage: 26.1,
              trend: 'up',
              change: 12.3
            },
            {
              name: 'Refractive Surgery',
              value: 330000,
              percentage: 8.7,
              trend: 'stable',
              change: 2.1
            }
          ],
          totalRevenue: 3760000,
          period: period.toUpperCase(),
          locationId: locationId,
          lastUpdated: new Date().toISOString()
        };
        break;

      case 'expenses':
        response = {
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
          period: period.toUpperCase(),
          locationId: locationId,
          lastUpdated: new Date().toISOString()
        };
        break;

      case 'cashflow':
        response = {
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
          period: period.toUpperCase(),
          locationId: locationId,
          lastUpdated: new Date().toISOString()
        };
        break;

      case 'profit-loss':
        response = {
          revenue: 3760000,
          expenses: 1280000,
          grossProfit: 2480000,
          netIncome: 2200000,
          period: period.toUpperCase(),
          locationId: locationId,
          lastUpdated: new Date().toISOString()
        };
        break;

      case 'cash-in':
        response = {
          categories: [
            {
              name: 'Patient Payments',
              amount: 2800000,
              percentage: 74.5,
              trend: 'up',
              change: 8.2
            },
            {
              name: 'Insurance Payments',
              amount: 850000,
              percentage: 22.6,
              trend: 'stable',
              change: 2.1
            },
            {
              name: 'Other Income',
              amount: 110000,
              percentage: 2.9,
              trend: 'up',
              change: 15.3
            }
          ],
          totalCashIn: 3760000,
          period: period.toUpperCase(),
          locationId: locationId,
          lastUpdated: new Date().toISOString()
        };
        break;

      case 'cash-out':
        response = {
          categories: [
            {
              name: 'Staff Salaries',
              amount: 450000,
              percentage: 35.2,
              trend: 'up',
              change: 5.2
            },
            {
              name: 'Medical Supplies',
              amount: 180000,
              percentage: 14.1,
              trend: 'stable',
              change: 2.1
            },
            {
              name: 'Equipment & Technology',
              amount: 120000,
              percentage: 9.4,
              trend: 'up',
              change: 8.7
            },
            {
              name: 'Facility Costs',
              amount: 200000,
              percentage: 15.6,
              trend: 'stable',
              change: 1.5
            },
            {
              name: 'Other Operating Expenses',
              amount: 330000,
              percentage: 25.7,
              trend: 'stable',
              change: 3.2
            }
          ],
          totalCashOut: 1280000,
          period: period.toUpperCase(),
          locationId: locationId,
          lastUpdated: new Date().toISOString()
        };
        break;

      default:
        return res.status(404).json({ message: 'Financial endpoint not found' });
    }

    console.log(`[API] Financial Response: ${JSON.stringify(response, null, 2)}`);

    return res.status(200).json(response);

  } catch (error: any) {
    console.error('Error in financial API:', error);
    return res.status(500).json({ 
      message: 'Failed to fetch financial data',
      error: error.message 
    });
  }
}
