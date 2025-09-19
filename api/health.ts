import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "MDS AI Analytics API",
    environment: process.env.NODE_ENV || "development"
  });
}
