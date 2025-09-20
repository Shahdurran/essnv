import type { VercelRequest, VercelResponse } from '@vercel/node';

// Import the storage module - we'll need to create a simplified version for Vercel
// For now, let's create mock data that matches the expected structure

interface RevenueData {
  categories: Array<{
    name: string;
    value: number;
    percentage: number;
    trend: 'up' | 'down' | 'stable';
    change: number;
  }>;
  totalRevenue: number;
  period: string;
  locationId: string;
  lastUpdated: string;
}

// Mock data for different locations and periods
const mockRevenueData: Record<string, Record<string, RevenueData>> = {
  all: {
    '1Y': {
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
      period: '1Y',
      locationId: 'all',
      lastUpdated: new Date().toISOString()
    },
    '6M': {
      categories: [
        {
          name: 'Medical Procedures',
          value: 1225000,
          percentage: 65.2,
          trend: 'up',
          change: 8.5
        },
        {
          name: 'Cosmetic Procedures',
          value: 490000,
          percentage: 26.1,
          trend: 'up',
          change: 12.3
        },
        {
          name: 'Refractive Surgery',
          value: 165000,
          percentage: 8.7,
          trend: 'stable',
          change: 2.1
        }
      ],
      totalRevenue: 1880000,
      period: '6M',
      locationId: 'all',
      lastUpdated: new Date().toISOString()
    },
    '3M': {
      categories: [
        {
          name: 'Medical Procedures',
          value: 612500,
          percentage: 65.2,
          trend: 'up',
          change: 8.5
        },
        {
          name: 'Cosmetic Procedures',
          value: 245000,
          percentage: 26.1,
          trend: 'up',
          change: 12.3
        },
        {
          name: 'Refractive Surgery',
          value: 82500,
          percentage: 8.7,
          trend: 'stable',
          change: 2.1
        }
      ],
      totalRevenue: 940000,
      period: '3M',
      locationId: 'all',
      lastUpdated: new Date().toISOString()
    },
    '1M': {
      categories: [
        {
          name: 'Medical Procedures',
          value: 204167,
          percentage: 65.2,
          trend: 'up',
          change: 8.5
        },
        {
          name: 'Cosmetic Procedures',
          value: 81667,
          percentage: 26.1,
          trend: 'up',
          change: 12.3
        },
        {
          name: 'Refractive Surgery',
          value: 27500,
          percentage: 8.7,
          trend: 'stable',
          change: 2.1
        }
      ],
      totalRevenue: 313334,
      period: '1M',
      locationId: 'all',
      lastUpdated: new Date().toISOString()
    }
  },
  fairfax: {
    '1Y': {
      categories: [
        {
          name: 'Medical Procedures',
          value: 980000,
          percentage: 65.2,
          trend: 'up',
          change: 8.5
        },
        {
          name: 'Cosmetic Procedures',
          value: 392000,
          percentage: 26.1,
          trend: 'up',
          change: 12.3
        },
        {
          name: 'Refractive Surgery',
          value: 132000,
          percentage: 8.7,
          trend: 'stable',
          change: 2.1
        }
      ],
      totalRevenue: 1504000,
      period: '1Y',
      locationId: 'fairfax',
      lastUpdated: new Date().toISOString()
    }
  },
  gainesville: {
    '1Y': {
      categories: [
        {
          name: 'Medical Procedures',
          value: 735000,
          percentage: 65.2,
          trend: 'up',
          change: 8.5
        },
        {
          name: 'Cosmetic Procedures',
          value: 294000,
          percentage: 26.1,
          trend: 'up',
          change: 12.3
        },
        {
          name: 'Refractive Surgery',
          value: 99000,
          percentage: 8.7,
          trend: 'stable',
          change: 2.1
        }
      ],
      totalRevenue: 1128000,
      period: '1Y',
      locationId: 'gainesville',
      lastUpdated: new Date().toISOString()
    }
  }
};

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

    const normalizedLocationId = locationId.toString().toLowerCase();
    const normalizedPeriod = period.toString().toUpperCase();

    // Get data for the requested location and period
    let revenueData: RevenueData | undefined;

    if (normalizedLocationId === 'all') {
      revenueData = mockRevenueData.all[normalizedPeriod];
    } else {
      // For specific locations, try to get their data or fall back to 'all' data
      const locationData = mockRevenueData[normalizedLocationId];
      if (locationData && locationData[normalizedPeriod]) {
        revenueData = locationData[normalizedPeriod];
      } else {
        // Fall back to 'all' data if specific location/period not found
        revenueData = mockRevenueData.all[normalizedPeriod];
        if (revenueData) {
          // Adjust the locationId in the response
          revenueData = {
            ...revenueData,
            locationId: normalizedLocationId
          };
        }
      }
    }

    if (!revenueData) {
      return res.status(404).json({ 
        message: `No revenue data found for location: ${locationId}, period: ${period}` 
      });
    }

    // Log the request for debugging
    console.log(`[API] Financial Revenue Request: ${normalizedLocationId}/${normalizedPeriod}`);
    console.log(`[API] Response: ${JSON.stringify(revenueData, null, 2)}`);

    return res.status(200).json(revenueData);

  } catch (error: any) {
    console.error('Error in financial revenue API:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
}
