/*
 * USER CONFIGURATIONS FILE STORAGE MODULE
 * ========================================
 * 
 * This module handles persistent storage of user configurations in a JSON file.
 * Provides CRUD operations and file locking to prevent concurrent write issues.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as defaultSubheadings from '../data/default-subheadings';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the user configurations JSON file
const CONFIG_FILE_PATH = path.join(__dirname, '../data/user-configurations.json');

export interface UserConfiguration {
  id: string;
  username: string;
  password: string; // In production, this would be hashed
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

// In-memory cache to reduce file I/O
let configCache: UserConfiguration[] | null = null;
let isWriting = false;

/**
 * Get default admin user configuration
 */
function getDefaultAdminConfig(): UserConfiguration {
  return {
    id: 'admin-default',
    username: 'admin',
    password: 'admin',
    role: 'admin',
    logoUrl: '/assets/MDS Logo_1754254040718-Dv0l5qLn.png',
    practiceName: 'MDS AI Analytics',
    practiceSubtitle: 'Eye Specialists & Surgeons of Northern Virginia',
    ownerName: 'Dr. John Josephson',
    ownerTitle: 'Practice Owner',
    ownerPhotoUrl: '/assets/Dr. John Josephson_1757862871625-B4_CVazU.jpeg',
    revenueTitle: 'Revenue',
    expensesTitle: 'Expenses',
    cashInTitle: 'Cash In',
    cashOutTitle: 'Cash Out',
    topRevenueTitle: 'Top Revenue Procedures',
    revenueSubheadings: defaultSubheadings.DEFAULT_REVENUE_SUBHEADINGS,
    expensesSubheadings: defaultSubheadings.DEFAULT_EXPENSES_SUBHEADINGS,
    cashInSubheadings: defaultSubheadings.DEFAULT_CASH_IN_SUBHEADINGS,
    cashOutSubheadings: defaultSubheadings.DEFAULT_CASH_OUT_SUBHEADINGS,
    cashFlowSubheadings: defaultSubheadings.DEFAULT_CASH_FLOW_SUBHEADINGS,
    arSubheadings: defaultSubheadings.DEFAULT_AR_SUBHEADINGS ?? {},
    procedureNameOverrides: {},
    locationNameOverrides: {},
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

/**
 * Ensure the data directory and config file exist
 */
async function ensureConfigFile(): Promise<void> {
  try {
    const dataDir = path.dirname(CONFIG_FILE_PATH);
    
    // Create data directory if it doesn't exist
    try {
      await fs.access(dataDir);
    } catch {
      await fs.mkdir(dataDir, { recursive: true });
    }
    
    // Check if config file exists
    try {
      await fs.access(CONFIG_FILE_PATH);
    } catch {
      // Create file with default admin user
      const defaultConfig = [getDefaultAdminConfig()];
      await fs.writeFile(CONFIG_FILE_PATH, JSON.stringify(defaultConfig, null, 2), 'utf-8');
      console.log('✅ Created user-configurations.json with default admin user');
    }
  } catch (error) {
    console.error('Error ensuring config file:', error);
    throw error;
  }
}

/**
 * Read all user configurations from file
 */
export async function readUserConfigurations(): Promise<UserConfiguration[]> {
  // Return cache if available
  if (configCache !== null) {
    return configCache;
  }
  
  try {
    await ensureConfigFile();
    const fileContent = await fs.readFile(CONFIG_FILE_PATH, 'utf-8');
    const configs = JSON.parse(fileContent) as UserConfiguration[];
    configCache = configs;
    return configs;
  } catch (error) {
    console.error('Error reading user configurations:', error);
    // Return default admin if file read fails
    const defaultConfig = [getDefaultAdminConfig()];
    configCache = defaultConfig;
    return defaultConfig;
  }
}

/**
 * Write all user configurations to file
 */
async function writeUserConfigurations(configs: UserConfiguration[]): Promise<void> {
  // Wait if another write is in progress
  while (isWriting) {
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  
  isWriting = true;
  
  try {
    await ensureConfigFile();
    await fs.writeFile(CONFIG_FILE_PATH, JSON.stringify(configs, null, 2), 'utf-8');
    configCache = configs;
  } catch (error) {
    console.error('Error writing user configurations:', error);
    throw error;
  } finally {
    isWriting = false;
  }
}

/**
 * Get all user configurations
 */
export async function getAllUsers(): Promise<UserConfiguration[]> {
  return await readUserConfigurations();
}

/**
 * Normalize user config for legacy users missing new fields (e.g. arSubheadings)
 */
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

function normalizeUserConfig(config: UserConfiguration): UserConfiguration {
  return {
    ...config,
    arSubheadings: config.arSubheadings && Object.keys(config.arSubheadings).length > 0
      ? config.arSubheadings
      : (defaultSubheadings.DEFAULT_AR_SUBHEADINGS ?? { '0-30': '0-30 days', '31-60': '31-60 days', '61-90': '61-90 days', '90+': '90+ days' }),
    providers: config.providers && config.providers.length > 0 ? config.providers : DEFAULT_PROVIDERS,
  };
}

/**
 * Get user configuration by username
 */
export async function getUserByUsername(username: string): Promise<UserConfiguration | null> {
  const configs = await readUserConfigurations();
  const config = configs.find(c => c.username === username) || null;
  return config ? normalizeUserConfig(config) : null;
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
  
  const newConfig: UserConfiguration = {
    ...config,
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
 * Authenticate user
 */
export async function authenticateUser(username: string, password: string): Promise<UserConfiguration | null> {
  const user = await getUserByUsername(username);
  
  if (!user) {
    return null;
  }
  
  // Simple password check (in production, use bcrypt)
  if (user.password === password) {
    return user;
  }
  
  return null;
}

/**
 * Clear cache (useful for testing)
 */
export function clearCache(): void {
  configCache = null;
}

