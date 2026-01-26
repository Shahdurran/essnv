import type { VercelRequest, VercelResponse } from '@vercel/node';

// Simple in-memory user store (sync with auth in production use database)
const USERS = [
  {
    username: 'admin',
    password: 'admin123',
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
    revenueSubheadings: {},
    expensesSubheadings: {},
    cashInSubheadings: {},
    cashOutSubheadings: {},
    cashFlowSubheadings: {},
    procedureNameOverrides: {},
    locationNameOverrides: {},
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
    userLocations: [] // Empty array means access to all locations
  }
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Get the path segments: /api/users or /api/users/admin → [] or ["admin"]
    const { path } = req.query;
    const username = Array.isArray(path) && path.length > 0 ? path[0] : null;

    console.log('[USERS API] Request:', req.method, username || 'list', req.url);

    // GET /api/users - List all users
    if (req.method === 'GET' && !username) {
      const usersWithoutPasswords = USERS.map(({ password, ...user }) => user);
      return res.status(200).json(usersWithoutPasswords);
    }

    // GET /api/users/:username - Get specific user
    if (req.method === 'GET' && username) {
      const user = USERS.find(u => u.username === username);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const { password, ...userWithoutPassword } = user;
      return res.status(200).json(userWithoutPassword);
    }

    // POST /api/users - Create new user
    if (req.method === 'POST' && !username) {
      const userData = req.body;

      if (!userData.username || !userData.password) {
        return res.status(400).json({ message: 'Username and password are required' });
      }

      if (USERS.find(u => u.username === userData.username)) {
        return res.status(409).json({ message: 'Username already exists' });
      }

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
        revenueSubheadings: userData.revenueSubheadings || {},
        expensesSubheadings: userData.expensesSubheadings || {},
        cashInSubheadings: userData.cashInSubheadings || {},
        cashOutSubheadings: userData.cashOutSubheadings || {},
        cashFlowSubheadings: userData.cashFlowSubheadings || {},
        procedureNameOverrides: userData.procedureNameOverrides || {},
        locationNameOverrides: userData.locationNameOverrides || {},
        providers: userData.providers || [
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
        userLocations: userData.userLocations || [] // Empty array means access to all locations
      };

      USERS.push(newUser);

      const { password, ...userWithoutPassword } = newUser;
      return res.status(201).json(userWithoutPassword);
    }

    // PUT /api/users/:username - Update user
    if (req.method === 'PUT' && username) {
      const userIndex = USERS.findIndex(u => u.username === username);
      
      if (userIndex === -1) {
        return res.status(404).json({ message: 'User not found' });
      }

      const updates = req.body;
      delete updates.username; // Don't allow username changes
      
      USERS[userIndex] = {
        ...USERS[userIndex],
        ...updates
      };

      const { password, ...userWithoutPassword } = USERS[userIndex];
      return res.status(200).json(userWithoutPassword);
    }

    // DELETE /api/users/:username - Delete user
    if (req.method === 'DELETE' && username) {
      const userIndex = USERS.findIndex(u => u.username === username);
      
      if (userIndex === -1) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (USERS[userIndex].role === 'admin') {
        return res.status(403).json({ message: 'Cannot delete admin user' });
      }

      USERS.splice(userIndex, 1);
      return res.status(200).json({ message: 'User deleted successfully' });
    }

    return res.status(405).json({ message: 'Method not allowed' });

  } catch (error: any) {
    console.error('[USERS API] Error:', error);
    return res.status(500).json({ 
      message: 'User management error',
      error: error.message 
    });
  }
}

