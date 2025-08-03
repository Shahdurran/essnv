import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, json, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User management for practice owners and staff
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull(), // practice_owner, staff, admin
  practiceId: varchar("practice_id"),
});

// Practice locations (Rao Dermatology has 5 locations)
export const practiceLocations = pgTable("practice_locations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // Manhattan NY, Atlantic Highlands NJ, etc.
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  phone: text("phone"),
  isActive: boolean("is_active").default(true),
});

// Patient data for analytics
export const patients = pgTable("patients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  locationId: varchar("location_id").references(() => practiceLocations.id),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  dateOfBirth: timestamp("date_of_birth"),
  insuranceProvider: text("insurance_provider"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Procedure codes and billing information
export const procedures = pgTable("procedures", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cptCode: text("cpt_code").notNull().unique(),
  description: text("description").notNull(),
  category: text("category").notNull(), // medical, cosmetic
  basePrice: decimal("base_price", { precision: 10, scale: 2 }),
  rvuValue: decimal("rvu_value", { precision: 8, scale: 4 }),
});

// Patient visits and appointments
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

// Procedures performed during visits
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

// AI Analytics queries and responses
export const aiQueries = pgTable("ai_queries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  query: text("query").notNull(),
  response: text("response"),
  queryType: text("query_type"), // forecast, revenue_analysis, patient_volume, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

// Key performance metrics for dashboard
export const performanceMetrics = pgTable("performance_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  locationId: varchar("location_id").references(() => practiceLocations.id),
  metricDate: timestamp("metric_date").notNull(),
  metricType: text("metric_type").notNull(), // monthly_revenue, patient_count, ar_days, etc.
  value: decimal("value", { precision: 15, scale: 2 }),
  additionalData: json("additional_data"), // For storing complex metric data
});

// Schema types for TypeScript
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertPracticeLocationSchema = createInsertSchema(practiceLocations).omit({ id: true });
export const insertPatientSchema = createInsertSchema(patients).omit({ id: true });
export const insertProcedureSchema = createInsertSchema(procedures).omit({ id: true });
export const insertPatientVisitSchema = createInsertSchema(patientVisits).omit({ id: true });
export const insertVisitProcedureSchema = createInsertSchema(visitProcedures).omit({ id: true });
export const insertAiQuerySchema = createInsertSchema(aiQueries).omit({ id: true, createdAt: true });
export const insertPerformanceMetricSchema = createInsertSchema(performanceMetrics).omit({ id: true });

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

// Additional types for frontend components
export interface RevenueDataPoint {
  month: string;
  monthName?: string;
  revenue: number;
  patientCount: number;
  actualRevenue?: number | null;
  projectedRevenue?: number | null;
  date: Date;
  isProjected: boolean;
  arDays?: number;
}

export interface ProcedureAnalytics {
  cptCode: string;
  description: string;
  category: 'medical' | 'cosmetic';
  revenue: number;
  growth: string;
  basePrice?: string;
  monthlyVolume?: number;
}

export interface InsurancePayerData {
  name: string;
  percentage: number;
  arDays: number;
  revenue: number;
  claimRate?: number;
  color?: string;
}

export interface ProjectionData {
  month: string;
  monthName?: string;
  projectedPatients: number;
  projectedRevenue: number;
  confidenceLevel: number;
  growthRate: string;
  date: Date;
}

export interface KeyMetrics {
  monthlyPatients: number;
  monthlyRevenue: number;
  arDays: number;
  cleanClaimRate: number;
  patientGrowth: string;
  revenueGrowth: string;
}

export interface PopularQuestion {
  id: string;
  question: string;
  icon: string;
  category: string;
  usage?: number;
}

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
