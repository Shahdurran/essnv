/*
 * SHARED SCHEMA DEFINITION FILE
 * ============================
 * 
 * This file defines the DATABASE SCHEMA and TYPE DEFINITIONS that are shared
 * between both the frontend (client) and backend (server) code.
 * 
 * WHAT IS A SCHEMA?
 * A schema is like a blueprint for your database - it defines what tables exist,
 * what columns each table has, what data types those columns store, and how
 * tables relate to each other.
 * 
 * WHY IS THIS SHARED?
 * By keeping the schema in a "shared" folder, both our frontend and backend
 * can import the exact same type definitions. This prevents bugs where the
 * frontend expects different data than the backend provides.
 * 
 * LIBRARIES USED:
 * - drizzle-orm: A TypeScript ORM (Object Relational Mapping) tool that lets us
 *   define database schemas using TypeScript instead of raw SQL
 * - drizzle-zod: Automatically generates validation schemas from our database schema
 * - zod: A TypeScript-first schema validation library that ensures data is the right format
 */

// Import Drizzle ORM functions for building database schemas
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, json, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

/*
 * USERS TABLE DEFINITION
 * ======================
 * 
 * This table stores information about people who can log into the system.
 * In our medical practice app, this includes doctors, staff, and administrators.
 * 
 * TYPESCRIPT/DRIZZLE SYNTAX EXPLANATION:
 * - `export const users = pgTable(...)` creates a PostgreSQL table definition
 * - `pgTable` is a Drizzle function that defines a PostgreSQL table
 * - The first parameter "users" is the actual table name in the database
 * - The second parameter is an object defining all the columns
 * 
 * COLUMN EXPLANATIONS:
 * - id: A unique identifier for each user (UUID = Universally Unique Identifier)
 *   - varchar("id") = variable-length character field
 *   - .primaryKey() = this column uniquely identifies each row
 *   - .default(sql`gen_random_uuid()`) = automatically generate a random UUID when creating new users
 * 
 * - username: The login name (like "dr.smith" or "jane.nurse")
 *   - text("username") = unlimited length text field
 *   - .notNull() = this field is required, cannot be empty
 *   - .unique() = no two users can have the same username
 * 
 * - password: Encrypted password for login security
 *   - In a real app, this would be hashed/encrypted, never stored as plain text
 * 
 * - name: The person's real name (like "Dr. Sarah Smith")
 * 
 * - role: What type of user this is
 *   - Could be "practice_owner", "staff", "admin", etc.
 *   - Used to control what parts of the app they can access
 * 
 * - practiceId: Links this user to a specific medical practice
 *   - Some users might work at multiple practices, others just one
 */
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull(), // practice_owner, staff, admin
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

/*
 * PRACTICE LOCATIONS TABLE
 * ========================
 * 
 * This table stores information about each physical office/clinic location.
 * Our demo practice has 5 locations across different states.
 * 
 * WHY SEPARATE LOCATIONS?
 * Medical practices often have multiple offices. Each location might have:
 * - Different staff members
 * - Different equipment and capabilities  
 * - Different patient volumes and revenue
 * - Different insurance contracts and rates
 * 
 * Our analytics need to show data both by individual location AND combined across all locations.
 * 
 * COLUMN DETAILS:
 * - name: Short identifier like "Manhattan, NY" or "Fresno, CA"
 * - address/city/state/zipCode: Full address information for the clinic
 * - phone: Contact number for this specific location
 * - isActive: boolean (true/false) field to mark if location is currently operating
 *   - .default(true) means new locations are active unless specified otherwise
 *   - This lets us "soft delete" locations by marking them inactive instead of removing data
 */
export const practiceLocations = pgTable("practice_locations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // Only name is required
  address: text("address").default(''),
  city: text("city").default(''),
  state: text("state").default(''),
  zipCode: text("zip_code").default(''),
  phone: text("phone").default(''),
  isActive: boolean("is_active").default(true),
});

/*
 * PATIENTS TABLE
 * ==============
 * 
 * Stores basic information about each patient in the practice.
 * This is carefully designed to respect medical privacy laws (HIPAA).
 * 
 * IMPORTANT: MEDICAL DATA PRIVACY
 * In a real medical application, this data would be:
 * - Encrypted at rest and in transit
 * - Access-controlled (only authorized staff can view)
 * - Audit-logged (track who accessed what patient data when)
 * - Regularly backed up with strong security
 * 
 * FOREIGN KEY RELATIONSHIP:
 * - locationId references practiceLocations.id
 * - This creates a "relationship" between tables
 * - Each patient is associated with a specific practice location
 * - .references(() => practiceLocations.id) tells the database to enforce this relationship
 * 
 * TIMESTAMP DATA TYPES:
 * - timestamp stores both date and time (like "2025-01-15 14:30:00")
 * - .defaultNow() automatically sets the current date/time when creating a new record
 * - Useful for tracking when patients first joined the practice
 * 
 * DATA ANALYTICS PURPOSE:
 * This patient data enables analytics like:
 * - Patient volume trends over time
 * - Demographics analysis
 * - Insurance provider breakdowns
 * - Location-based patient distribution
 */
export const patients = pgTable("patients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  locationId: varchar("location_id").references(() => practiceLocations.id),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  dateOfBirth: timestamp("date_of_birth"),
  insuranceProvider: text("insurance_provider"),
  createdAt: timestamp("created_at").defaultNow(),
});

/*
 * PROCEDURES TABLE  
 * ================
 * 
 * This table defines all the medical procedures that the practice can perform.
 * Each procedure has billing codes, pricing, and categorization information.
 * 
 * MEDICAL BILLING CONCEPTS:
 * - CPT Code: "Current Procedural Terminology" - standardized codes for medical procedures
 *   - Example: "99213" = Established patient office visit, moderate complexity
 *   - Example: "17110" = Destruction of benign or premalignant lesion
 *   - These are universal codes used across all US healthcare for billing insurance
 * 
 * - RVU: "Relative Value Unit" - a measure of the resources required for a procedure
 *   - Used by Medicare and insurance companies to determine reimbursement rates
 *   - Higher RVU = more complex/time-consuming procedure = higher reimbursement
 * 
 * DECIMAL DATA TYPE EXPLANATION:
 * - decimal(10, 2) means: up to 10 total digits, with 2 digits after the decimal point
 *   - So basePrice could store values like: 1234567.89 (10 digits total, 2 after decimal)
 *   - This is better than regular numbers for money because it avoids rounding errors
 * 
 * - decimal(8, 4) for RVU means: up to 8 total digits, 4 after decimal
 *   - Example: 1234.5678 (precise measurement for government reimbursement calculations)
 * 
 * CATEGORY FIELD:
 * - "medical": Essential healthcare (skin cancer removal, rash treatment, etc.)
 * - "cosmetic": Elective appearance improvements (Botox, chemical peels, etc.)
 * - Important distinction for insurance (medical is usually covered, cosmetic often isn't)
 */
export const procedures = pgTable("procedures", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cptCode: text("cpt_code").notNull().unique(),
  description: text("description").notNull(),
  category: text("category").notNull(), // medical, cosmetic, refractive
  basePrice: decimal("base_price", { precision: 10, scale: 2 }),
  rvuValue: decimal("rvu_value", { precision: 8, scale: 4 }),
});

/*
 * PATIENT VISITS TABLE
 * ====================
 * 
 * This is the "transaction" table that records each time a patient comes to the clinic.
 * Each visit can include multiple procedures and generates revenue for the practice.
 * 
 * MULTIPLE FOREIGN KEY RELATIONSHIPS:
 * - patientId: Links to the patients table (which patient had this visit?)
 * - locationId: Links to practiceLocations table (which office was this visit at?)
 * - Having both references lets us analyze data by patient AND by location
 * 
 * VISIT TYPES IN MEDICAL BILLING:
 * - "new_patient": First time this patient has been seen by this practice
 *   - Insurance typically pays more for new patient visits (more time needed)
 * - "established_patient": Patient has been seen before (follow-up, routine care)
 *   - Usually shorter visits, lower reimbursement rates
 * 
 * REVENUE TRACKING FIELDS:
 * - totalRevenue: The total amount charged for this visit (all procedures combined)
 * - insurancePaid: How much the insurance company actually paid
 * - patientPaid: How much the patient paid out-of-pocket (copays, deductibles, etc.)
 * 
 * IMPORTANT FINANCIAL RELATIONSHIP:
 * totalRevenue = insurancePaid + patientPaid + (amount still owed or written off)
 * 
 * STATUS FIELD FOR OPERATIONAL TRACKING:
 * - "scheduled": Appointment is booked but hasn't happened yet
 * - "completed": Visit occurred and was properly documented  
 * - "cancelled": Patient cancelled before the visit
 * - "no_show": Patient didn't show up for scheduled appointment
 * 
 * WHY TRACK NO-SHOWS AND CANCELLATIONS?
 * - Helps identify scheduling patterns and patient behavior
 * - Important for operational efficiency (wasted time slots = lost revenue)
 * - Some practices charge fees for excessive no-shows
 */
export const patientVisits = pgTable("patient_visits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").references(() => patients.id),
  locationId: varchar("location_id").references(() => practiceLocations.id),
  visitDate: timestamp("visit_date").notNull(),
  visitType: text("visit_type"), // new_patient, established_patient
  totalRevenue: decimal("total_revenue", { precision: 10, scale: 2 }),
  insurancePaid: decimal("insurance_paid", { precision: 10, scale: 2 }),
  patientPaid: decimal("patient_paid", { precision: 10, scale: 2 }),
  status: text("status").default("completed"), // scheduled, completed, cancelled, no_show
});

/*
 * VISIT PROCEDURES TABLE (JUNCTION/BRIDGE TABLE)
 * ==============================================
 * 
 * This table connects patient visits with the specific procedures performed during each visit.
 * This is called a "junction table" or "bridge table" because it connects two other tables.
 * 
 * WHY DO WE NEED THIS SEPARATE TABLE?
 * A single patient visit might include multiple procedures:
 * - Example: Patient comes in for skin cancer screening
 *   - Procedure 1: Initial consultation (CPT 99213)
 *   - Procedure 2: Biopsy of suspicious mole (CPT 11100)  
 *   - Procedure 3: Liquid nitrogen treatment of wart (CPT 17110)
 * 
 * Without this table, we'd have to either:
 * - Limit visits to one procedure each (bad for business and patient care)
 * - Store multiple procedures in a single field (makes queries very difficult)
 * 
 * MANY-TO-MANY RELATIONSHIP:
 * - One visit can have many procedures
 * - One procedure type can be performed in many different visits
 * - This table creates a "many-to-many" relationship between visits and procedures
 * 
 * FOREIGN KEY REFERENCES:
 * - visitId: Which specific patient visit was this procedure part of?
 * - procedureId: Which type of procedure was performed?
 * 
 * BILLING AND INSURANCE TRACKING:
 * - quantity: How many times was this procedure performed? (e.g., 3 biopsies)
 * - chargedAmount: What was the total charge for this procedure?
 * - paidAmount: How much was actually collected from insurance/patient?
 * - insuranceClaimDate: When was the claim submitted to insurance?
 * - insurancePaidDate: When did insurance actually pay?
 * 
 * ANALYTICS VALUE:
 * This detailed tracking enables sophisticated business intelligence:
 * - Which procedures are most profitable?
 * - How long does it take insurance companies to pay?
 * - What's the collection rate for different procedure types?
 * - Which procedures are growing/declining in volume?
 */
export const visitProcedures = pgTable("visit_procedures", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  visitId: varchar("visit_id").references(() => patientVisits.id),
  procedureId: varchar("procedure_id").references(() => procedures.id),
  quantity: integer("quantity").default(1),
  chargedAmount: decimal("charged_amount", { precision: 10, scale: 2 }),
  paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }),
  insuranceClaimDate: timestamp("insurance_claim_date"),
  insurancePaidDate: timestamp("insurance_paid_date"),
});

/*
 * AI QUERIES TABLE
 * ================
 * 
 * This table stores conversations between users and our AI business assistant.
 * It serves multiple purposes: user experience, analytics, and system improvement.
 * 
 * PURPOSE AND BENEFITS:
 * 1. CONVERSATION HISTORY: Users can see their previous questions and answers
 * 2. ANALYTICS: Track what users are asking about most (popular questions)
 * 3. SYSTEM IMPROVEMENT: Identify common queries to build better features
 * 4. AUDIT TRAIL: Track who asked what when (important for medical compliance)
 * 
 * FIELD EXPLANATIONS:
 * - userId: Which user asked this question? (links to users table)
 * - query: The actual question the user typed (e.g., "What's our revenue trend?")
 * - response: The AI's answer to the question
 * - queryType: Category of question for analytics
 *   - "forecast": Questions about future predictions
 *   - "revenue_analysis": Questions about financial performance
 *   - "patient_volume": Questions about patient numbers and trends
 *   - "comparative": Questions comparing locations or time periods
 * 
 * MODERN AI APPLICATION PATTERN:
 * This follows a common pattern in AI applications where you store both:
 * - The raw conversation (for user experience)
 * - Structured metadata (for analytics and improvement)
 * 
 * PRIVACY AND COMPLIANCE CONSIDERATIONS:
 * - No patient names or PHI (Protected Health Information) should be stored here
 * - Only aggregate data and business intelligence queries
 * - Helps demonstrate to auditors that patient privacy is protected
 */
export const aiQueries = pgTable("ai_queries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  query: text("query").notNull(),
  response: text("response"),
  queryType: text("query_type"), // forecast, revenue_analysis, patient_volume, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

/*
 * PERFORMANCE METRICS TABLE
 * =========================
 * 
 * This table stores calculated business metrics over time. Think of it as a "data warehouse"
 * for pre-calculated analytics that would be expensive to compute on-demand.
 * 
 * WHY PRE-CALCULATE METRICS?
 * Instead of calculating "monthly revenue" every time someone loads the dashboard,
 * we calculate it once per day/week/month and store the result here. This makes
 * the dashboard load much faster, especially with lots of historical data.
 * 
 * FLEXIBLE DESIGN APPROACH:
 * This table uses a "key-value" pattern where:
 * - metricType describes what we're measuring
 * - value stores the calculated number
 * - metricDate stores when this measurement was taken
 * 
 * EXAMPLE METRIC TYPES:
 * - "monthly_revenue": Total revenue for a specific month
 * - "patient_count": Number of patients seen in a period
 * - "ar_days": Average days to collect payment (Accounts Receivable)
 * - "clean_claim_rate": Percentage of insurance claims paid without issues
 * - "no_show_rate": Percentage of appointments where patients didn't show up
 * 
 * JSON FIELD FOR COMPLEX DATA:
 * - additionalData uses PostgreSQL's native JSON support
 * - Can store complex objects like: {"by_insurance": {"BlueCross": 45000, "Aetna": 32000}}
 * - Allows flexibility without creating new columns for every possible breakdown
 * 
 * PRECISION FOR FINANCIAL DATA:
 * - decimal(15, 2) can store very large financial values accurately
 * - 15 total digits, 2 after decimal: up to $999,999,999,999.99
 * - Critical for medical practices with multi-million dollar annual revenue
 * 
 * TIME-SERIES ANALYTICS:
 * By storing metrics with timestamps, we can:
 * - Track trends over time ("Revenue is up 15% compared to last year")
 * - Create forecasts based on historical patterns
 * - Identify seasonal variations (cosmetic procedures peak in spring/summer)
 */
export const performanceMetrics = pgTable("performance_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  locationId: varchar("location_id").references(() => practiceLocations.id),
  metricDate: timestamp("metric_date").notNull(),
  metricType: text("metric_type").notNull(), // monthly_revenue, patient_count, ar_days, etc.
  value: decimal("value", { precision: 15, scale: 2 }),
  additionalData: json("additional_data"), // For storing complex metric data
});

/*
 * P&L MONTHLY DATA TABLE
 * ======================
 * 
 * Stores monthly Profit & Loss statement data broken down by line item.
 * This table contains actual financial data from the uploaded CSV file,
 * with monthly values from Sep-2024 to Aug-2025.
 * 
 * DESIGN PRINCIPLES:
 * - Each row represents one line item (e.g., "Office Visits") for one month
 * - categoryType distinguishes between revenue, direct_costs, operating_expenses, and calculated_totals
 * - Uses decimal type for precise financial calculations
 * - Links to practice locations for multi-location support
 * 
 * TIME PERIOD FILTERING:
 * - 1 month: Show August 2025 data only
 * - 3 months: Show June, July, August 2025 data
 * - 6 months: Show March through August 2025 data  
 * - 1 year: Show all data from Sep-2024 to Aug-2025
 */
export const plMonthlyData = pgTable("pl_monthly_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  locationId: varchar("location_id").references(() => practiceLocations.id),
  lineItem: text("line_item").notNull(), // "Office Visits", "Drug Acquisition (injections)", etc.
  categoryType: text("category_type").notNull(), // "revenue", "direct_costs", "operating_expenses", "calculated_totals"
  monthYear: text("month_year").notNull(), // "2024-09", "2024-10", "2025-08", etc.
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

/*
 * DASHBOARD CUSTOMIZATION TABLE
 * ==============================
 * 
 * This table stores customizable dashboard settings for practice-specific branding
 * and terminology. Enables POC demonstrations with client-specific customization.
 * 
 * PURPOSE:
 * - Allow practice-specific branding (logo, practice name, owner info)
 * - Customize widget titles to match practice terminology
 * - Override location names for client-specific naming conventions
 * 
 * CUSTOMIZATION SCOPE:
 * - Header branding: Logo, practice name, subtitle, owner photo and details
 * - Widget titles: Revenue, Expenses, Cash In/Out, Top Revenue Procedures
 * - Location names: Custom names for practice locations
 * 
 * STORAGE APPROACH:
 * - For POC: In-memory storage (resets on server restart)
 * - For production: Can be persisted to PostgreSQL database
 * - Images stored in file system (server/public/assets/)
 */
export const dashboardCustomization = pgTable("dashboard_customization", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  practiceId: varchar("practice_id"),
  
  // Header customization
  logoUrl: text("logo_url"),
  practiceName: text("practice_name").notNull(),
  practiceSubtitle: text("practice_subtitle"),
  ownerName: text("owner_name"),
  ownerTitle: text("owner_title"),
  ownerPhotoUrl: text("owner_photo_url"),
  
  // Widget title customization
  revenueTitle: text("revenue_title").default("Revenue"),
  expensesTitle: text("expenses_title").default("Expenses"),
  cashInTitle: text("cash_in_title").default("Cash In"),
  cashOutTitle: text("cash_out_title").default("Cash Out"),
  topRevenueTitle: text("top_revenue_title").default("Top Revenue Procedures"),
  
  // Location name overrides (JSON object: {locationId: customName})
  locationNameOverrides: json("location_name_overrides"),
  
  updatedAt: timestamp("updated_at").defaultNow(),
});

/*
 * VALIDATION SCHEMAS FOR DATA INSERTION
 * =====================================
 * 
 * These lines create "validation schemas" using the Zod library. They ensure that
 * data is properly formatted before it gets saved to the database.
 * 
 * WHAT IS ZOD?
 * Zod is a TypeScript library that validates data at runtime. It can check:
 * - Is this field a string or number?
 * - Is this email address format valid?
 * - Is this required field actually provided?
 * - Is this number within acceptable ranges?
 * 
 * WHY USE createInsertSchema()?
 * - createInsertSchema() automatically generates validation rules from our database schema
 * - If the database says a field is "text().notNull()", Zod will require a non-empty string
 * - If the database says "decimal(10,2)", Zod will ensure it's a valid decimal number
 * - This prevents bugs where frontend sends invalid data to the backend
 * 
 * WHY .omit({ id: true })?
 * - When creating new records, we usually don't provide the ID
 * - The database generates the ID automatically (using gen_random_uuid())
 * - .omit({ id: true }) removes the ID field from the validation requirements
 * - For some schemas, we also omit createdAt because it's set automatically
 * 
 * TYPESCRIPT INTEGRATION:
 * These schemas work together with TypeScript to provide:
 * - Compile-time type checking (catches errors while coding)
 * - Runtime validation (catches errors when the app is running)
 * - IntelliSense autocompletion in code editors
 */
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertPracticeLocationSchema = createInsertSchema(practiceLocations).omit({ id: true });
export const insertPatientSchema = createInsertSchema(patients).omit({ id: true });
export const insertProcedureSchema = createInsertSchema(procedures).omit({ id: true });
export const insertPatientVisitSchema = createInsertSchema(patientVisits).omit({ id: true });
export const insertVisitProcedureSchema = createInsertSchema(visitProcedures).omit({ id: true });
export const insertAiQuerySchema = createInsertSchema(aiQueries).omit({ id: true, createdAt: true });
export const insertPerformanceMetricSchema = createInsertSchema(performanceMetrics).omit({ id: true });
export const insertPlMonthlyDataSchema = createInsertSchema(plMonthlyData).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDashboardCustomizationSchema = createInsertSchema(dashboardCustomization).omit({ id: true, updatedAt: true });

/*
 * TYPESCRIPT TYPE DEFINITIONS
 * ===========================
 * 
 * These lines create TypeScript types that our frontend and backend can use.
 * Having shared types prevents bugs where different parts of the app expect different data formats.
 * 
 * TWO TYPES PER TABLE:
 * For each database table, we create two TypeScript types:
 * 
 * 1. SELECT TYPE (e.g., "User"): 
 *    - Represents data as it comes FROM the database
 *    - Includes all fields, including auto-generated ones (id, createdAt, etc.)
 *    - Used when displaying data to users
 * 
 * 2. INSERT TYPE (e.g., "InsertUser"):
 *    - Represents data as it goes TO the database  
 *    - Excludes auto-generated fields (no id, no createdAt)
 *    - Used when creating new records
 * 
 * DRIZZLE SYNTAX EXPLANATION:
 * - `typeof users.$inferSelect` means: "Look at the 'users' table definition and 
 *   automatically create a TypeScript type that includes all its columns"
 * - `z.infer<typeof insertUserSchema>` means: "Look at the Zod validation schema
 *   and automatically create a TypeScript type based on what fields it expects"
 * 
 * BENEFITS OF THIS APPROACH:
 * - If we change the database schema, TypeScript types update automatically
 * - No need to manually maintain separate type definitions
 * - Compiler will catch mismatches between database and code immediately
 * - IntelliSense shows available fields when coding
 * 
 * EXAMPLE USAGE:
 * ```typescript
 * // When fetching a user from database:
 * const user: User = await database.getUser(id);
 * 
 * // When creating a new user:
 * const newUserData: InsertUser = {
 *   username: "jane.doe",
 *   password: "hashedPassword",
 *   name: "Jane Doe",
 *   role: "staff"
 * };
 * ```
 */
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type PracticeLocation = typeof practiceLocations.$inferSelect;
export type InsertPracticeLocation = z.infer<typeof insertPracticeLocationSchema>;
export type Patient = typeof patients.$inferSelect;
export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type Procedure = typeof procedures.$inferSelect;
export type InsertProcedure = z.infer<typeof insertProcedureSchema>;
export type PatientVisit = typeof patientVisits.$inferSelect;
export type InsertPatientVisit = z.infer<typeof insertPatientVisitSchema>;
export type VisitProcedure = typeof visitProcedures.$inferSelect;
export type InsertVisitProcedure = z.infer<typeof insertVisitProcedureSchema>;
export type AiQuery = typeof aiQueries.$inferSelect;
export type InsertAiQuery = z.infer<typeof insertAiQuerySchema>;
export type PerformanceMetric = typeof performanceMetrics.$inferSelect;
export type InsertPerformanceMetric = z.infer<typeof insertPerformanceMetricSchema>;
export type PlMonthlyData = typeof plMonthlyData.$inferSelect;
export type InsertPlMonthlyData = z.infer<typeof insertPlMonthlyDataSchema>;
export type DashboardCustomization = typeof dashboardCustomization.$inferSelect;
export type InsertDashboardCustomization = z.infer<typeof insertDashboardCustomizationSchema>;

/*
 * FRONTEND-SPECIFIC TYPE DEFINITIONS
 * ==================================
 * 
 * The following interfaces define data structures used specifically by our React
 * frontend components. These are separate from database types because the frontend
 * often needs data in a different format than how it's stored in the database.
 * 
 * WHY SEPARATE FRONTEND TYPES?
 * - Database stores raw data optimized for storage and queries
 * - Frontend needs data formatted for charts, graphs, and user interfaces
 * - These types represent "view models" - data shaped for specific UI components
 */

/*
 * FINANCIAL ANALYSIS DATA TYPES
 * ==============================
 * 
 * These interfaces define data structures for the Financial Analysis widgets
 * including Revenue, Expenses, P&L Statement, Cash Flow, and Cash In/Out data.
 */

export interface FinancialRevenueCategory {
  id: string;
  name: string;
  amount: number;
  change: number;
  trend: "up" | "down" | "neutral";
}

export interface FinancialExpenseCategory {
  id: string;
  name: string;
  amount: number;
  change: number;
  trend: "up" | "down" | "neutral";
}

export interface ProfitLossData {
  revenue: Record<string, number>;
  expenses: Record<string, number>;
  period: string;
  locationId?: string;
}

export interface CashInCategory {
  id: string;
  name: string;
  amount: number;
  change: number;
  trend: "up" | "down" | "neutral";
}

export interface CashOutCategory {
  id: string;
  name: string;
  amount: number;
  change: number;
  trend: "up" | "down" | "neutral";
}

export interface CashFlowData {
  operating: Record<string, number>;
  investing: Record<string, number>;
  financing: Record<string, number>;
  period: string;
  locationId?: string;
}

/*
 * REVENUE DATA POINT INTERFACE
 * ============================
 * 
 * This interface defines the shape of data points used in revenue trend charts and graphs.
 * Each point represents revenue data for a specific month.
 * 
 * FIELD EXPLANATIONS:
 * - month: ISO date string like "2025-01" for January 2025
 * - monthName: Human-readable format like "Jan 2025" for display
 * - revenue: Total revenue amount for this month
 * - patientCount: Number of patients seen this month
 * - actualRevenue: Real historical data (null for future months)
 * - projectedRevenue: Forecasted data (null for past months)
 * - date: JavaScript Date object for easy date manipulation
 * - isProjected: Boolean flag - true for forecast data, false for historical
 * - ebitda: Earnings Before Interest, Taxes, Depreciation, and Amortization
 * - writeOffs: Amount of revenue written off as uncollectible
 * 
 * OPTIONAL FIELDS EXPLANATION:
 * Fields marked with "?" are optional and might not be present in all scenarios:
 * - monthName?: The "?" means this field is optional
 * - actualRevenue?: number | null means this can be a number OR null OR undefined
 * 
 * This flexible structure allows the same interface to represent:
 * - Historical data (actualRevenue filled, projectedRevenue null)
 * - Forecast data (projectedRevenue filled, actualRevenue null)
 * - Combined datasets for charts showing both historical and projected trends
 */
export interface RevenueDataPoint {
  month: string;
  monthName?: string;
  revenue: number;
  patientCount: number;
  actualRevenue?: number | null;
  projectedRevenue?: number | null;
  date: Date;
  isProjected: boolean;
  ebitda?: number;
  writeOffs?: number;
}

/*
 * PROCEDURE ANALYTICS INTERFACE
 * =============================
 * 
 * This interface defines how procedure performance data is structured for the
 * "Top Revenue Procedures" component and similar analytics displays.
 * 
 * UNION TYPE EXPLANATION:
 * - category: 'medical' | 'cosmetic' is a TypeScript "union type"
 * - This means category can ONLY be the string "medical" OR the string "cosmetic"
 * - Any other value will cause a TypeScript error
 * - This prevents bugs like accidentally setting category to "medicle" (typo)
 * 
 * FIELD PURPOSE:
 * - cptCode: The standardized procedure code (e.g., "99213")
 * - description: Human-readable name (e.g., "Botox Injection")
 * - category: Whether it's medical treatment or cosmetic enhancement
 * - revenue: Total revenue generated by this procedure in the selected time period
 * - growth: Percentage change compared to previous period (e.g., "+15%")
 * - basePrice: What the practice charges for this procedure (formatted string like "$450")
 * - monthlyVolume: Average number of times this procedure is performed per month
 * 
 * BUSINESS INTELLIGENCE USE:
 * This data helps practice owners understand:
 * - Which procedures are most profitable
 * - Whether procedure volumes are growing or declining
 * - How procedure mix affects overall practice revenue
 * - Whether pricing adjustments are needed
 */
export interface ProcedureAnalytics {
  cptCode: string;
  description: string;
  category: 'medical' | 'cosmetic';
  revenue: number;
  growth: string;
  basePrice?: string;
  monthlyVolume?: number;
}

/*
 * INSURANCE PAYER DATA INTERFACE
 * ==============================
 * 
 * This interface structures data about insurance companies and their payment patterns.
 * Used in charts showing insurance mix and accounts receivable analysis.
 * 
 * MEDICAL PRACTICE CONTEXT:
 * Medical practices work with many different insurance companies, each with
 * different payment rates, timeframes, and requirements.
 * 
 * FIELD EXPLANATIONS:
 * - name: Insurance company name (e.g., "Blue Cross Blue Shield", "Aetna", "Medicare")
 * - percentage: What percent of practice revenue comes from this insurance company
 * - arDays: Average days it takes this insurance company to pay claims
 * - revenue: Total revenue amount from this insurance company
 * - claimRate: What percentage of claims this insurance approves/pays (some deny more than others)
 * - color: Hex color code for consistent chart visualization (e.g., "#3B82F6")
 * 
 * BUSINESS ANALYTICS VALUE:
 * This helps practice owners:
 * - Identify which insurance companies are slow to pay (high arDays)
 * - See which insurers provide the most revenue
 * - Spot problem payers that deny claims frequently
 * - Make decisions about which insurance contracts to accept/renew
 * 
 * WHY AR DAYS MATTER:
 * "AR Days" (Accounts Receivable Days) is critical for cash flow:
 * - 30 days = excellent (insurance pays quickly)
 * - 45-60 days = typical for most insurance companies
 * - 90+ days = problematic (may indicate billing issues or difficult payer)
 */
export interface InsurancePayerData {
  name: string;
  percentage: number;
  arDays: number;
  revenue: number;
  claimRate?: number;
  color?: string;
}

/*
 * PROJECTION DATA INTERFACE
 * =========================
 * 
 * This interface defines the structure for future predictions/forecasts.
 * Used by AI-powered forecasting components to show expected business trends.
 * 
 * FORECASTING IN HEALTHCARE:
 * Medical practices need to predict future performance for:
 * - Staffing decisions (hire more doctors/nurses?)
 * - Facility planning (need more exam rooms?)
 * - Financial planning (will we meet revenue targets?)
 * - Equipment purchases (can we afford new laser equipment?)
 * 
 * CONFIDENCE LEVELS EXPLAINED:
 * - confidenceLevel: Number between 0 and 1 (e.g., 0.85 = 85% confident)
 * - Higher confidence = more reliable prediction
 * - Lower confidence = prediction could vary significantly
 * - Based on factors like historical data quality, seasonal variations, etc.
 * 
 * FIELD PURPOSES:
 * - month/monthName/date: When this prediction applies
 * - projectedPatients: Expected number of patients for this period
 * - projectedRevenue: Expected revenue amount
 * - growthRate: Expected growth compared to same period last year (e.g., "+12%")
 * - confidenceLevel: How reliable this prediction is (0.0 to 1.0)
 * 
 * AI/ML INTEGRATION:
 * These projections typically come from machine learning models that analyze:
 * - Historical patient volume patterns
 * - Seasonal trends (cosmetic procedures peak in spring/summer)
 * - Economic indicators affecting healthcare spending
 * - Local competition and market changes
 */
export interface ProjectionData {
  month: string;
  monthName?: string;
  projectedPatients: number;
  projectedRevenue: number;
  confidenceLevel: number;
  growthRate: string;
  date: Date;
}

/*
 * KEY METRICS INTERFACE
 * =====================
 * 
 * This interface defines the core performance indicators displayed prominently
 * on the dashboard. These are the most important numbers practice owners check daily.
 * 
 * WHAT ARE KEY PERFORMANCE INDICATORS (KPIs)?
 * KPIs are specific, measurable values that indicate how well a business is
 * performing against its goals. For medical practices, these metrics directly
 * relate to patient care quality and financial health.
 * 
 * METRIC EXPLANATIONS:
 * 
 * - monthlyPatients: Total patients seen this month
 *   * Indicates practice capacity and demand
 *   * Higher = more revenue potential, but need adequate staffing
 * 
 * - monthlyRevenue: Total revenue generated this month
 *   * Most direct measure of financial performance
 *   * Combines patient volume × average revenue per visit
 * 
 * - arDays: Average days to collect payment (Accounts Receivable Days)
 *   * Critical for cash flow management
 *   * Lower is better (faster payment = better cash flow)
 *   * Industry benchmark: 30-45 days is good, 60+ days needs attention
 * 
 * - cleanClaimRate: Percentage of insurance claims paid on first submission
 *   * Measures billing efficiency and accuracy
 *   * Higher is better (less rework, faster payment)
 *   * Target: 85%+ clean claim rate
 * 
 * - patientGrowth: Percent change in patient volume vs previous period
 *   * Shows whether practice is growing or shrinking
 *   * Format: "+8%" or "-3%"
 * 
 * - revenueGrowth: Percent change in revenue vs previous period
 *   * Overall financial performance trend
 *   * Should correlate with patient growth but can differ due to procedure mix
 * 
 * WHY STRING FORMAT FOR GROWTH?
 * Growth rates are stored as strings ("+8%") rather than numbers (0.08) because:
 * - Easier to display directly in UI components
 * - Includes sign (+ or -) and percentage symbol
 * - Avoids formatting calculations in multiple places
 */
export interface KeyMetrics {
  monthlyPatients: number;
  monthlyRevenue: number;
  arDays: number;
  cleanClaimRate: number;
  patientGrowth: string;
  revenueGrowth: string;
}

/*
 * POPULAR QUESTION INTERFACE
 * ==========================
 * 
 * This interface defines the structure for pre-defined questions that users
 * can quickly ask the AI assistant. Improves user experience by providing
 * common question templates.
 * 
 * USER EXPERIENCE DESIGN:
 * Rather than making users type questions from scratch, we provide popular
 * questions they can click on. This:
 * - Reduces typing and potential typos
 * - Shows users what kinds of questions the AI can answer
 * - Provides consistent wording for better AI understanding
 * - Speeds up interaction for common business questions
 * 
 * FIELD EXPLANATIONS:
 * - id: Unique identifier for tracking which questions are clicked most
 * - question: The actual question text (e.g., "What's our revenue trend this quarter?")
 * - icon: Lucide React icon name for visual representation (e.g., "TrendingUp")
 * - category: Groups related questions (e.g., "revenue", "patients", "forecasting")
 * - usage: Optional counter for how often this question is clicked
 * 
 * ANALYTICS AND IMPROVEMENT:
 * By tracking usage statistics, we can:
 * - Identify which questions are most valuable to users
 * - Reorganize questions based on popularity
 * - Add new questions based on common user patterns
 * - Remove questions that are never used
 * 
 * ICON INTEGRATION:
 * Icons help users quickly identify question types:
 * - TrendingUp: Growth and performance questions
 * - Users: Patient volume questions  
 * - DollarSign: Revenue and financial questions
 * - Calendar: Time-based and scheduling questions
 */
export interface PopularQuestion {
  id: string;
  question: string;
  icon: string;
  category: string;
  usage?: number;
}

/*
 * CHAT MESSAGE INTERFACE
 * ======================
 * 
 * This interface defines the structure for individual messages in the AI chat conversation.
 * Supports both user questions and AI responses with rich metadata.
 * 
 * CONVERSATIONAL AI DESIGN:
 * Modern AI assistants work best with conversational interfaces where users can:
 * - Ask questions in natural language
 * - See conversation history
 * - Get contextual responses with data and recommendations
 * 
 * UNION TYPE FOR MESSAGE TYPES:
 * - type: 'user' | 'ai' restricts values to exactly these two strings
 * - 'user': Messages typed by the human user
 * - 'ai': Responses generated by the AI assistant
 * 
 * CORE MESSAGE FIELDS:
 * - id: Unique identifier for each message (useful for React key props)
 * - content: The actual message text
 * - timestamp: When this message was created (for display and sorting)
 * 
 * OPTIONAL METADATA FIELDS:
 * - isWelcome: Marks initial greeting messages from AI
 * - isError: Indicates when something went wrong (API failures, etc.)
 * - queryType: Categorizes the type of question for analytics
 * - recommendations: Array of suggested follow-up questions or actions
 * - metrics: Key-value pairs of relevant data (e.g., {"revenue": "$245K", "growth": "+8%"})
 * 
 * RECORD TYPE EXPLANATION:
 * - Record<string, string | number> means an object where:
 *   - Keys are strings (the metric names)
 *   - Values can be either strings or numbers
 *   - Example: {"monthlyRevenue": 245000, "growthRate": "+8%"}
 * 
 * ENHANCED USER EXPERIENCE:
 * Rich metadata enables:
 * - Highlighting important metrics in chat bubbles
 * - Providing contextual follow-up suggestions
 * - Graceful error handling with helpful messages
 * - Different styling for different message types
 */
export interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: string;
  isWelcome?: boolean;
  isError?: boolean;
  queryType?: string;
  recommendations?: string[];
  metrics?: Record<string, string | number>;
}

/*
 * INSURANCE CLAIM INTERFACE
 * =========================
 * 
 * This interface represents individual insurance claims submitted for payment.
 * Used for tracking claim status and managing accounts receivable.
 * 
 * MEDICAL BILLING WORKFLOW:
 * When a patient receives treatment:
 * 1. Practice provides medical services
 * 2. Practice submits claim to patient's insurance company
 * 3. Insurance reviews claim (may approve, deny, or request more info)
 * 4. Insurance pays approved claims (usually partial payment)
 * 5. Patient is billed for remaining balance (deductibles, copays, etc.)
 * 
 * CLAIM STATUS MEANINGS:
 * - 'Pending': Claim has been submitted, waiting for insurance response
 * - 'Submitted': More specific status showing claim is in insurance system
 * - 'Denied': Insurance refused to pay (could be coding error, coverage issue, etc.)
 * 
 * NOTE ON STATUS DESIGN:
 * In this interface, we're using 'Submitted' and 'Pending' which might seem redundant.
 * This allows for future expansion where we could have more granular statuses like:
 * - 'Draft' (not yet submitted)
 * - 'Submitted' (sent to insurance)
 * - 'Under Review' (insurance is processing)
 * - 'Pending Documentation' (insurance needs more info)
 * 
 * FIELD EXPLANATIONS:
 * - id: Unique identifier for this specific claim
 * - locationId: Which practice location performed the service
 * - insuranceProvider: Name of insurance company (e.g., "Blue Cross")
 * - claimAmount: Dollar amount being claimed from insurance
 * - patientId: Links to the patient who received treatment
 * - cptCode: Procedure code that was performed
 * - dateSubmitted: When the claim was sent to insurance
 * - denialReason: If denied, why (e.g., "Service not covered", "Missing documentation")
 * - dateCreated: When this claim record was first created in our system
 */
export interface InsuranceClaim {
  id: string;
  locationId: string;
  insuranceProvider: string;
  status: 'Pending' | 'Submitted' | 'Denied';
  claimAmount: number;
  patientId: string;
  cptCode: string;
  dateSubmitted: string;
  denialReason?: string;
  dateCreated: string;
}

/*
 * CLAIMS BREAKDOWN INTERFACE
 * ==========================
 * 
 * This interface structures aggregated claims data for dashboard displays.
 * Instead of showing individual claims, this shows summaries by status and provider.
 * 
 * PURPOSE FOR AGGREGATION:
 * - Individual claims would be overwhelming (hundreds/thousands per month)
 * - Practice owners need high-level insights, not detailed transaction lists
 * - Aggregated data loads faster and is easier to visualize in charts
 * 
 * NESTED OBJECT STRUCTURE:
 * The 'providers' field contains an array of objects with specific properties.
 * This inline object definition (not a separate interface) keeps related data together:
 * 
 * providers: {
 *   name: string;        // Insurance company name
 *   claimCount: number;  // How many claims for this status/provider combination
 *   amount: number;      // Total dollar amount for these claims
 * }[]
 * 
 * The '[]' at the end means this is an array of these objects.
 * 
 * EXAMPLE DATA STRUCTURE:
 * {
 *   status: 'Pending',
 *   totalClaims: 156,
 *   totalAmount: 89500,
 *   providers: [
 *     { name: 'Blue Cross', claimCount: 45, amount: 32000 },
 *     { name: 'Aetna', claimCount: 38, amount: 28500 },
 *     { name: 'Medicare', claimCount: 73, amount: 29000 }
 *   ]
 * }
 * 
 * BUSINESS INTELLIGENCE USE:
 * This structure enables analysis like:
 * - Which insurance companies have the most pending claims?
 * - What's the total dollar amount at risk from denied claims?
 * - Which payers are creating bottlenecks in our cash flow?
 */
export interface ClaimsBreakdown {
  status: 'Pending' | 'Submitted' | 'Denied' | 'Paid';
  totalClaims: number;
  totalAmount: number;
  providers: {
    name: string;
    claimCount: number;
    amount: number;
  }[];
}
