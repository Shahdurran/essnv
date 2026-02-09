import { pgTable, text, varchar, timestamp, boolean, integer, jsonb, serial, decimal, primaryKey } from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';
import { z } from 'zod';

// ============ ZOD SCHEMAS FOR VALIDATION ============

// Zod schema for AI queries
export const insertAiQuerySchema = z.object({
  userId: z.string(),
  query: z.string().min(1),
  response: z.string().optional(),
  category: z.string().optional(),
  tokensUsed: z.number().optional(),
  processingTime: z.number().optional(),
});

// ============ USER MANAGEMENT ============

// Users table - manages both admin and regular users
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username').unique().notNull(),
  password: varchar('password').notNull(),
  name: varchar('name'),
  email: varchar('email').unique(),
  role: varchar('role').default('user'), // 'admin', 'user', or 'practice_owner'
  practiceId: varchar('practice_id'),
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

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ============ PRACTICE LOCATIONS ============

// Practice locations table - user-isolated with userId
export const practiceLocations = pgTable('practice_locations', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar('user_id').default(''), // Links location to specific user for isolation
  name: text('name').notNull(),
  address: text('address').default(''),
  city: text('city').default(''), // OPTIONAL with default
  state: text('state').default(''), // OPTIONAL with default
  zipCode: text('zip_code').default(''), // OPTIONAL with default
  phone: text('phone').default(''),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export type PracticeLocation = typeof practiceLocations.$inferSelect;
export type InsertPracticeLocation = typeof practiceLocations.$inferInsert;

// ============ FINANCIAL DATA ============

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

// Revenue categories for P&L reports
export const plMonthlyData = pgTable('pl_monthly_data', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id').notNull(),
  month: varchar('month').notNull(), // Format: 'YYYY-MM'
  category: varchar('category').notNull(),
  subcategory: varchar('subcategory').default(''),
  amount: integer('amount').default(0),
  locationId: varchar('location_id'),
  createdAt: timestamp('created_at').defaultNow(),
});

export type PlMonthlyData = typeof plMonthlyData.$inferSelect;
export type InsertPlMonthlyData = typeof plMonthlyData.$inferInsert;

// Cash flow categories
export const cashFlowData = pgTable('cash_flow_data', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id').notNull(),
  month: varchar('month').notNull(),
  category: varchar('category').notNull(),
  amount: integer('amount').default(0),
  locationId: varchar('location_id'),
  createdAt: timestamp('created_at').defaultNow(),
});

export type CashFlowData = typeof cashFlowData.$inferSelect;
export type InsertCashFlowData = typeof cashFlowData.$inferInsert;

// P&L categories
export const profitLossData = pgTable('profit_loss_data', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id').notNull(),
  month: varchar('month').notNull(),
  category: varchar('category').notNull(),
  subcategory: varchar('subcategory').default(''),
  amount: integer('amount').default(0),
  locationId: varchar('location_id'),
  createdAt: timestamp('created_at').defaultNow(),
});

export type ProfitLossData = typeof profitLossData.$inferSelect;
export type InsertProfitLossData = typeof profitLossData.$inferInsert;

// Revenue categories
export const financialRevenueCategory = pgTable('financial_revenue_category', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id').notNull(),
  categoryName: varchar('category_name').notNull(),
  sortOrder: integer('sort_order').default(0),
  isVisible: boolean('is_visible').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export type FinancialRevenueCategory = typeof financialRevenueCategory.$inferSelect;
export type InsertFinancialRevenueCategory = typeof financialRevenueCategory.$inferInsert;

// Expense categories
export const financialExpenseCategory = pgTable('financial_expense_category', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id').notNull(),
  categoryName: varchar('category_name').notNull(),
  sortOrder: integer('sort_order').default(0),
  isVisible: boolean('is_visible').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export type FinancialExpenseCategory = typeof financialExpenseCategory.$inferSelect;
export type InsertFinancialExpenseCategory = typeof financialExpenseCategory.$inferInsert;

// Cash in categories
export const cashInCategory = pgTable('cash_in_category', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id').notNull(),
  categoryName: varchar('category_name').notNull(),
  sortOrder: integer('sort_order').default(0),
  isVisible: boolean('is_visible').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export type CashInCategory = typeof cashInCategory.$inferSelect;
export type InsertCashInCategory = typeof cashInCategory.$inferInsert;

// Cash out categories
export const cashOutCategory = pgTable('cash_out_category', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id').notNull(),
  categoryName: varchar('category_name').notNull(),
  sortOrder: integer('sort_order').default(0),
  isVisible: boolean('is_visible').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export type CashOutCategory = typeof cashOutCategory.$inferSelect;
export type InsertCashOutCategory = typeof cashOutCategory.$inferInsert;

// ============ PATIENT DATA ============

// Patient records table
export const patient = pgTable('patient', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id').notNull(),
  firstName: varchar('first_name').notNull(),
  lastName: varchar('last_name').notNull(),
  dateOfBirth: varchar('date_of_birth'),
  phone: varchar('phone'),
  email: varchar('email'),
  address: text('address'),
  city: varchar('city'),
  state: varchar('state'),
  zipCode: varchar('zip_code'),
  insuranceProvider: varchar('insurance_provider'),
  insuranceId: varchar('insurance_id'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export type Patient = typeof patient.$inferSelect;
export type InsertPatient = typeof patient.$inferInsert;

// Procedures table
export const procedure = pgTable('procedure', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id').notNull(),
  cptCode: varchar('cpt_code').notNull(),
  description: varchar('description').notNull(),
  category: varchar('category'),
  basePrice: decimal('base_price', { precision: 10, scale: 2 }).default('0'),
  rvuValue: decimal('rvu_value', { precision: 10, scale: 2 }).default('0'),
  createdAt: timestamp('created_at').defaultNow(),
});

export type Procedure = typeof procedure.$inferSelect;
export type InsertProcedure = typeof procedure.$inferInsert;

// Patient visits table
export const patientVisit = pgTable('patient_visit', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id').notNull(),
  patientId: varchar('patient_id').notNull(),
  visitDate: timestamp('visit_date').defaultNow(),
  providerName: varchar('provider_name'),
  locationId: varchar('location_id'),
  visitType: varchar('visit_type'),
  totalCharges: integer('total_charges').default(0),
  insurancePayment: integer('insurance_payment').default(0),
  patientPayment: integer('patient_payment').default(0),
  outstandingBalance: integer('outstanding_balance').default(0),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

export type PatientVisit = typeof patientVisit.$inferSelect;
export type InsertPatientVisit = typeof patientVisit.$inferInsert;

// Visit procedures junction table
export const visitProcedure = pgTable('visit_procedure', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id').notNull(),
  visitId: varchar('visit_id').notNull(),
  procedureId: varchar('procedure_id').notNull(),
  units: integer('units').default(1),
  price: integer('price').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

export type VisitProcedure = typeof visitProcedure.$inferSelect;
export type InsertVisitProcedure = typeof visitProcedure.$inferInsert;

// ============ INSURANCE & CLAIMS ============

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

// ============ AI ASSISTANT ============

// AI Query logs
export const aiQuery = pgTable('ai_query', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id').notNull(),
  query: text('query').notNull(),
  response: text('response'),
  category: varchar('category'),
  tokensUsed: integer('tokens_used').default(0),
  processingTime: integer('processing_time').default(0), // in milliseconds
  createdAt: timestamp('created_at').defaultNow(),
});

export type AiQuery = typeof aiQuery.$inferSelect;
export type InsertAiQuery = typeof aiQuery.$inferInsert;

// ============ PERFORMANCE METRICS ============

// Performance metrics tracking
export const performanceMetric = pgTable('performance_metric', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id').notNull(),
  metricDate: timestamp('metric_date').defaultNow(),
  metricType: varchar('metric_type').notNull(), // 'revenue', 'patients', 'procedures', 'collections', 'ar_aging'
  metricValue: decimal('metric_value', { precision: 10, scale: 2 }),
  locationId: varchar('location_id'),
  providerId: varchar('provider_id'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

export type PerformanceMetric = typeof performanceMetric.$inferSelect;
export type InsertPerformanceMetric = typeof performanceMetric.$inferInsert;

// ============ DASHBOARD CUSTOMIZATION ============

// Dashboard customization settings
export const dashboardCustomization = pgTable('dashboard_customization', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id').notNull(),
  widgetType: varchar('widget_type').notNull(),
  widgetName: varchar('widget_name'),
  position: integer('position').default(0),
  isVisible: boolean('is_visible').default(true),
  config: jsonb('config').default({}),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export type DashboardCustomization = typeof dashboardCustomization.$inferSelect;
export type InsertDashboardCustomization = typeof dashboardCustomization.$inferInsert;

// ============ ANALYTICS DATA ============

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

// ============ RELATIONS ============

// Users relations
export const usersRelations = relations(users, ({ many }) => ({
  locations: many(practiceLocations),
  financialRecords: many(financialRecords),
  patients: many(patient),
  procedures: many(procedure),
  visits: many(patientVisit),
  aiQueries: many(aiQuery),
  performanceMetrics: many(performanceMetric),
}));

// Practice locations relations
export const practiceLocationsRelations = relations(practiceLocations, ({ one }) => ({
  user: one(users, {
    fields: [practiceLocations.userId],
    references: [users.username],
  }),
}));
