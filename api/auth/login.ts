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
    cashFlowSubheadings: {},
    procedureNameOverrides: {},
    locationNameOverrides: {}
  },
  {
    username: 'drammar',
    password: 'elite2024', // Use bcrypt in production!
    role: 'user',
    practiceName: 'Elite Orthodontics',
    practiceSubtitle: 'Northern Virginia',
    logoUrl: '/assets/MDS Logo_1754254040718-Dv0l5qLn.png',
    ownerName: 'Dr. Ammar Al-Mahdi',
    ownerTitle: 'Orthodontist',
    ownerPhotoUrl: '/assets/ammar.jpeg',
    revenueTitle: 'Revenue',
    expensesTitle: 'Expenses',
    cashInTitle: 'Cash In',
    cashOutTitle: 'Cash Out',
    topRevenueTitle: 'Top Revenue Procedures',
    showCollectionsWidget: true,
    providers: [
      { name: 'Dr. Ammar Al-Mahdi', percentage: 100 }
    ],
    revenueSubheadings: {},
    expensesSubheadings: {},
    cashInSubheadings: {},
    cashOutSubheadings: {},
    cashFlowSubheadings: {},
    procedureNameOverrides: {},
    locationNameOverrides: {
      'fairfax': 'Fairfax',
      'gainesville': 'Falls Church',
      'manassas': 'Woodbridge',
      'leesburg': 'Stafford',
      'reston': 'Lorton'
    }
  }
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed. Use POST.' });
  }

  try {
    const { username, password } = req.body;

    console.log('[AUTH/LOGIN] Request received:', { username, hasPassword: !!password });

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const user = USERS.find(u => u.username === username && u.password === password);

    if (!user) {
      console.log('[AUTH/LOGIN] Login failed for user:', username);
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const { password: _, ...userWithoutPassword } = user;
    console.log('[AUTH/LOGIN] Login successful for user:', username);
    return res.status(200).json(userWithoutPassword);

  } catch (error: any) {
    console.error('[AUTH/LOGIN] Error:', error);
    return res.status(500).json({ 
      message: 'Authentication error',
      error: error.message 
    });
  }
}

