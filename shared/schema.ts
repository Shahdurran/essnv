import { pgTable, text, varchar, timestamp, boolean, integer, jsonb, serial } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Users table - manages both admin and regular users
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username').unique().notNull(),
  password: varchar('password').notNull(),
  email: varchar('email').unique(),
  role: varchar('role').default('user'), // 'admin' or 'user'
  createdAt: timestamp('created_at').defaultNow(),
  // Configurable settings stored as JSONB
  settings: jsonb('settings').default({
    // Dashboard preferences
    defaultDashboardView: 'financial',
    dateRange: 'thisMonth',
    currency: 'USD',
    timezone: 'America/New_York',
    // Practice settings
    practiceName: '',
    practiceType: 'general',
    npiNumber: '',
    // Location settings
    defaultLocationId: '',
    // Procedure name overrides - maps procedure IDs to custom display names
    procedureNameOverrides: {},
    // Clinical settings
    clinicalSubheading: '',
    // Notification preferences
    emailAlerts: true,
    budgetAlerts: true,
    // UI preferences
    compactMode: false,
    darkMode: false,
  }),
});

// Practice locations table - NOW USER-ISOLATED with userId
export const practiceLocations = pgTable('practice_locations', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar('user_id').notNull(), // CRITICAL: Links location to specific user for isolation
  name: text('name').notNull(),
  address: text('address').default(''),
  city: text('city').default(''), // OPTIONAL with default
  state: text('state').default(''), // OPTIONAL with default
  zipCode: text('zip_code').default(''), // OPTIONAL with default
  phone: text('phone').default(''),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// Analytics data table - stores financial and operational metrics
export const analyticsData = pgTable('analytics_data', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id').notNull(), // Isolates data per user
  date: timestamp('date').defaultNow(),
  category: varchar('category').notNull(), // 'revenue', 'expenses', 'procedures', 'collections'
  subcategory: varchar('subcategory').default(''),
  value: integer('value').notNull(),
  locationId: varchar('location_id'), // Optional location reference
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow(),
});

// Financial records table - tracks income and expenses
export const financialRecords = pgTable('financial_records', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id').notNull(), // Isolates data per user
  date: timestamp('date').defaultNow(),
  type: varchar('type').notNull(), // 'income' or 'expense'
  category: varchar('category').notNull(),
  amount: integer('amount').notNull(),
  description: text('description'),
  locationId: varchar('location_id'), // Optional location reference
  isRecurring: boolean('is_recurring').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// Patient records table (optional extension for billing analytics)
export const patientRecords = pgTable('patient_records', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id').notNull(), // Isolates data per user
  patientId: varchar('patient_id').notNull(),
  dateOfService: timestamp('date_of_service').defaultNow(),
  procedureCodes: text('procedure_codes').array(),
  totalCharges: integer('total_charges').default(0),
  insurancePayments: integer('insurance_payments').default(0),
  patientPayments: integer('patient_payments').default(0),
  outstandingBalance: integer('outstanding_balance').default(0),
  claimStatus: varchar('claim_status').default('pending'), // pending, submitted, approved, denied
  createdAt: timestamp('created_at').defaultNow(),
});

// Insurance claims tracking
export const insuranceClaims = pgTable('insurance_claims', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id').notNull(), // Isolates data per user
  patientId: varchar('patient_id').notNull(),
  claimNumber: varchar('claim_number'),
  insuranceProvider: varchar('insurance_provider'),
  dateSubmitted: timestamp('date_submitted').defaultNow(),
  dateOfService: timestamp('date_of_service').defaultNow(),
  totalAmount: integer('total_amount').default(0),
  paidAmount: integer('paid_amount').default(0),
  deniedAmount: integer('denied_amount').default(0),
  outstandingAmount: integer('outstanding_amount').default(0),
  status: varchar('status').default('pending'), // pending, in_review, approved, denied, appealed
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Audit log for tracking changes
export const auditLog = pgTable('audit_log', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id').notNull(), // Isolates logs per user
  action: varchar('action').notNull(),
  entityType: varchar('entity_type').notNull(),
  entityId: varchar('entity_id'),
  previousValues: jsonb('previous_values'),
  newValues: jsonb('new_values'),
  ipAddress: varchar('ip_address'),
  createdAt: timestamp('created_at').defaultNow(),
});
