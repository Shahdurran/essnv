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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const pathname = url.pathname;

    console.log('[DASHBOARD API] Request:', req.method, pathname);

    // GET /api/dashboard/customization - Get customization
    if ((req.method === 'GET' && pathname.includes('/customization')) ||
        (req.method === 'GET' && pathname === '/api/dashboard')) {
      return res.status(200).json(DEFAULT_CONFIG);
    }

    // PUT /api/dashboard/customization - Update customization
    if ((req.method === 'PUT' && pathname.includes('/customization')) ||
        (req.method === 'PUT' && pathname === '/api/dashboard')) {
      const updates = req.body;
      
      const updatedConfig = {
        ...DEFAULT_CONFIG,
        ...updates
      };
      
      return res.status(200).json(updatedConfig);
    }

    // POST /api/dashboard/customization/upload-image - Image upload
    if (req.method === 'POST' && pathname.includes('/upload-image')) {
      // Not implemented - requires file upload handling
      return res.status(501).json({ 
        message: 'Image upload not implemented. Use direct asset URLs.',
        note: 'For production, implement with Vercel Blob Storage.'
      });
    }

    return res.status(404).json({ 
      message: 'Dashboard endpoint not found',
      hint: 'Use /api/dashboard/customization'
    });

  } catch (error: any) {
    console.error('[DASHBOARD API] Error:', error);
    return res.status(500).json({ 
      message: 'Dashboard error',
      error: error.message 
    });
  }
}

