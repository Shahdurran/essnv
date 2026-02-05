import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, sql } from 'drizzle-orm';
import { pgTable, text, varchar, json, boolean } from 'drizzle-orm/pg-core';

// Inline users table definition for Vercel compatibility (matches shared/schema.ts)
const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  practiceId: varchar("practice_id"),
  
  // Branding fields
  logoUrl: text("logo_url"),
  practiceName: text("practice_name"),
  practiceSubtitle: text("practice_subtitle"),
  ownerName: text("owner_name"),
  ownerTitle: text("owner_title"),
  ownerPhotoUrl: text("owner_photo_url"),
  
  // Widget titles
  revenueTitle: text("revenue_title"),
  expensesTitle: text("expenses_title"),
  profitLossTitle: text("profit_loss_title"),
  cashInTitle: text("cash_in_title"),
  cashOutTitle: text("cash_out_title"),
  topRevenueTitle: text("top_revenue_title"),
  
  // Subheading customizations (stored as JSON)
  revenueSubheadings: json("revenue_subheadings"),
  expensesSubheadings: json("expenses_subheadings"),
  cashInSubheadings: json("cash_in_subheadings"),
  cashOutSubheadings: json("cash_out_subheadings"),
  cashFlowSubheadings: json("cash_flow_subheadings"),
  arSubheadings: json("ar_subheadings"),
  
  // Other customizations
  procedureNameOverrides: json("procedure_name_overrides"),
  locationNameOverrides: json("location_name_overrides"),
  providers: json("providers"),
  showCollectionsWidget: boolean("show_collections_widget").default(true),
});

// Initialize Neon DB connection
const databaseUrl = process.env.DATABASE_URL || process.env.DATABASE_CONNECTION_STRING;
let db: any = null;

try {
  if (databaseUrl) {
    const sqlConnection = neon(databaseUrl);
    db = drizzle(sqlConnection);
    console.log('[USERS API] Neon DB connection initialized');
  } else {
    console.log('[USERS API] No DATABASE_URL found - using in-memory users only');
  }
} catch (error) {
  console.error('[USERS API] Failed to initialize Neon DB:', error);
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
    locationNameOverrides: {},
    userLocations: []
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
    },
    userLocations: []
  }
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

// Function to convert app user format to DB user
function convertAppUserToDbUser(appUser: any): any {
  return {
    username: appUser.username,
    password: appUser.password,
    name: appUser.ownerName || appUser.username,
    role: appUser.role || 'user',
    practiceId: null
  };
}

// Function to convert DB user to app user format
function convertDbUserToAppUser(dbUser: any): any {
  return {
    username: dbUser.username,
    role: dbUser.role || 'user',
    practiceName: 'MDS AI Analytics',
    practiceSubtitle: 'Eye Specialists & Surgeons',
    logoUrl: '/assets/MDS Logo_1754254040718-Dv0l5qLn.png',
    ownerName: dbUser.name,
    ownerTitle: dbUser.role === 'admin' ? 'Medical Director' : 'Staff',
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
    locationNameOverrides: {},
    userLocations: []
  };
}

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
      if (db) {
        try {
          const dbUsers = await db.select().from(users);
          const appUsers = dbUsers.map(convertDbUserToAppUser);
          // Add settings fields
          const usersWithSettings = appUsers.map((user: any) => ({
            ...user,
            revenueTitle: 'Revenue',
            expensesTitle: 'Expenses',
            profitLossTitle: 'Profit & Loss',
            cashInTitle: 'Cash In',
            cashOutTitle: 'Cash Out',
            topRevenueTitle: 'Top Revenue Procedures',
            showCollectionsWidget: true,
            revenueSubheadings: {},
            expensesSubheadings: {},
            cashInSubheadings: {},
            cashOutSubheadings: {},
            cashFlowSubheadings: {},
            arSubheadings: {},
            procedureNameOverrides: {},
            locationNameOverrides: {},
            userLocations: []
          }));
          return res.status(200).json(usersWithSettings);
        } catch (dbError) {
          console.error('[USERS API] DB error:', dbError);
        }
      }
      // Fall back to in-memory users
      const usersWithoutPasswords = IN_MEMORY_USERS.map(({ password, ...user }) => user);
      return res.status(200).json(usersWithoutPasswords);
    }

    // GET /api/users/:username - Get specific user
    if (req.method === 'GET' && username) {
      if (db) {
        try {
          const dbUsers = await db.select().from(users).where(eq(users.username, username));
          
          if (dbUsers.length > 0) {
            const userWithoutPassword = convertDbUserToAppUser(dbUsers[0]);
            return res.status(200).json(userWithoutPassword);
          }
        } catch (dbError) {
          console.error('[USERS API] DB error:', dbError);
        }
      }
      // Fall back to in-memory users
      const user = IN_MEMORY_USERS.find(u => u.username === username);
      
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

      // Check in-memory users first
      if (IN_MEMORY_USERS.find(u => u.username === userData.username)) {
        return res.status(409).json({ message: 'Username already exists' });
      }

      // Try to create in DB
      if (db) {
        try {
          const dbUser = convertAppUserToDbUser(userData);
          await db.insert(users).values(dbUser);
          console.log('[USERS API] User created in DB:', userData.username);
        } catch (dbError: any) {
          // Check if it's a unique constraint violation
          if (dbError.code === '23505') {
            return res.status(409).json({ message: 'Username already exists' });
          }
          console.error('[USERS API] DB error creating user:', dbError);
        }
      }

      // Add to in-memory store
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
        profitLossTitle: userData.profitLossTitle || 'Profit & Loss',
        cashInTitle: userData.cashInTitle || 'Cash In',
        cashOutTitle: userData.cashOutTitle || 'Cash Out',
        topRevenueTitle: userData.topRevenueTitle || 'Top Revenue Procedures',
        showCollectionsWidget: userData.showCollectionsWidget !== undefined ? userData.showCollectionsWidget : true,
        revenueSubheadings: initializeSubheadings(userData.revenueSubheadings, DEFAULT_REVENUE_KEYS),
        expensesSubheadings: initializeSubheadings(userData.expensesSubheadings, DEFAULT_EXPENSES_KEYS),
        cashInSubheadings: initializeSubheadings(userData.cashInSubheadings, DEFAULT_CASH_IN_KEYS),
        cashOutSubheadings: initializeSubheadings(userData.cashOutSubheadings, DEFAULT_CASH_OUT_KEYS),
        cashFlowSubheadings: initializeSubheadings(userData.cashFlowSubheadings, DEFAULT_CASH_FLOW_KEYS),
        arSubheadings: initializeARSubheadings(userData.arSubheadings),
        procedureNameOverrides: initializeSubheadings(userData.procedureNameOverrides, DEFAULT_PROCEDURE_KEYS),
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
        userLocations: userData.userLocations || []
      };

      IN_MEMORY_USERS.push(newUser);

      const { password, ...userWithoutPassword } = newUser;
      return res.status(201).json(userWithoutPassword);
    }

    // PUT /api/users/:username - Update user
    if (req.method === 'PUT' && username) {
      const updates = req.body;
      delete updates.username; // Don't allow username changes
      
      // Check if user exists in DB first
      let userFromDb: any = null;
      if (db) {
        try {
          const dbUsers = await db.select().from(users).where(eq(users.username, username));
          if (dbUsers.length > 0) {
            userFromDb = dbUsers[0];
            // Update in DB
            const dbUser = {
              username: username,
              password: updates.password || dbUsers[0].password,
              name: updates.ownerName || dbUsers[0].name,
              role: updates.role || dbUsers[0].role,
              practiceId: dbUsers[0].practiceId
            };
            await db.update(users).set(dbUser).where(eq(users.username, username));
            console.log('[USERS API] User updated in DB:', username);
          }
        } catch (dbError) {
          console.error('[USERS API] DB error updating user:', dbError);
        }
      }
      
      // Check in-memory users
      let userIndex = IN_MEMORY_USERS.findIndex(u => u.username === username);
      
      if (userIndex === -1 && !userFromDb) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      if (userIndex !== -1) {
        // Update in-memory user
        const currentPassword = IN_MEMORY_USERS[userIndex].password;
        
        IN_MEMORY_USERS[userIndex] = {
          ...IN_MEMORY_USERS[userIndex],
          ...updates,
          password: currentPassword,
          // Ensure subheading records are properly initialized
          revenueSubheadings: initializeSubheadings(updates.revenueSubheadings, DEFAULT_REVENUE_KEYS),
          expensesSubheadings: initializeSubheadings(updates.expensesSubheadings, DEFAULT_EXPENSES_KEYS),
          cashInSubheadings: initializeSubheadings(updates.cashInSubheadings, DEFAULT_CASH_IN_KEYS),
          cashOutSubheadings: initializeSubheadings(updates.cashOutSubheadings, DEFAULT_CASH_OUT_KEYS),
          cashFlowSubheadings: initializeSubheadings(updates.cashFlowSubheadings, DEFAULT_CASH_FLOW_KEYS),
          arSubheadings: initializeARSubheadings(updates.arSubheadings),
          procedureNameOverrides: initializeSubheadings(updates.procedureNameOverrides, DEFAULT_PROCEDURE_KEYS),
          locationNameOverrides: updates.locationNameOverrides || IN_MEMORY_USERS[userIndex].locationNameOverrides,
          providers: updates.providers || IN_MEMORY_USERS[userIndex].providers,
          userLocations: updates.userLocations || IN_MEMORY_USERS[userIndex].userLocations,
        };

        const { password, ...userWithoutPassword } = IN_MEMORY_USERS[userIndex];
        
        // Update session in auth API if available
        if (typeof global !== 'undefined' && (global as any).UPDATE_AUTH_SESSIONS) {
          (global as any).UPDATE_AUTH_SESSIONS(username, userWithoutPassword);
        }
        
        return res.status(200).json(userWithoutPassword);
      } else {
        // User only in DB - return success
        const userWithoutPassword = {
          username: username,
          role: userFromDb?.role || 'user',
          ...updates
        };
        return res.status(200).json(userWithoutPassword);
      }
    }

    // DELETE /api/users/:username - Delete user
    if (req.method === 'DELETE' && username) {
      // Check in-memory users first
      let userIndex = IN_MEMORY_USERS.findIndex(u => u.username === username);
      
      if (userIndex === -1 && db) {
        // Try to delete from DB
        try {
          await db.delete(users).where(eq(users.username, username));
          console.log('[USERS API] User deleted from DB:', username);
        } catch (dbError) {
          console.error('[USERS API] DB error deleting user:', dbError);
        }
      } else if (userIndex === -1) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (IN_MEMORY_USERS[userIndex].role === 'admin') {
        return res.status(403).json({ message: 'Cannot delete admin user' });
      }

      IN_MEMORY_USERS.splice(userIndex, 1);
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
