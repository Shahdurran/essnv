import type { VercelRequest, VercelResponse } from '@vercel/node';

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

// Simple in-memory session store
const SESSIONS: Record<string, any> = {};

// Global function to update sessions when user settings change (called from users API)
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

// Simple in-memory user store
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
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

      const user = USERS.find(u => u.username === username && u.password === password);

      if (!user) {
        console.log('[AUTH API] Login failed for user:', username);
        return res.status(401).json({ message: 'Invalid username or password' });
      }

      const { password: _, ...userWithoutPassword } = user;
      
      // Initialize subheading records with default keys so they can be customized
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

      // Get token from Authorization header
      const authHeader = req.headers.authorization;
      const token = authHeader?.replace('Bearer ', '');
      
      if (!token) {
        console.log('[AUTH API] Auth check - no token provided');
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      // Extract username from token (format: username_timestamp)
      const username = token.split('_')[0];
      
      // Find the latest user data from USERS array to get any settings updates
      const freshUser = USERS.find(u => u.username === username);
      if (!freshUser) {
        console.log('[AUTH API] Auth check - user not found in USERS:', username);
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      // Return fresh user data with initialized subheadings
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

