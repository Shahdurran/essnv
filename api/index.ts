import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';
import { registerRoutes } from '../server/routes';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();

// Trust proxy for Vercel
app.set('trust proxy', true);

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'medical-analytics-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax'
  }
}));

// Serve static files from dist/public
const staticPath = path.join(__dirname, '../dist/public');
app.use(express.static(staticPath));

// Serve uploaded assets
const uploadsPath = path.join(__dirname, '../server/public/assets');
app.use('/assets', express.static(uploadsPath));

// Register API routes (async)
let routesRegistered = false;
const ensureRoutes = async () => {
  if (!routesRegistered) {
    await registerRoutes(app);
    routesRegistered = true;
  }
};

// SPA fallback
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(staticPath, 'index.html'));
  }
});

// Export handler for Vercel
export default async function handler(req: VercelRequest, res: VercelResponse) {
  await ensureRoutes();
  return app(req as any, res as any);
}
