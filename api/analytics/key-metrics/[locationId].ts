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
    const { locationId } = req.query;
    const { timeRange = "1" } = req.query;

    console.log(`[API] Key Metrics Request: ${req.method} ${req.url}`);
    console.log(`[API] Params - Location: ${locationId}, TimeRange: ${timeRange}`);

    // Mock key metrics data
    const keyMetrics = {
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
      locationId: locationId || "all",
      timeRange: timeRange,
      lastUpdated: new Date().toISOString()
    };

    console.log(`[API] Key Metrics Response: ${JSON.stringify(keyMetrics, null, 2)}`);

    return res.status(200).json(keyMetrics);

  } catch (error: any) {
    console.error('Error in key metrics API:', error);
    return res.status(500).json({ 
      message: 'Failed to fetch key metrics data',
      error: error.message 
    });
  }
}
