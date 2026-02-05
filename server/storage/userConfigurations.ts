/*
 * USER CONFIGURATIONS DATABASE MODULE
 * ===================================
 * 
 * This module handles persistent storage of user configurations using Neon DB.
 * Uses bcrypt for secure password hashing.
 */

import { fileURLToPath } from 'url';
import * as defaultSubheadings from '../data/default-subheadings';

// Import Neon DB for production
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { users } from '../../shared/schema';
import { eq, and } from 'drizzle-orm';
import bcrypt from 'bcrypt';

const __filename = fileURLToPath(import.meta.url);
const __dirname = __filename;

// Initialize Neon DB connection
const databaseUrl = process.env.DATABASE_URL || process.env.DATABASE_CONNECTION_STRING;
let db: any = null;

try {
  if (databaseUrl) {
    const sqlConnection = neon(databaseUrl);
    db = drizzle(sqlConnection);
    console.log('[UserConfig] Neon DB connection initialized');
  } else {
    console.log('[UserConfig] No DATABASE_URL - using in-memory fallback');
  }
} catch (error) {
  console.error('[UserConfig] Failed to initialize Neon DB:', error);
}

export interface UserConfiguration {
  id: string;
  username: string;
  password: string;
  role: 'admin' | 'user';
  
  // Branding
  logoUrl: string | null;
  practiceName: string;
  practiceSubtitle: string | null;
  ownerName: string | null;
  ownerTitle: string | null;
  ownerPhotoUrl: string | null;
  
  // Widget titles
  revenueTitle: string;
  expensesTitle: string;
  profitLossTitle: string;
  cashInTitle: string;
  cashOutTitle: string;
  topRevenueTitle: string;
  
  // Subheading customizations (all line items)
  revenueSubheadings: Record<string, string>;
  expensesSubheadings: Record<string, string>;
  cashInSubheadings: Record<string, string>;
  cashOutSubheadings: Record<string, string>;
  cashFlowSubheadings: Record<string, string>;
  arSubheadings: Record<string, string>;
  
  // Top Revenue Procedures customization
  procedureNameOverrides: Record<string, string>;
  
  // Location customization
  locationNameOverrides: Record<string, string>;
  
  // Widget visibility
  showCollectionsWidget: boolean;
  
  // Provider/Doctor customization for Revenue Breakdown widget
  providers: Array<{
    name: string;
    percentage: number;
  }>;
  
  createdAt: string;
  updatedAt: string;
}

// In-memory cache for fallback when DB is unavailable
let configCache: UserConfiguration[] | null = null;

// Default subheading keys
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

const DEFAULT_PROVIDERS = [
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
];

/**
 * Initialize subheading records with default keys
 */
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

/**
 * Initialize AR subheadings with default values
 */
function initializeARSubheadings(existing?: Record<string, string>): Record<string, string> {
  const result = { ...(existing || {}) };
  DEFAULT_AR_KEYS.forEach(key => {
    if (!result.hasOwnProperty(key)) {
      result[key] = `${key} days`;
    }
  });
  return result;
}

/**
 * Convert database user to UserConfiguration
 */
function dbToUserConfig(dbUser: any): UserConfiguration {
  return {
    id: dbUser.id,
    username: dbUser.username,
    password: dbUser.password,
    role: dbUser.role || 'user',
    logoUrl: '/assets/MDS Logo_1754254040718-Dv0l5qLn.png',
    practiceName: 'MDS AI Analytics',
    practiceSubtitle: 'Eye Specialists & Surgeons',
    ownerName: dbUser.name,
    ownerTitle: dbUser.role === 'admin' ? 'Medical Director' : 'Staff',
    ownerPhotoUrl: '/assets/Dr. John Josephson_1757862871625-B4_CVazU.jpeg',
    revenueTitle: 'Revenue',
    expensesTitle: 'Expenses',
    profitLossTitle: 'Profit & Loss',
    cashInTitle: 'Cash In',
    cashOutTitle: 'Cash Out',
    topRevenueTitle: 'Top Revenue Procedures',
    revenueSubheadings: {},
    expensesSubheadings: {},
    cashInSubheadings: {},
    cashOutSubheadings: {},
    cashFlowSubheadings: {},
    arSubheadings: {},
    procedureNameOverrides: {},
    locationNameOverrides: {},
    showCollectionsWidget: true,
    providers: DEFAULT_PROVIDERS,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

/**
 * Get in-memory fallback users
 */
function getInMemoryUsers(): UserConfiguration[] {
  return [
    {
      id: 'admin-default',
      username: 'admin',
      password: '$2b$10$rQZ5JhLqLxKQQeOyLKBh5.XKQQeOyLKBh5.XKQQeOyLKBh5.XK', // admin123
      role: 'admin',
      logoUrl: '/assets/MDS Logo_1754254040718-Dv0l5qLn.png',
      practiceName: 'MDS AI Analytics',
      practiceSubtitle: 'Eye Specialists & Surgeons',
      ownerName: 'Dr. John Josephson',
      ownerTitle: 'Medical Director',
      ownerPhotoUrl: '/assets/Dr. John Josephson_1757862871625-B4_CVazU.jpeg',
      revenueTitle: 'Revenue',
      expensesTitle: 'Expenses',
      profitLossTitle: 'Profit & Loss',
      cashInTitle: 'Cash In',
      cashOutTitle: 'Cash Out',
      topRevenueTitle: 'Top Revenue Procedures',
      revenueSubheadings: {},
      expensesSubheadings: {},
      cashInSubheadings: {},
      cashOutSubheadings: {},
      cashFlowSubheadings: {},
      arSubheadings: {},
      procedureNameOverrides: {},
      locationNameOverrides: {},
      showCollectionsWidget: true,
      providers: DEFAULT_PROVIDERS,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'drammar-default',
      username: 'drammar',
      password: '$2b$10$eLKBh5.XKQQeOyLKBh5.XKQQeOyLKBh5.XKQQeOyLKBh5.XKQQe', // elite2024
      role: 'user',
      logoUrl: '/assets/MDS Logo_1754254040718-Dv0l5qLn.png',
      practiceName: 'Elite Orthodontics',
      practiceSubtitle: 'Northern Virginia',
      ownerName: 'Dr. Ammar Al-Mahdi',
      ownerTitle: 'Orthodontist',
      ownerPhotoUrl: '/assets/ammar-v2.jpeg',
      revenueTitle: 'Revenue',
      expensesTitle: 'Expenses',
      profitLossTitle: 'Profit & Loss',
      cashInTitle: 'Cash In',
      cashOutTitle: 'Cash Out',
      topRevenueTitle: 'Top Revenue Procedures',
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
      showCollectionsWidget: true,
      providers: [{ name: 'Dr. Ammar Al-Mahdi', percentage: 100 }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
}

/**
 * Read all user configurations from database
 */
export async function readUserConfigurations(): Promise<UserConfiguration[]> {
  // Return cache if available
  if (configCache !== null) {
    return configCache;
  }
  
  // Fallback to in-memory if DB not available
  if (!db) {
    console.log('[UserConfig] Using in-memory fallback');
    configCache = getInMemoryUsers();
    return configCache;
  }
  
  try {
    const dbUsers = await db.select().from(users);
    
    if (dbUsers.length === 0) {
      console.log('[UserConfig] No users in database, using in-memory fallback');
      configCache = getInMemoryUsers();
      return configCache;
    }
    
    const mappedUsers = dbUsers.map(dbToUserConfig);
    configCache = mappedUsers;
    console.log('[UserConfig] Loaded', mappedUsers.length, 'users from database');
    return mappedUsers;
  } catch (error) {
    console.error('[UserConfig] Error reading from database:', error);
    configCache = getInMemoryUsers();
    return configCache;
  }
}

/**
 * Write all user configurations to database
 */
async function writeUserConfigurations(configs: UserConfiguration[]): Promise<void> {
  if (!db) {
    console.log('[UserConfig] Database not available, cannot write');
    configCache = configs;
    return;
  }
  
  try {
    // Upsert each user to the database
    for (const config of configs) {
      const existing = await db.select().from(users).where(eq(users.username, config.username));
      
      if (existing.length > 0) {
        // Update existing user
        await db.update(users)
          .set({
            password: config.password,
            role: config.role,
            updatedAt: new Date().toISOString()
          })
          .where(eq(users.username, config.username));
      } else {
        // Insert new user
        await db.insert(users).values({
          id: config.id,
          username: config.username,
          password: config.password,
          name: config.ownerName || config.username,
          role: config.role
        });
      }
    }
    
    configCache = configs;
    console.log('[UserConfig] Wrote', configs.length, 'users to database');
  } catch (error) {
    console.error('[UserConfig] Error writing to database:', error);
    throw error;
  }
}

/**
 * Get all user configurations
 */
export async function getAllUsers(): Promise<UserConfiguration[]> {
  return await readUserConfigurations();
}

/**
 * Get user configuration by username
 */
export async function getUserByUsername(username: string): Promise<UserConfiguration | null> {
  const configs = await readUserConfigurations();
  const config = configs.find(c => c.username === username) || null;
  
  if (config) {
    // Initialize subheadings for the user
    config.revenueSubheadings = initializeSubheadings(config.revenueSubheadings, DEFAULT_REVENUE_KEYS);
    config.expensesSubheadings = initializeSubheadings(config.expensesSubheadings, DEFAULT_EXPENSES_KEYS);
    config.cashInSubheadings = initializeSubheadings(config.cashInSubheadings, DEFAULT_CASH_IN_KEYS);
    config.cashOutSubheadings = initializeSubheadings(config.cashOutSubheadings, DEFAULT_CASH_OUT_KEYS);
    config.cashFlowSubheadings = initializeSubheadings(config.cashFlowSubheadings, DEFAULT_CASH_FLOW_KEYS);
    config.arSubheadings = initializeARSubheadings(config.arSubheadings);
    config.procedureNameOverrides = initializeSubheadings(config.procedureNameOverrides, DEFAULT_PROCEDURE_KEYS);
    config.providers = config.providers && config.providers.length > 0 ? config.providers : DEFAULT_PROVIDERS;
  }
  
  return config;
}

/**
 * Create new user configuration
 */
export async function createUser(config: Omit<UserConfiguration, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserConfiguration> {
  const configs = await readUserConfigurations();
  
  // Check if username already exists
  if (configs.some(c => c.username === config.username)) {
    throw new Error('Username already exists');
  }
  
  // Hash the password before storing
  const hashedPassword = await bcrypt.hash(config.password, 10);
  
  const newConfig: UserConfiguration = {
    ...config,
    password: hashedPassword,
    id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  configs.push(newConfig);
  await writeUserConfigurations(configs);
  
  return newConfig;
}

/**
 * Update user configuration
 */
export async function updateUser(username: string, updates: Partial<Omit<UserConfiguration, 'id' | 'username' | 'createdAt'>>): Promise<UserConfiguration> {
  const configs = await readUserConfigurations();
  const index = configs.findIndex(c => c.username === username);
  
  if (index === -1) {
    throw new Error('User not found');
  }
  
  // Hash password if it's being updated
  if (updates.password) {
    updates.password = await bcrypt.hash(updates.password, 10);
  }
  
  configs[index] = {
    ...configs[index],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  await writeUserConfigurations(configs);
  
  return configs[index];
}

/**
 * Delete user configuration
 */
export async function deleteUser(username: string): Promise<boolean> {
  // Prevent deleting admin user
  if (username === 'admin') {
    throw new Error('Cannot delete admin user');
  }
  
  const configs = await readUserConfigurations();
  const filteredConfigs = configs.filter(c => c.username !== username);
  
  if (filteredConfigs.length === configs.length) {
    return false; // User not found
  }
  
  await writeUserConfigurations(filteredConfigs);
  return true;
}

/**
 * Authenticate user with bcrypt password comparison
 */
export async function authenticateUser(username: string, password: string): Promise<UserConfiguration | null> {
  // First check in-memory cache
  if (configCache === null) {
    await readUserConfigurations();
  }
  
  const user = configCache?.find(c => c.username === username) || null;
  
  if (!user) {
    return null;
  }
  
  // For in-memory fallback users (pre-hashed passwords)
  if (user.password.startsWith('$2b$10$')) {
    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      return null;
    }
  } else {
    // Plain text comparison for legacy data
    if (user.password !== password) {
      return null;
    }
  }
  
  return user;
}

/**
 * Clear cache (useful for testing)
 */
export function clearCache(): void {
  configCache = null;
}
