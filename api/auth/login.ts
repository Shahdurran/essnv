import type { VercelRequest, VercelResponse } from '@vercel/node';

// Simple in-memory user store (you should use a database in production)
const USERS = [
  {
    username: 'admin',
    password: 'admin123', // In production, use hashed passwords!
    role: 'admin',
    practiceName: 'MDS AI Analytics',
    logoUrl: '/assets/MDS Logo_1754254040718-Dv0l5qLn.png',
    ownerName: 'Dr. John Josephson',
    ownerPhotoUrl: '/assets/Dr. John Josephson_1757862871625-B4_CVazU.jpeg'
  }
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed. Use POST.' });
  }

  try {
    const { username, password } = req.body;

    console.log('[API] Login attempt:', { username, hasPassword: !!password });

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Find user
    const user = USERS.find(u => u.username === username && u.password === password);

    if (!user) {
      console.log('[API] Login failed: Invalid credentials');
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Return user data (excluding password)
    const { password: _, ...userWithoutPassword } = user;
    
    console.log('[API] Login successful:', username);
    
    return res.status(200).json(userWithoutPassword);

  } catch (error: any) {
    console.error('[API] Login error:', error);
    return res.status(500).json({ 
      message: 'Login failed',
      error: error.message 
    });
  }
}

