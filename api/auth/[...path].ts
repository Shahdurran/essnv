import type { VercelRequest, VercelResponse } from '@vercel/node';

// CRITICAL: Force dynamic rendering for multi-device sync
// This ensures app.medidentai.com always serves fresh data from Neon
// Never a cached version from the browser or Vercel edge
export const dynamic = "force-dynamic";

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { pgTable, text, varchar, json, boolean } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Inline schema definition (avoids import issues with Vercel bundler)
const users = pgTable('users', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  name: text('name').notNull(),
  role: text('role').notNull(),
  practiceId: varchar('practice_id'),
  
  // Branding fields
  logoUrl: text('logo_url'),
  practiceName: text('practice_name'),
  practiceSubtitle: text('practice_subtitle'),
  ownerName: text('owner_name'),
  ownerTitle: text('owner_title'),
  ownerPhotoUrl: text('owner_photo_url'),
  
  // Widget titles
  revenueTitle: text('revenue_title'),
  expensesTitle: text('expenses_title'),
  profitLossTitle: text('profit_loss_title'),
  cashInTitle: text('cash_in_title'),
  cashOutTitle: text('cash_out_title'),
  topRevenueTitle: text('top_revenue_title'),
  
  // Subheading customizations
  revenueSubheadings: json('revenue_subheadings'),
  expensesSubheadings: json('expenses_subheadings'),
  cashInSubheadings: json('cash_in_subheadings'),
  cashOutSubheadings: json('cash_out_subheadings'),
  cashFlowSubheadings: json('cash_flow_subheadings'),
  arSubheadings: json('ar_subheadings'),
  
  // Other customizations
  procedureNameOverrides: json('procedure_name_overrides'),
  locationNameOverrides: json('location_name_overrides'),
  providers: json('providers'),
  showCollectionsWidget: boolean('show_collections_widget').default(true),
});

// Initialize Neon DB connection
const databaseUrl = process.env.DATABASE_URL || process.env.DATABASE_CONNECTION_STRING;
let db: any = null;

try {
  if (databaseUrl) {
    const sqlConnection = neon(databaseUrl);
    db = drizzle(sqlConnection);
    console.log('[AUTH API] Neon DB connection initialized');
  } else {
    console.log('[AUTH API] No DATABASE_URL found - using in-memory users only');
  }
} catch (error) {
  console.error('[AUTH API] Failed to initialize Neon DB:', error);
}

// Default subheading keys that match actual data line_item values
const DEFAULT_REVENUE_KEYS = [
  'Office Visits',
  'Intravitreal Injections',
  'Cataract Surgeries',
  'Diagnostics & Minor Procedures',
  'Oculoplastics',
  'Corneal Procedures',
  'Refractive Cash',
  'Optical / Contact Lens Sales'
];

const DEFAULT_EXPENSES_KEYS = [
  'Drug Acquisition (injections)',
  'Surgical Supplies & IOLs',
  'Optical Cost of Goods',
  'Staff Wages & Benefits',
  'Rent & Utilities',
  'Insurance',
  'Billing & Coding Vendors',
  'Bad Debt Expense',
  'Marketing & Outreach',
  'Technology',
  'Equipment Service & Leases',
  'Office & Miscellaneous'
];

const DEFAULT_CASH_IN_KEYS = [
  'Patient Payments',
  'Insurance Reimbursements'
];

const DEFAULT_CASH_OUT_KEYS = [
  'Staff Wages & Benefits',
  'Drug Purchases',
  'Optical Goods',
  'Rent & Utilities',
  'Insurance',
  'Billing & Coding Vendors',
  'Marketing & Outreach',
  'Technology',
  'Equipment Service & Leases',
  'Office & Miscellaneous'
];

const DEFAULT_CASH_FLOW_KEYS = [
  'Net Cash from Operating',
  'Net Cash from Investing',
  'Net Cash from Financing'
];

const DEFAULT_AR_KEYS = ['0-30', '31-60', '61-90', '90+'];

const DEFAULT_PROCEDURE_KEYS = [
  'With IOL insertion',
  'Medication injection',
  'Refractive surgery',
  'Upper eyelid surgery',
  'Retinal imaging',
  'Laser glaucoma treatment',
  'New patient exam',
  '45-59 minutes'
];

// In-memory user store (fallback when DB is not available)
const IN_MEMORY_USERS = [
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
    profitLossTitle: 'Profit & Loss',
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
    arSubheadings: {},
    procedureNameOverrides: {},
    locationNameOverrides: {}
  },
  {
    username: 'drammar',
    password: 'elite2024',
    role: 'user',
    practiceName: 'Elite Orthodontics',
    practiceSubtitle: 'Northern Virginia',
    logoUrl: '/assets/MDS Logo_1754254040718-Dv0l5qLn.png',
    ownerName: 'Dr. Ammar Al-Mahdi',
    ownerTitle: 'Orthodontist',
    ownerPhotoUrl: '/assets/ammar-v2.jpeg',
    revenueTitle: 'Revenue',
    expensesTitle: 'Expenses',
    profitLossTitle: 'Profit & Loss',
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
    arSubheadings: {},
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

// Simple in-memory session store
const SESSIONS: Record<string, any> = {};

// Helper function to initialize subheading records with default keys
function initializeSubheadings(
  existing: Record<string, string> | undefined,
  defaultKeys: string[]
): Record<string, string> {
  const result = { ...(existing || {}) };
  defaultKeys.forEach(key => {
    if (!result.hasOwnProperty(key)) {
      result[key] = '';
    }
  });
  return result;
}

// Helper to initialize AR subheadings with default values
function initializeARSubheadings(existing?: Record<string, string>): Record<string, string> {
  const result = { ...(existing || {}) };
  DEFAULT_AR_KEYS.forEach(key => {
    if (!result.hasOwnProperty(key)) {
      result[key] = `${key} days`;
    }
  });
  return result;
}

// Function to convert database user to app user format
function convertDbUserToAppUser(dbUser: any): any {
  return {
    // Basic fields
    username: dbUser.username,
    role: dbUser.role || 'user',
    
    // Branding fields - use DB values or defaults
    practiceName: dbUser.practiceName || 'MDS AI Analytics',
    practiceSubtitle: dbUser.practiceSubtitle || 'Eye Specialists & Surgeons',
    logoUrl: dbUser.logoUrl || '/assets/MDS Logo_1754254040718-Dv0l5qLn.png',
    ownerName: dbUser.name,
    ownerTitle: dbUser.ownerTitle || (dbUser.role === 'admin' ? 'Medical Director' : 'Staff'),
    ownerPhotoUrl: dbUser.ownerPhotoUrl || '/assets/Dr. John Josephson_1757862871625-B4_CVazU.jpeg',
    
    // Widget titles - use DB values or defaults
    revenueTitle: dbUser.revenueTitle || 'Revenue',
    expensesTitle: dbUser.expensesTitle || 'Expenses',
    profitLossTitle: dbUser.profitLossTitle || 'Profit & Loss',
    cashInTitle: dbUser.cashInTitle || 'Cash In',
    cashOutTitle: dbUser.cashOutTitle || 'Cash Out',
    topRevenueTitle: dbUser.topRevenueTitle || 'Top Revenue Procedures',
    
    // Subheading customizations - use DB values or defaults
    revenueSubheadings: dbUser.revenueSubheadings || {},
    expensesSubheadings: dbUser.expensesSubheadings || {},
    cashInSubheadings: dbUser.cashInSubheadings || {},
    cashOutSubheadings: dbUser.cashOutSubheadings || {},
    cashFlowSubheadings: dbUser.cashFlowSubheadings || {},
    arSubheadings: dbUser.arSubheadings || {},
    
    // Other customizations
    procedureNameOverrides: dbUser.procedureNameOverrides || {},
    locationNameOverrides: dbUser.locationNameOverrides || {},
    showCollectionsWidget: dbUser.showCollectionsWidget !== undefined ? dbUser.showCollectionsWidget : true,
    providers: dbUser.providers || [
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
  };
}

// Global function to update sessions when user settings change
export function updateAuthSessions(username: string, updatedUser: any) {
  console.log('[AUTH API] Updating sessions for user:', username);
  Object.keys(SESSIONS).forEach(token => {
    if (SESSIONS[token]?.username === username) {
      console.log('[AUTH API] Updated session token:', token);
      SESSIONS[token] = { ...SESSIONS[token], ...updatedUser };
    }
  });
}

// Expose update function globally for cross-API communication
if (typeof global !== 'undefined') {
  (global as any).UPDATE_AUTH_SESSIONS = updateAuthSessions;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CRITICAL: Set cache-control headers for multi-device sync
  // Ensures app.medidentai.com never serves cached data from browser or Vercel edge
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Get the path segments: /api/auth/login → ["login"]
    const { path } = req.query;
    const endpoint = Array.isArray(path) ? path[0] : path || '';
    
    console.log('[AUTH API] Request:', req.method, endpoint, req.url);

    // Route: POST /api/auth/login
    if (endpoint === 'login') {
      if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed. Use POST.' });
      }

      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
      }

      console.log('[AUTH/LOGIN] Login attempt for user:', username);

      // Try to authenticate using Neon DB first
      if (db) {
        try {
          const dbUsers = await db.select().from(users).where(sql`${users.username} = ${username}`);
          
          if (dbUsers.length > 0) {
            const dbUser = dbUsers[0];
            
            // Simple password comparison (in production, use bcrypt)
            if (dbUser.password === password) {
              console.log('[AUTH/LOGIN] DB login successful for user:', username);
              
              const userWithoutPassword = convertDbUserToAppUser(dbUser);
              
              // Initialize subheading records with default keys
              userWithoutPassword.revenueSubheadings = initializeSubheadings(userWithoutPassword.revenueSubheadings, DEFAULT_REVENUE_KEYS);
              userWithoutPassword.expensesSubheadings = initializeSubheadings(userWithoutPassword.expensesSubheadings, DEFAULT_EXPENSES_KEYS);
              userWithoutPassword.cashInSubheadings = initializeSubheadings(userWithoutPassword.cashInSubheadings, DEFAULT_CASH_IN_KEYS);
              userWithoutPassword.cashOutSubheadings = initializeSubheadings(userWithoutPassword.cashOutSubheadings, DEFAULT_CASH_OUT_KEYS);
              userWithoutPassword.cashFlowSubheadings = initializeSubheadings(userWithoutPassword.cashFlowSubheadings, DEFAULT_CASH_FLOW_KEYS);
              userWithoutPassword.arSubheadings = initializeARSubheadings(userWithoutPassword.arSubheadings);
              userWithoutPassword.procedureNameOverrides = initializeSubheadings(userWithoutPassword.procedureNameOverrides, DEFAULT_PROCEDURE_KEYS);
              
              // Generate session token
              const sessionToken = `${username}_${Date.now()}`;
              SESSIONS[sessionToken] = userWithoutPassword;
              
              console.log('[AUTH API] Login successful for user:', username);
              return res.status(200).json({ user: userWithoutPassword, token: sessionToken });
            } else {
              console.log('[AUTH/LOGIN] DB login failed - wrong password for user:', username);
            }
          } else {
            console.log('[AUTH/LOGIN] User not found in DB:', username);
          }
        } catch (dbError) {
          console.error('[AUTH/LOGIN] DB error:', dbError);
          // Fall back to in-memory users
        }
      }

      // Fall back to in-memory users
      console.log('[AUTH/LOGIN] Falling back to in-memory users');
      const user = IN_MEMORY_USERS.find(u => u.username === username && u.password === password);

      if (!user) {
        console.log('[AUTH/LOGIN] Login failed for user:', username);
        return res.status(401).json({ message: 'Invalid username or password' });
      }

      const { password: _, ...userWithoutPassword } = user;
      
      // Initialize subheading records with default keys
      userWithoutPassword.revenueSubheadings = initializeSubheadings(user.revenueSubheadings, DEFAULT_REVENUE_KEYS);
      userWithoutPassword.expensesSubheadings = initializeSubheadings(user.expensesSubheadings, DEFAULT_EXPENSES_KEYS);
      userWithoutPassword.cashInSubheadings = initializeSubheadings(user.cashInSubheadings, DEFAULT_CASH_IN_KEYS);
      userWithoutPassword.cashOutSubheadings = initializeSubheadings(user.cashOutSubheadings, DEFAULT_CASH_OUT_KEYS);
      userWithoutPassword.cashFlowSubheadings = initializeSubheadings(user.cashFlowSubheadings, DEFAULT_CASH_FLOW_KEYS);
      userWithoutPassword.arSubheadings = initializeARSubheadings(user.arSubheadings);
      userWithoutPassword.procedureNameOverrides = initializeSubheadings(user.procedureNameOverrides, DEFAULT_PROCEDURE_KEYS);
      
      // Generate session token
      const sessionToken = `${username}_${Date.now()}`;
      SESSIONS[sessionToken] = userWithoutPassword;
      
      console.log('[AUTH API] Login successful for user:', username);
      return res.status(200).json({ user: userWithoutPassword, token: sessionToken });
    }

    // Route: POST /api/auth/logout
    if (endpoint === 'logout') {
      if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed. Use POST.' });
      }

      // Get token from Authorization header
      const authHeader = req.headers.authorization;
      const token = authHeader?.replace('Bearer ', '');
      
      if (token && SESSIONS[token]) {
        delete SESSIONS[token];
      }
      
      console.log('[AUTH API] Logout successful');
      return res.status(200).json({ message: 'Logged out successfully' });
    }

    // Route: GET /api/auth/me
    if (endpoint === 'me') {
      if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed. Use GET.' });
      }

      // Add cache-control headers to prevent caching - ensures multi-device sync
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      // Get token from Authorization header
      const authHeader = req.headers.authorization;
      const token = authHeader?.replace('Bearer ', '');
      
      if (!token) {
        console.log('[AUTH API] Auth check - no token provided');
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      // Check in-memory sessions first
      if (SESSIONS[token]) {
        const sessionUser = SESSIONS[token];
        console.log('[AUTH API] Auth check - returning session user:', sessionUser.username);
        return res.status(200).json(sessionUser);
      }
      
      // Extract username from token (format: username_timestamp)
      const username = token.split('_')[0];
      
      // Try to get fresh user data from DB
      if (db) {
        try {
          const dbUsers = await db.select().from(users).where(sql`${users.username} = ${username}`);
          if (dbUsers.length > 0) {
            const userWithoutPassword = convertDbUserToAppUser(dbUsers[0]);
            
            // Initialize subheadings
            userWithoutPassword.revenueSubheadings = initializeSubheadings(userWithoutPassword.revenueSubheadings, DEFAULT_REVENUE_KEYS);
            userWithoutPassword.expensesSubheadings = initializeSubheadings(userWithoutPassword.expensesSubheadings, DEFAULT_EXPENSES_KEYS);
            userWithoutPassword.cashInSubheadings = initializeSubheadings(userWithoutPassword.cashInSubheadings, DEFAULT_CASH_IN_KEYS);
            userWithoutPassword.cashOutSubheadings = initializeSubheadings(userWithoutPassword.cashOutSubheadings, DEFAULT_CASH_OUT_KEYS);
            userWithoutPassword.cashFlowSubheadings = initializeSubheadings(userWithoutPassword.cashFlowSubheadings, DEFAULT_CASH_FLOW_KEYS);
            userWithoutPassword.arSubheadings = initializeARSubheadings(userWithoutPassword.arSubheadings);
            userWithoutPassword.procedureNameOverrides = initializeSubheadings(userWithoutPassword.procedureNameOverrides, DEFAULT_PROCEDURE_KEYS);
            
            console.log('[AUTH API] Auth check - returning DB user:', username);
            return res.status(200).json(userWithoutPassword);
          }
        } catch (dbError) {
          console.error('[AUTH API] DB error fetching user:', dbError);
        }
      }
      
      // Fall back to in-memory users
      const freshUser = IN_MEMORY_USERS.find(u => u.username === username);
      if (!freshUser) {
        console.log('[AUTH API] Auth check - user not found:', username);
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      const { password: _, ...userWithoutPassword } = freshUser;
      userWithoutPassword.revenueSubheadings = initializeSubheadings(freshUser.revenueSubheadings, DEFAULT_REVENUE_KEYS);
      userWithoutPassword.expensesSubheadings = initializeSubheadings(freshUser.expensesSubheadings, DEFAULT_EXPENSES_KEYS);
      userWithoutPassword.cashInSubheadings = initializeSubheadings(freshUser.cashInSubheadings, DEFAULT_CASH_IN_KEYS);
      userWithoutPassword.cashOutSubheadings = initializeSubheadings(freshUser.cashOutSubheadings, DEFAULT_CASH_OUT_KEYS);
      userWithoutPassword.cashFlowSubheadings = initializeSubheadings(freshUser.cashFlowSubheadings, DEFAULT_CASH_FLOW_KEYS);
      userWithoutPassword.arSubheadings = initializeARSubheadings(freshUser.arSubheadings);
      userWithoutPassword.procedureNameOverrides = initializeSubheadings(freshUser.procedureNameOverrides, DEFAULT_PROCEDURE_KEYS);
      
      console.log('[AUTH API] Auth check - returning fresh data for user:', username);
      return res.status(200).json(userWithoutPassword);
    }

    // Default: route not found
    return res.status(404).json({ 
      message: 'Auth endpoint not found',
      hint: 'Use /api/auth/login, /api/auth/logout, or /api/auth/me',
      received: endpoint
    });

  } catch (error: any) {
    console.error('[AUTH API] Error:', error);
    return res.status(500).json({ 
      message: 'Authentication error',
      error: error.message 
    });
  }
}
