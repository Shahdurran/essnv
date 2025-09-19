import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../server/storage';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const locations = await storage.getAllPracticeLocations();
    res.status(200).json(locations);
  } catch (error: any) {
    console.error("Error fetching practice locations:", error);
    res.status(500).json({ message: "Failed to fetch practice locations" });
  }
}
