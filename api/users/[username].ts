import type { VercelRequest, VercelResponse } from '@vercel/node';

// Simple in-memory user store (should match the one in index.ts)
// In production, use a database
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
    showCollectionsWidget: true
  }
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { username } = req.query;

  if (!username || typeof username !== 'string') {
    return res.status(400).json({ message: 'Username is required' });
  }

  try {
    if (req.method === 'GET') {
      // Get specific user
      const user = USERS.find(u => u.username === username);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const { password, ...userWithoutPassword } = user;
      return res.status(200).json(userWithoutPassword);
    }

    if (req.method === 'PUT') {
      // Update user
      const userIndex = USERS.findIndex(u => u.username === username);
      
      if (userIndex === -1) {
        return res.status(404).json({ message: 'User not found' });
      }

      const updates = req.body;
      
      // Don't allow changing username
      delete updates.username;
      
      // Merge updates with existing user
      USERS[userIndex] = {
        ...USERS[userIndex],
        ...updates
      };

      const { password, ...userWithoutPassword } = USERS[userIndex];
      return res.status(200).json(userWithoutPassword);
    }

    if (req.method === 'DELETE') {
      // Delete user
      const userIndex = USERS.findIndex(u => u.username === username);
      
      if (userIndex === -1) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Don't allow deleting admin
      if (USERS[userIndex].role === 'admin') {
        return res.status(403).json({ message: 'Cannot delete admin user' });
      }

      USERS.splice(userIndex, 1);
      return res.status(200).json({ message: 'User deleted successfully' });
    }

    return res.status(405).json({ message: 'Method not allowed' });

  } catch (error: any) {
    console.error('[API] User operation error:', error);
    return res.status(500).json({ 
      message: 'Failed to handle user request',
      error: error.message 
    });
  }
}

