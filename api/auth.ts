import type { VercelRequest, VercelResponse } from '@vercel/node';

// Simple in-memory user store (use database in production)
const USERS = [
  {
    username: 'admin',
    password: 'admin123', // Use bcrypt in production!
    role: 'admin',
    practiceName: 'MDS AI Analytics',
    practiceSubtitle: 'Eye Specialists & Surgeons',
    logoUrl: '/assets/MDS Logo_1754254040718-Dv0l5qLn.png',
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
  }
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Parse the route from the URL
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const pathname = url.pathname;
    
    console.log('[AUTH API] Request:', req.method, pathname);

    // Route: POST /api/auth?action=login or POST /api/auth/login
    if ((pathname === '/api/auth' && url.searchParams.get('action') === 'login') || 
        pathname === '/api/auth/login') {
      if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed. Use POST.' });
      }

      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
      }

      const user = USERS.find(u => u.username === username && u.password === password);

      if (!user) {
        return res.status(401).json({ message: 'Invalid username or password' });
      }

      const { password: _, ...userWithoutPassword } = user;
      return res.status(200).json(userWithoutPassword);
    }

    // Route: POST /api/auth?action=logout or POST /api/auth/logout
    if ((pathname === '/api/auth' && url.searchParams.get('action') === 'logout') || 
        pathname === '/api/auth/logout') {
      if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed. Use POST.' });
      }

      return res.status(200).json({ message: 'Logged out successfully' });
    }

    // Route: GET /api/auth?action=me or GET /api/auth/me
    if ((pathname === '/api/auth' && url.searchParams.get('action') === 'me') || 
        pathname === '/api/auth/me') {
      if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed. Use GET.' });
      }

      // No real session management in this simple version
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Default: route not found
    return res.status(404).json({ 
      message: 'Auth endpoint not found',
      hint: 'Use /api/auth/login, /api/auth/logout, or /api/auth/me'
    });

  } catch (error: any) {
    console.error('[AUTH API] Error:', error);
    return res.status(500).json({ 
      message: 'Authentication error',
      error: error.message 
    });
  }
}

