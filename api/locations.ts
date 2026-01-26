import type { VercelRequest, VercelResponse } from '@vercel/node';

// In-memory storage for locations (in production, this would be a database)
let LOCATIONS = [
  {
    id: "fairfax",
    name: "Fairfax",
    address: "10721 Main St, Suite 2200, Fairfax, VA 22030",
    phone: "(571) 445-0001",
    isActive: true
  },
  {
    id: "gainesville", 
    name: "Falls Church",
    address: "7601 Heritage Dr, Suite 330, Falls Church, VA 20155",
    phone: "(571) 445-0002",
    isActive: true
  },
  {
    id: "manassas",
    name: "Woodbridge",
    address: "2700 Potomac Mills Circle, Woodbridge, VA 22192",
    phone: "(571) 445-0003",
    isActive: true
  },
  {
    id: "leesburg",
    name: "Stafford",
    address: "2900 Gordon Shelton Blvd, Stafford, VA 22554",
    phone: "(571) 445-0004",
    isActive: true
  },
  {
    id: "reston",
    name: "Lorton",
    address: "9000 Lorton Station Blvd, Lorton, VA 22079",
    phone: "(571) 445-0005",
    isActive: true
  },
  {
    id: "bealeton",
    name: "Bealeton",
    address: "11445 Marsh Rd, Bealeton, VA 22712",
    phone: "(571) 445-0006",
    isActive: true
  }
];

// Helper function to generate ID from name
function generateId(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

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
    console.log(`[LOCATIONS API] Request: ${req.method} ${req.url}`);

    // GET /api/locations - List all locations
    if (req.method === 'GET') {
      return res.status(200).json(LOCATIONS);
    }

    // POST /api/locations - Create new location
    if (req.method === 'POST') {
      const locationData = req.body;

      if (!locationData.name || !locationData.address) {
        return res.status(400).json({ message: 'Name and address are required' });
      }

      const newLocation = {
        id: locationData.id || generateId(locationData.name),
        name: locationData.name,
        address: locationData.address,
        phone: locationData.phone || null,
        isActive: locationData.isActive !== undefined ? locationData.isActive : true
      };

      // Check if location with this ID already exists
      if (LOCATIONS.find(loc => loc.id === newLocation.id)) {
        return res.status(409).json({ message: 'Location with this ID already exists' });
      }

      LOCATIONS.push(newLocation);
      console.log(`[LOCATIONS API] Created location:`, newLocation);
      return res.status(201).json(newLocation);
    }

    // PUT /api/locations - Update location
    if (req.method === 'PUT') {
      const updates = req.body;
      const locationId = updates.id;
      
      if (!locationId) {
        return res.status(400).json({ message: 'Location ID is required in request body' });
      }

      const locationIndex = LOCATIONS.findIndex(loc => loc.id === locationId);
      
      if (locationIndex === -1) {
        return res.status(404).json({ message: 'Location not found' });
      }

      LOCATIONS[locationIndex] = {
        ...LOCATIONS[locationIndex],
        ...updates,
        id: locationId // Don't allow ID changes
      };

      console.log(`[LOCATIONS API] Updated location:`, LOCATIONS[locationIndex]);
      return res.status(200).json(LOCATIONS[locationIndex]);
    }

    // DELETE /api/locations - Delete location (ID in body)
    if (req.method === 'DELETE') {
      const { id: locationId } = req.body;
      
      if (!locationId) {
        return res.status(400).json({ message: 'Location ID is required in request body' });
      }

      const locationIndex = LOCATIONS.findIndex(loc => loc.id === locationId);
      
      if (locationIndex === -1) {
        return res.status(404).json({ message: 'Location not found' });
      }

      const deletedLocation = LOCATIONS[locationIndex];
      LOCATIONS.splice(locationIndex, 1);
      
      console.log(`[LOCATIONS API] Deleted location:`, deletedLocation);
      return res.status(200).json({ message: 'Location deleted successfully', location: deletedLocation });
    }

    return res.status(405).json({ message: 'Method not allowed' });

  } catch (error: any) {
    console.error("[LOCATIONS API] Error:", error);
    return res.status(500).json({ 
      message: "Failed to process location request",
      error: error.message 
    });
  }
}
