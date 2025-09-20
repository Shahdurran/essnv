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

    console.log(`[API] Insurance Breakdown Request: ${req.method} ${req.url}`);
    console.log(`[API] Params - Location: ${locationId}, TimeRange: ${timeRange}`);

    // Mock insurance breakdown data
    const insuranceBreakdown = [
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
    ];

    const response = {
      breakdown: insuranceBreakdown,
      totalAmount: 3760000,
      avgARDays: 44.6,
      overallDenialRate: 0.08,
      locationId: locationId || "all",
      timeRange: timeRange,
      lastUpdated: new Date().toISOString()
    };

    console.log(`[API] Insurance Breakdown Response: ${JSON.stringify(response, null, 2)}`);

    return res.status(200).json(response);

  } catch (error: any) {
    console.error('Error in insurance breakdown API:', error);
    return res.status(500).json({ 
      message: 'Failed to fetch insurance breakdown data',
      error: error.message 
    });
  }
}
