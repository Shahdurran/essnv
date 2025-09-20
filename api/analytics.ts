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

    console.log(`[API] Analytics Request: ${req.method} ${pathname}`);
    console.log(`[API] Query params:`, Object.fromEntries(searchParams.entries()));

    // Parse the path to determine which analytics endpoint
    const pathParts = pathname.split('/').filter(Boolean);
    const endpoint = pathParts[pathParts.length - 1];
    const locationId = pathParts[pathParts.length - 2] || searchParams.get('locationId') || 'all';
    const timeRange = searchParams.get('timeRange') || '1';

    let response;

    switch (endpoint) {
      case 'key-metrics':
        response = {
          totalRevenue: 3760000,
          totalPatients: 1250,
          avgRevenuePerPatient: 3008,
          patientSatisfaction: 4.7,
          arDays: 45,
          denialRate: 0.08,
          newPatients: 180,
          returningPatients: 1070,
          topProcedure: "Cataract Surgery",
          revenueGrowth: 8.5,
          patientGrowth: 12.3,
          locationId: locationId,
          timeRange: timeRange,
          lastUpdated: new Date().toISOString()
        };
        break;

      case 'insurance-breakdown':
        response = {
          breakdown: [
            {
              payer: "Medicare",
              percentage: 35,
              amount: 1316000,
              arDays: 42,
              denialRate: 0.05,
              trend: "stable"
            },
            {
              payer: "Blue Cross Blue Shield",
              percentage: 25,
              amount: 940000,
              arDays: 38,
              denialRate: 0.06,
              trend: "up"
            },
            {
              payer: "Aetna",
              percentage: 20,
              amount: 752000,
              arDays: 45,
              denialRate: 0.08,
              trend: "stable"
            },
            {
              payer: "Cigna",
              percentage: 12,
              amount: 451200,
              arDays: 50,
              denialRate: 0.10,
              trend: "down"
            },
            {
              payer: "UnitedHealth",
              percentage: 8,
              amount: 300800,
              arDays: 48,
              denialRate: 0.12,
              trend: "stable"
            }
          ],
          totalAmount: 3760000,
          avgARDays: 44.6,
          overallDenialRate: 0.08,
          locationId: locationId,
          timeRange: timeRange,
          lastUpdated: new Date().toISOString()
        };
        break;

      case 'ar-buckets':
        response = [
          {
            bucket: "0-30 days",
            amount: 450000,
            percentage: 35.2,
            count: 125
          },
          {
            bucket: "31-60 days",
            amount: 320000,
            percentage: 25.0,
            count: 89
          },
          {
            bucket: "61-90 days",
            amount: 280000,
            percentage: 21.9,
            count: 78
          },
          {
            bucket: "91-120 days",
            amount: 150000,
            percentage: 11.7,
            count: 42
          },
          {
            bucket: "120+ days",
            amount: 80000,
            percentage: 6.2,
            count: 22
          }
        ];
        break;

      case 'patient-billing':
        response = {
          totalBilled: 4200000,
          totalCollected: 3760000,
          collectionRate: 0.895,
          avgDaysToPayment: 45,
          outstandingAmount: 440000,
          locationId: locationId,
          timeRange: timeRange,
          lastUpdated: new Date().toISOString()
        };
        break;

      case 'insurance-claims':
        response = [
          {
            status: "Submitted",
            count: 450,
            amount: 1800000,
            percentage: 45.0
          },
          {
            status: "Paid",
            count: 320,
            amount: 1280000,
            percentage: 32.0
          },
          {
            status: "Pending",
            count: 180,
            amount: 720000,
            percentage: 18.0
          },
          {
            status: "Denied",
            count: 50,
            amount: 200000,
            percentage: 5.0
          }
        ];
        break;

      case 'projections':
        response = {
          patientVolume: {
            current: 1250,
            projected: 1380,
            growth: 10.4
          },
          revenue: {
            current: 3760000,
            projected: 4150000,
            growth: 10.4
          },
          locationId: locationId,
          lastUpdated: new Date().toISOString()
        };
        break;

      case 'clinical-metrics':
        response = {
          revenue: 3760000,
          patientCount: 1250,
          ebitda: 1200000,
          writeOffs: 150000,
          locationId: locationId,
          period: timeRange,
          lastUpdated: new Date().toISOString()
        };
        break;

      default:
        return res.status(404).json({ message: 'Analytics endpoint not found' });
    }

    console.log(`[API] Analytics Response: ${JSON.stringify(response, null, 2)}`);

    return res.status(200).json(response);

  } catch (error: any) {
    console.error('Error in analytics API:', error);
    return res.status(500).json({ 
      message: 'Failed to fetch analytics data',
      error: error.message 
    });
  }
}
