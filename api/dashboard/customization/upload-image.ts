import type { VercelRequest, VercelResponse } from '@vercel/node';

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
    // Note: File upload handling in Vercel Functions requires special setup
    // For now, return a placeholder response
    // In production, you'd use a service like AWS S3, Cloudinary, or Vercel Blob
    
    console.log('[API] Image upload requested');
    
    // Return a mock response
    // In production, you would:
    // 1. Parse multipart/form-data
    // 2. Upload to storage service
    // 3. Return the public URL
    
    return res.status(501).json({ 
      message: 'Image upload not implemented yet. Please use a direct asset URL.',
      note: 'For production, implement with Vercel Blob Storage or similar service.'
    });

  } catch (error: any) {
    console.error('[API] Image upload error:', error);
    return res.status(500).json({ 
      message: 'Failed to upload image',
      error: error.message 
    });
  }
}

