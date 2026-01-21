import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed. Use GET.' });
  }

  try {
    const { locationId } = req.query;
    
    // Mock data - in production, this would come from your database
    const mockData = {
      providers: [
        { name: 'Dr. John Josephson', percentage: 19, amount: 450000 },
        { name: 'Dr. Meghan G. Moroux', percentage: 14, amount: 332000 },
        { name: 'Dr. Hubert H. Pham', percentage: 13, amount: 308000 },
        { name: 'Dr. Sabita Ittoop', percentage: 10, amount: 237000 },
        { name: 'Dr. Kristen E. Dunbar', percentage: 9, amount: 213000 },
        { name: 'Dr. Erin Ong', percentage: 9, amount: 213000 },
        { name: 'Dr. Prema Modak', percentage: 8, amount: 190000 },
        { name: 'Dr. Julia Pierce', percentage: 7, amount: 166000 },
        { name: 'Dr. Heloi Stark', percentage: 6, amount: 142000 },
        { name: 'Dr. Noushin Sahraei', percentage: 5, amount: 118000 }
      ],
      totalCollections: 2369000,
      locationId: locationId || 'all'
    };

    return res.status(200).json(mockData);
  } catch (error: any) {
    console.error('[API] Collections breakdown error:', error);
    return res.status(500).json({ 
      message: 'Failed to fetch collections breakdown',
      error: error.message 
    });
  }
}

