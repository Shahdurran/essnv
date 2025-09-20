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
    const popularQuestions = [
      {
        id: "patient-forecast",
        question: "Patient forecast for next month",
        icon: "chart-line",
        category: "forecasting",
      },
      {
        id: "top-revenue",
        question: "Top revenue procedures this quarter",
        icon: "dollar-sign",
        category: "revenue",
      },
      {
        id: "ar-days",
        question: "AR days by insurance payer",
        icon: "clock",
        category: "operations",
      },
      {
        id: "lasik-analytics",
        question: "LASIK surgery analytics",
        icon: "zap",
        category: "procedures",
      },
      {
        id: "refractive-vs-medical",
        question: "Bad debt analysis",
        icon: "balance-scale",
        category: "revenue",
      },
      {
        id: "best-location",
        question: "Best performing location",
        icon: "trophy",
        category: "locations",
      },
    ];

    console.log(`[API] Popular Questions Request: ${req.method} ${req.url}`);
    console.log(`[API] Response: ${JSON.stringify(popularQuestions, null, 2)}`);

    return res.status(200).json(popularQuestions);

  } catch (error: any) {
    console.error('Error in popular questions API:', error);
    return res.status(500).json({ 
      message: 'Failed to fetch popular questions',
      error: error.message 
    });
  }
}

