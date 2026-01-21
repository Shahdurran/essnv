import type { VercelRequest, VercelResponse } from '@vercel/node';

// Default dashboard configuration
const DEFAULT_CONFIG = {
  logoUrl: '/assets/MDS Logo_1754254040718-Dv0l5qLn.png',
  practiceName: 'MDS AI Analytics',
  practiceSubtitle: 'Eye Specialists & Surgeons',
  ownerName: 'Dr. John Josephson',
  ownerTitle: 'Medical Director',
  ownerPhotoUrl: '/assets/Dr. John Josephson_1757862871625-B4_CVazU.jpeg',
  revenueTitle: 'Revenue',
  expensesTitle: 'Expenses',
  cashInTitle: 'Cash In',
  cashOutTitle: 'Cash Out',
  topRevenueTitle: 'Top Revenue Procedures',
  showCollectionsWidget: true,
  providers: [
    { name: 'Dr. John Josephson', percentage: 19 },
    { name: 'Dr. Meghan G. Moroux', percentage: 14 },
    { name: 'Dr. Hubert H. Pham', percentage: 13 },
    { name: 'Dr. Sabita Ittoop', percentage: 10 },
    { name: 'Dr. Kristen E. Dunbar', percentage: 9 },
    { name: 'Dr. Erin Ong', percentage: 9 },
    { name: 'Dr. Prema Modak', percentage: 8 },
    { name: 'Dr. Julia Pierce', percentage: 7 },
    { name: 'Dr. Heloi Stark', percentage: 6 },
    { name: 'Dr. Noushin Sahraei', percentage: 5 }
  ],
  revenueSubheadings: {},
  expensesSubheadings: {},
  cashInSubheadings: {},
  cashOutSubheadings: {},
  cashFlowSubheadings: {},
  procedureNameOverrides: {},
  locationNameOverrides: {}
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      // Return default configuration
      console.log('[API] Fetching dashboard customization');
      return res.status(200).json(DEFAULT_CONFIG);
    }

    if (req.method === 'PUT') {
      // In a real implementation, you'd save this to a database
      // For now, just return the merged config
      const updates = req.body;
      console.log('[API] Updating dashboard customization:', Object.keys(updates));
      
      const updatedConfig = {
        ...DEFAULT_CONFIG,
        ...updates
      };
      
      return res.status(200).json(updatedConfig);
    }

    return res.status(405).json({ message: 'Method not allowed' });

  } catch (error: any) {
    console.error('[API] Customization error:', error);
    return res.status(500).json({ 
      message: 'Failed to handle customization request',
      error: error.message 
    });
  }
}

