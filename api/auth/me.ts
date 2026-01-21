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
    // Since we don't have sessions in serverless, return a default user
    // In production, you'd validate a JWT token or session cookie here
    return res.status(401).json({ message: 'Not authenticated' });
  } catch (error: any) {
    console.error('[API] Auth check error:', error);
    return res.status(500).json({ 
      message: 'Failed to check authentication',
      error: error.message 
    });
  }
}

