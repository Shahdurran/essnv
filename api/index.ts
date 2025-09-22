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

  try {
    // Import the storage module to get the data
    const { storage } = await import('../server/storage');

    // Route the request based on the path
    const path = req.url || '/';
    const method = req.method || 'GET';

    console.log(`[VERCEL API] ${method} ${path}`);

    // Handle health check
    if (path === '/health' || path === '/') {
      return res.status(200).json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        service: "MDS AI Analytics",
        uptime: 0
      });
    }

    // Handle API routes
    if (path.startsWith('/api/')) {
      // Locations endpoint
      if (path === '/api/locations' && method === 'GET') {
        const locations = await storage.getAllPracticeLocations();
        console.log(`[VERCEL API] Locations response: ${JSON.stringify(locations).substring(0, 100)}...`);
        return res.status(200).json(locations);
      }

      // Financial revenue endpoint
      if (path.match(/^\/api\/financial\/revenue\/[^\/]+\/[^\/]+$/) && method === 'GET') {
        const pathParts = path.split('/');
        const locationId = pathParts[3];
        const period = pathParts[4];
        const finalLocationId = locationId === 'all' ? undefined : locationId.toLowerCase();
        const revenueData = await storage.getFinancialRevenueData(finalLocationId, period.toUpperCase());
        console.log(`[VERCEL API] Revenue response: ${JSON.stringify(revenueData).substring(0, 100)}...`);
        return res.status(200).json(revenueData);
      }

      // Financial expenses endpoint
      if (path.match(/^\/api\/financial\/expenses\/[^\/]+\/[^\/]+$/) && method === 'GET') {
        const pathParts = path.split('/');
        const locationId = pathParts[3];
        const period = pathParts[4];
        const finalLocationId = locationId === 'all' ? undefined : locationId.toLowerCase();
        const expensesData = await storage.getFinancialExpensesData(finalLocationId, period.toUpperCase());
        return res.status(200).json(expensesData);
      }

      // Financial cashflow endpoint
      if (path.match(/^\/api\/financial\/cashflow\/[^\/]+\/[^\/]+$/) && method === 'GET') {
        const pathParts = path.split('/');
        const locationId = pathParts[3];
        const period = pathParts[4];
        const finalLocationId = locationId === 'all' ? undefined : locationId.toLowerCase();
        const cashFlowData = await storage.getCashFlowData(finalLocationId, period.toUpperCase());
        return res.status(200).json(cashFlowData);
      }

      // Financial profit-loss endpoint
      if (path.match(/^\/api\/financial\/profit-loss\/[^\/]+\/[^\/]+$/) && method === 'GET') {
        const pathParts = path.split('/');
        const locationId = pathParts[3];
        const period = pathParts[4];
        const finalLocationId = locationId === 'all' ? undefined : locationId.toLowerCase();
        const profitLossData = await storage.getProfitLossData(finalLocationId, period.toUpperCase());
        return res.status(200).json(profitLossData);
      }

      // AI popular questions endpoint
      if (path === '/api/ai/popular-questions' && method === 'GET') {
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
        return res.status(200).json(popularQuestions);
      }

      // Default API response
      console.log(`[VERCEL API] 404 - Endpoint not found: ${path}`);
      return res.status(404).json({ message: "API endpoint not found", path });
    }

    // For non-API routes, return a simple HTML page
    return res.status(200).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>MDS AI Analytics</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; text-align: center; }
          .container { max-width: 600px; margin: 0 auto; }
          .success { color: #4caf50; margin: 20px 0; }
          .info { color: #1976d2; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>MDS AI Analytics</h1>
          <div class="success">✅ Server is running successfully!</div>
          <div class="info">API endpoints are available at <a href="/api/locations">/api/locations</a></div>
          <div class="info">Health check: <a href="/health">/health</a></div>
        </div>
      </body>
      </html>
    `);

  } catch (error: any) {
    console.error('Error handling request:', error);
    return res.status(500).json({ 
      message: "Internal server error",
      error: error.message,
      stack: error.stack
    });
  }
}
