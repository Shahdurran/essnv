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
        name: "Fairfax",
        address: "10721 Main St, Suite 2200, Fairfax, VA 22030",
        phone: "(571) 445-0001"
      },
      {
        id: "gainesville", 
        name: "Falls Church",
        address: "7601 Heritage Dr, Suite 330, Falls Church, VA 20155",
        phone: "(571) 445-0002"
      },
      {
        id: "manassas",
        name: "Woodbridge",
        address: "2700 Potomac Mills Circle, Woodbridge, VA 22192",
        phone: "(571) 445-0003"
      },
      {
        id: "leesburg",
        name: "Stafford",
        address: "2900 Gordon Shelton Blvd, Stafford, VA 22554",
        phone: "(571) 445-0004"
      },
      {
        id: "reston",
        name: "Lorton",
        address: "9000 Lorton Station Blvd, Lorton, VA 22079",
        phone: "(571) 445-0005"
      },
      {
        id: "bealeton",
        name: "Bealeton",
        address: "11445 Marsh Rd, Bealeton, VA 22712",
        phone: "(571) 445-0006"
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
