import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../../server/storage';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Extract locationId and period from the URL path
    const url = new URL(req.url!, `https://${req.headers.host}`);
    const pathParts = url.pathname.split('/').filter(part => part);
    
    // Expected path: /api/financial/revenue/{locationId}/{period}
    const locationIdIndex = pathParts.indexOf('revenue') + 1;
    const periodIndex = locationIdIndex + 1;
    
    const locationId = pathParts[locationIdIndex];
    const period = pathParts[periodIndex];
    
    if (!locationId || !period) {
      return res.status(400).json({ 
        message: "Missing required parameters: locationId and period",
        received: { locationId, period },
        path: url.pathname
      });
    }

    const finalLocationId = locationId === "all" ? undefined : locationId.toLowerCase();
    const revenueData = await storage.getFinancialRevenueData(finalLocationId, period.toUpperCase());
    
    res.status(200).json(revenueData);
  } catch (error: any) {
    console.error("Error fetching financial revenue data:", error);
    res.status(500).json({ 
      message: "Failed to fetch financial revenue data",
      error: error.message 
    });
  }
}
