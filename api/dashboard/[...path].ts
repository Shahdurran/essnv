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
    // Get the path segments: /api/dashboard/customization → ["customization"]
    const { path } = req.query;
    const endpoint = Array.isArray(path) ? path.join('/') : path || '';

    console.log('[DASHBOARD API] Request:', req.method, endpoint, req.url);

    // GET /api/dashboard/customization - Get customization
    if ((req.method === 'GET' && endpoint === 'customization') ||
        (req.method === 'GET' && !endpoint)) {
      return res.status(200).json(DEFAULT_CONFIG);
    }

    // PUT /api/dashboard/customization - Update customization
    if (req.method === 'PUT' && endpoint === 'customization') {
      const updates = req.body;
      
      const updatedConfig = {
        ...DEFAULT_CONFIG,
        ...updates
      };
      
      return res.status(200).json(updatedConfig);
    }

    // POST /api/dashboard/customization/upload-image - Image upload
    if (req.method === 'POST' && endpoint.includes('upload-image')) {
      try {
        const body = req.body;
        
        // Check if body exists and has image data
        if (!body) {
          return res.status(400).json({ message: 'No image data provided' });
        }
        
        // Handle FormData (from multipart/form-data)
        if (body.image || body.file) {
          const imageData = body.image || body.file;
          
          // For Vercel Serverless, we'll use Base64 encoding
          // In production, you'd want to use Vercel Blob Storage or a cloud provider
          if (imageData && imageData.type === 'Buffer') {
            // Convert Buffer to Base64
            const buffer = Buffer.from(imageData.data);
            const base64 = buffer.toString('base64');
            const mimeType = imageData.type || 'image/jpeg';
            const dataUrl = `data:${mimeType};base64,${base64}`;
            
            return res.status(200).json({ 
              url: dataUrl,
              message: 'Image uploaded successfully (Base64 encoded)',
              note: 'For production, configure Vercel Blob Storage or S3'
            });
          }
          
          // If it's already a data URL or external URL, use it directly
          if (typeof imageData === 'string' && (imageData.startsWith('data:') || imageData.startsWith('http'))) {
            return res.status(200).json({ url: imageData });
          }
        }
        
        // Handle JSON body with base64 data
        if (body.base64Data) {
          const mimeType = body.mimeType || 'image/jpeg';
          const dataUrl = `data:${mimeType};base64,${body.base64Data}`;
          
          return res.status(200).json({ 
            url: dataUrl,
            message: 'Image uploaded successfully (Base64 encoded)',
            note: 'For production, configure Vercel Blob Storage or S3'
          });
        }
        
        // No image data found
        return res.status(400).json({ message: 'No image data found in request' });
        
      } catch (error: any) {
        console.error('[DASHBOARD API] Image upload error:', error);
        return res.status(500).json({ 
          message: 'Image upload failed',
          error: error.message 
        });
      }
    }

    return res.status(404).json({ 
      message: 'Dashboard endpoint not found',
      hint: 'Use /api/dashboard/customization',
      received: endpoint
    });

  } catch (error: any) {
    console.error('[DASHBOARD API] Error:', error);
    return res.status(500).json({ 
      message: 'Dashboard error',
      error: error.message 
    });
  }
}

