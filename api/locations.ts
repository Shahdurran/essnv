import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Mock data for now to test the API structure
    const locations = [
      {
        id: "fairfax",
        name: "Fairfax Office",
        address: "123 Main St, Fairfax, VA",
        phone: "(555) 123-4567"
      },
      {
        id: "gainesville", 
        name: "Gainesville Office",
        address: "456 Oak Ave, Gainesville, VA",
        phone: "(555) 987-6543"
      }
    ];
    
    res.status(200).json(locations);
  } catch (error: any) {
    console.error("Error fetching practice locations:", error);
    res.status(500).json({ message: "Failed to fetch practice locations" });
  }
}
