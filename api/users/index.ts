import type { VercelRequest, VercelResponse } from '@vercel/node';

// Simple in-memory user store (you should use a database in production)
const USERS = [
  {
    username: 'admin',
    password: 'admin123', // In production, use hashed passwords!
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

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      // Return all users (excluding passwords)
      const usersWithoutPasswords = USERS.map(({ password, ...user }) => user);
      return res.status(200).json(usersWithoutPasswords);
    }

    if (req.method === 'POST') {
      // Create new user
      const userData = req.body;

      if (!userData.username || !userData.password) {
        return res.status(400).json({ message: 'Username and password are required' });
      }

      // Check if user already exists
      if (USERS.find(u => u.username === userData.username)) {
        return res.status(409).json({ message: 'Username already exists' });
      }

      // In production, you would save this to a database
      const newUser = {
        username: userData.username,
        password: userData.password,
        role: userData.role || 'user',
        practiceName: userData.practiceName || 'MDS AI Analytics',
        practiceSubtitle: userData.practiceSubtitle || null,
        logoUrl: userData.logoUrl || '/assets/MDS Logo_1754254040718-Dv0l5qLn.png',
        ownerName: userData.ownerName || null,
        ownerTitle: userData.ownerTitle || null,
        ownerPhotoUrl: userData.ownerPhotoUrl || '/assets/Dr. John Josephson_1757862871625-B4_CVazU.jpeg',
        revenueTitle: userData.revenueTitle || 'Revenue',
        expensesTitle: userData.expensesTitle || 'Expenses',
        cashInTitle: userData.cashInTitle || 'Cash In',
        cashOutTitle: userData.cashOutTitle || 'Cash Out',
        topRevenueTitle: userData.topRevenueTitle || 'Top Revenue Procedures',
        showCollectionsWidget: userData.showCollectionsWidget !== undefined ? userData.showCollectionsWidget : true,
        providers: userData.providers || [],
        revenueSubheadings: userData.revenueSubheadings || {},
        expensesSubheadings: userData.expensesSubheadings || {},
        cashInSubheadings: userData.cashInSubheadings || {},
        cashOutSubheadings: userData.cashOutSubheadings || {},
        cashFlowSubheadings: userData.cashFlowSubheadings || {},
        procedureNameOverrides: userData.procedureNameOverrides || {},
        locationNameOverrides: userData.locationNameOverrides || {}
      };

      USERS.push(newUser);

      const { password, ...userWithoutPassword } = newUser;
      return res.status(201).json(userWithoutPassword);
    }

    return res.status(405).json({ message: 'Method not allowed' });

  } catch (error: any) {
    console.error('[API] Users error:', error);
    return res.status(500).json({ 
      message: 'Failed to handle users request',
      error: error.message 
    });
  }
}

