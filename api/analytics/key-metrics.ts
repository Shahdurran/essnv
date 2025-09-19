import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../../server/storage';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Extract locationId from the URL path
    const url = new URL(req.url!, `https://${req.headers.host}`);
    const pathParts = url.pathname.split('/').filter(part => part);
    
    // Expected path: /api/analytics/key-metrics/{locationId}
    const locationIdIndex = pathParts.indexOf('key-metrics') + 1;
    const locationId = pathParts[locationIdIndex];
    
    // Get timeRange from query params
    const timeRange = req.query.timeRange as string || "1";
    
    if (!locationId) {
      return res.status(400).json({ 
        message: "Missing required parameter: locationId",
        received: { locationId },
        path: url.pathname
      });
    }

    const finalLocationId = locationId === "all" ? undefined : locationId;
    const metrics = await storage.getKeyMetrics(finalLocationId, parseInt(timeRange));
    
    res.status(200).json(metrics);
  } catch (error: any) {
    console.error("Error fetching key metrics:", error);
    res.status(500).json({ 
      message: "Failed to fetch key metrics data",
      error: error.message 
    });
  }
}
