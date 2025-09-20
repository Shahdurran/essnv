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
    // Mock data for practice locations - matches the structure expected by the frontend
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
      },
      {
        id: "manassas",
        name: "Manassas Office",
        address: "789 Pine St, Manassas, VA",
        phone: "(555) 456-7890"
      },
      {
        id: "leesburg",
        name: "Leesburg Office",
        address: "321 Elm St, Leesburg, VA",
        phone: "(555) 234-5678"
      },
      {
        id: "reston",
        name: "Reston Office",
        address: "654 Maple Ave, Reston, VA",
        phone: "(555) 345-6789"
      }
    ];
    
    console.log(`[API] Locations Request: ${req.method} ${req.url}`);
    console.log(`[API] Response: ${JSON.stringify(locations, null, 2)}`);
    
    return res.status(200).json(locations);
  } catch (error: any) {
    console.error("Error fetching practice locations:", error);
    return res.status(500).json({ 
      message: "Failed to fetch practice locations",
      error: error.message 
    });
  }
}
