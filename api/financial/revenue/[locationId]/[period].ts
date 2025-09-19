import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../../../../server/storage';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { locationId, period } = req.query;
    
    if (!locationId || !period || Array.isArray(locationId) || Array.isArray(period)) {
      return res.status(400).json({ message: "Invalid parameters" });
    }

    const finalLocationId = locationId === "all" ? undefined : locationId.toLowerCase();
    const revenueData = await storage.getFinancialRevenueData(finalLocationId, period.toUpperCase());
    
    res.status(200).json(revenueData);
  } catch (error: any) {
    console.error("Error fetching financial revenue data:", error);
    res.status(500).json({ message: "Failed to fetch financial revenue data" });
  }
}
