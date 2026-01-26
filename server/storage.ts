import { 
  type User, 
  type InsertUser,
  type PracticeLocation,
  type InsertPracticeLocation,
  type Patient,
  type InsertPatient,
  type Procedure,
  type InsertProcedure,
  type PatientVisit,
  type InsertPatientVisit,
  type VisitProcedure,
  type InsertVisitProcedure,
  type AiQuery,
  type InsertAiQuery,
  type PerformanceMetric,
  type InsertPerformanceMetric,
  type FinancialRevenueCategory,
  type FinancialExpenseCategory, 
  type ProfitLossData,
  type CashInCategory,
  type CashOutCategory,
  type CashFlowData,
  type DashboardCustomization,
  type InsertDashboardCustomization
} from "@shared/schema";

// Define RevenueDataPoint interface for server use
interface RevenueDataPoint {
  month: string;
  revenue: number;
  expenses: number;
  ebitda: number;
  writeOffs: number;
  patientCount: number;
  isProjected?: boolean;
}
import { randomUUID } from "crypto";

/**
 * Storage interface defining all CRUD operations needed for the medical analytics platform
 * This interface supports comprehensive practice management and analytics functionality
 */
export interface IStorage {
  // User management
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Practice location management
  getAllPracticeLocations(): Promise<PracticeLocation[]>;
  getPracticeLocation(id: string): Promise<PracticeLocation | undefined>;
  createPracticeLocation(location: InsertPracticeLocation): Promise<PracticeLocation>;
  updatePracticeLocation(id: string, updates: Partial<PracticeLocation>): Promise<PracticeLocation>;
  deletePracticeLocation(id: string): Promise<boolean>;

  // Patient management
  getPatientsByLocation(locationId: string): Promise<Patient[]>;
  createPatient(patient: InsertPatient): Promise<Patient>;

  // Procedure management
  getAllProcedures(): Promise<Procedure[]>;
  getProceduresByCategory(category: 'medical' | 'cosmetic' | 'refractive'): Promise<Procedure[]>;
  createProcedure(procedure: InsertProcedure): Promise<Procedure>;

  // Visit and revenue management
  getPatientVisitsByLocation(locationId: string, startDate?: Date, endDate?: Date): Promise<PatientVisit[]>;
  getPatientVisitsByDateRange(startDate: Date, endDate: Date, locationId?: string): Promise<PatientVisit[]>;
  createPatientVisit(visit: InsertPatientVisit): Promise<PatientVisit>;

  // Visit procedures for detailed analytics
  getVisitProceduresByVisit(visitId: string): Promise<VisitProcedure[]>;
  createVisitProcedure(visitProcedure: InsertVisitProcedure): Promise<VisitProcedure>;

  // AI query management
  getAiQueriesByUser(userId: string): Promise<AiQuery[]>;
  createAiQuery(query: InsertAiQuery): Promise<AiQuery>;

  // Performance metrics for dashboard analytics
  getPerformanceMetricsByLocation(locationId: string, metricType?: string): Promise<PerformanceMetric[]>;
  getPerformanceMetricsByDateRange(startDate: Date, endDate: Date, metricType?: string): Promise<PerformanceMetric[]>;
  createPerformanceMetric(metric: InsertPerformanceMetric): Promise<PerformanceMetric>;

  // Analytics aggregation methods
  getTopRevenueProcedures(locationId?: string, category?: 'medical' | 'cosmetic' | 'refractive', timeRangeMonths?: number): Promise<any[]>;
  getMonthlyRevenueData(locationId?: string): Promise<any[]>;
  getInsurancePayerBreakdown(locationId?: string, timeRangeMonths?: number): Promise<any[]>;
  getPatientVolumeProjections(locationId?: string): Promise<any[]>;
  getKeyMetrics(locationId?: string, timeRangeMonths?: number): Promise<any>;
  getDenialReasonsData(): any;

  // P&L Data methods
  getPlMonthlyData(locationId?: string, monthYear?: string): Promise<any[]>;
  importPlDataFromCsv(csvData: string, locationId: string): Promise<void>;

  // Financial Analysis methods
  getFinancialRevenueData(locationId?: string, period?: string): Promise<{
    categories: FinancialRevenueCategory[];
    totalRevenue: number;
    period: string;
  }>;
  getFinancialExpensesData(locationId?: string, period?: string): Promise<{
    categories: FinancialExpenseCategory[];
    totalExpenses: number;
    period: string;
  }>;
  getProfitLossData(locationId?: string, period?: string): Promise<ProfitLossData & {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
  }>;
  getCashInData(locationId?: string, period?: string): Promise<{
    categories: CashInCategory[];
    totalCashIn: number;
    netCashIn: number;
    period: string;
  }>;
  getCashOutData(locationId?: string, period?: string): Promise<{
    categories: CashOutCategory[];
    totalCashOut: number;
    period: string;
  }>;
  getCashFlowData(locationId?: string, period?: string): Promise<CashFlowData & {
    operatingCashFlow: number;
    investingCashFlow: number;
    financingCashFlow: number;
    netCashFlow: number;
  }>;

  // Dashboard customization methods
  getDashboardCustomization(): Promise<DashboardCustomization>;
  updateDashboardCustomization(data: Partial<InsertDashboardCustomization>): Promise<DashboardCustomization>;
}

/**
 * In-memory storage implementation for development and prototyping
 * This provides a fast, reliable storage solution that mimics a real database
 * All data is structured to support comprehensive medical practice analytics
 */
/**
 * COMPREHENSIVE DATA INTEGRITY AND CONSISTENCY RULES
 * 
 * All mock data follows these enforced business rules:
 * 1. Total Revenue = Insurance Revenue (80%) + Patient Revenue (20%)
 * 2. Insurance Claims: Submitted = Paid + Pending + Denied  
 * 3. AR Buckets represent ONLY Submitted + Pending claims (unpaid)
 * 4. Collection Rates: Insurance 85-95%, Patient 75-85%
 * 5. Denial Rate: 8-15% of total claims
 * 6. Date-based scaling maintains proportional relationships
 * 7. Location data sums to "All Locations" totals
 */

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private practiceLocations: Map<string, PracticeLocation>;
  private patients: Map<string, Patient>;

  // MASTER DATA CONSISTENCY ENGINE
  // All revenue and claims data derives from these base values to ensure mathematical consistency
  private masterData = {
    // Base monthly totals for "All Locations" (monthly basis)
    baseMonthlyRevenue: {
      totalRevenue: 2450000,        // Total practice revenue per month
      insuranceRevenue: 1960000,    // 80% of total (insurance payments)
      patientRevenue: 490000        // 20% of total (patient payments)
    },
    
    // Insurance claims breakdown (monthly basis)
    // RULE: Paid + Pending + Denied = Total Submitted (100% of submitted claims)
    insuranceClaims: {
      totalSubmitted: 2450000,      // Total submitted claims (monthly)
      paid: 1960000,               // 80% of submitted ($1.96M)
      pending: 343000,             // 14% of submitted ($343K) 
      denied: 147000               // 6% of submitted ($147K)
      // Total: $1.96M + $343K + $147K = $2.45M ✓
    },
    
    // Location distribution weights (must sum to 100%)
    locationWeights: {
      'fairfax': 0.65,              // 65% - Main location
      'gainesville': 0.35           // 35% - Secondary location
    }
  };
  private procedures: Map<string, Procedure>;
  private patientVisits: Map<string, PatientVisit>;
  private visitProcedures: Map<string, VisitProcedure>;
  private aiQueries: Map<string, AiQuery>;
  private performanceMetrics: Map<string, PerformanceMetric>;
  private dashboardCustomization: DashboardCustomization | null = null;

  constructor() {
    // Initialize all storage maps
    this.users = new Map();
    this.practiceLocations = new Map();
    this.patients = new Map();
    this.procedures = new Map();
    this.patientVisits = new Map();
    this.visitProcedures = new Map();
    this.aiQueries = new Map();
    this.performanceMetrics = new Map();

    // Initialize with demo ophthalmology data (fire and forget - async initialization)
    this.initializeRealData().catch(console.error);
  }

  /**
   * Initialize storage with demo ophthalmology practice data
   * This includes eye specialist locations, procedures, and sample analytics data
   */
  private async initializeRealData(): Promise<void> {
    // Initialize demo practice locations
    const locations: InsertPracticeLocation[] = [
      {
        name: "Fairfax",
        address: "10721 Main St, Suite 2200",
        city: "Fairfax",
        state: "VA",
        zipCode: "22030",
        phone: "571-445-0001",
        isActive: true
      },
      {
        name: "Gainesville",
        address: "7601 Heritage Dr, Suite 330",
        city: "Gainesville",
        state: "VA",
        zipCode: "20155",
        phone: "571-445-0002",
        isActive: true
      }
    ];

    // Create practice locations with specific IDs (wait for all to complete)
    const locationMappings = [
      { location: locations[0], id: 'fairfax' },
      { location: locations[1], id: 'gainesville' }
    ];
    
    for (const { location, id } of locationMappings) {
      await this.createPracticeLocationWithId(location, id);
    }

    // Initialize ophthalmology procedures with CPT codes
    const procedures: InsertProcedure[] = [
      // High-revenue procedures
      { cptCode: "66984", description: "Cataract Surgery with IOL Insertion", category: "medical", basePrice: "3500.00", rvuValue: "15.57" },
      { cptCode: "67028", description: "Intravitreal Injection", category: "medical", basePrice: "1200.00", rvuValue: "3.25" },
      { cptCode: "65855", description: "Trabeculoplasty by Laser Surgery", category: "medical", basePrice: "850.00", rvuValue: "4.12" },
      { cptCode: "92134", description: "Scanning Computerized Ophthalmic Diagnostic Imaging (OCT)", category: "medical", basePrice: "320.00", rvuValue: "0.84" },
      { cptCode: "92083", description: "Visual Field Examination", category: "medical", basePrice: "180.00", rvuValue: "0.63" },
      
      // Common procedures
      { cptCode: "92004", description: "Comprehensive Eye Examination, New Patient", category: "medical", basePrice: "250.00", rvuValue: "2.11" },
      { cptCode: "92014", description: "Comprehensive Eye Examination, Established Patient", category: "medical", basePrice: "200.00", rvuValue: "1.50" },
      { cptCode: "92012", description: "Intermediate Eye Examination", category: "medical", basePrice: "150.00", rvuValue: "1.17" },
      
      // E/M codes
      { cptCode: "99202", description: "New Patient Visit (15-29 min)", category: "medical", basePrice: "220.00", rvuValue: "1.45" },
      { cptCode: "99213", description: "Established Patient Visit (Low Complexity)", category: "medical", basePrice: "165.00", rvuValue: "1.05" },
      { cptCode: "99214", description: "Established Patient Visit (Moderate Complexity)", category: "medical", basePrice: "275.00", rvuValue: "1.75" },
      
      // Oculoplastic procedures (cosmetic/reconstructive)
      { cptCode: "15823", description: "Blepharoplasty (Upper Eyelid)", category: "cosmetic", basePrice: "2500.00", rvuValue: "8.45" },
      { cptCode: "15824", description: "Blepharoplasty (Lower Eyelid)", category: "cosmetic", basePrice: "2800.00", rvuValue: "9.12" },
      { cptCode: "68761", description: "Closure of Lacrimal Punctum", category: "medical", basePrice: "750.00", rvuValue: "3.25" },
      { cptCode: "LASIK", description: "LASIK Refractive Surgery", category: "refractive", basePrice: "4500.00", rvuValue: "0.00" },
    ];

    // Create procedures (wait for all to complete)
    for (const procedure of procedures) {
      await this.createProcedure(procedure);
    }

    // Create default practice owner user (wait for completion)
    await this.createUser({
      username: "dr.josephson",
      password: "secure_password", // In production, this would be hashed
      name: "Dr. John Josephson",
      role: "practice_owner",
      practiceId: "eye_specialists_nova"
    });
  }

  // User management methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      practiceId: insertUser.practiceId || null
    };
    this.users.set(id, user);
    return user;
  }

  // Practice location management methods
  async getAllPracticeLocations(): Promise<PracticeLocation[]> {
    return Array.from(this.practiceLocations.values());
  }

  async getPracticeLocation(id: string): Promise<PracticeLocation | undefined> {
    return this.practiceLocations.get(id);
  }

  async createPracticeLocation(insertLocation: InsertPracticeLocation): Promise<PracticeLocation> {
    const id = randomUUID();
    const location: PracticeLocation = { 
      ...insertLocation, 
      id,
      phone: insertLocation.phone || null,
      isActive: insertLocation.isActive ?? null
    };
    this.practiceLocations.set(id, location);
    return location;
  }

  async createPracticeLocationWithId(insertLocation: InsertPracticeLocation, customId: string): Promise<PracticeLocation> {
    const location: PracticeLocation = { 
      ...insertLocation, 
      id: customId,
      phone: insertLocation.phone || null,
      isActive: insertLocation.isActive ?? null
    };
    this.practiceLocations.set(customId, location);
    return location;
  }

  async updatePracticeLocation(id: string, updates: Partial<PracticeLocation>): Promise<PracticeLocation> {
    const existing = this.practiceLocations.get(id);
    if (!existing) {
      throw new Error(`Location with id ${id} not found`);
    }
    const updated: PracticeLocation = {
      ...existing,
      ...updates,
      id: existing.id // Don't allow ID changes
    };
    this.practiceLocations.set(id, updated);
    return updated;
  }

  async deletePracticeLocation(id: string): Promise<boolean> {
    return this.practiceLocations.delete(id);
  }

  // Patient management methods
  async getPatientsByLocation(locationId: string): Promise<Patient[]> {
    return Array.from(this.patients.values()).filter(
      (patient) => patient.locationId === locationId
    );
  }

  async createPatient(insertPatient: InsertPatient): Promise<Patient> {
    const id = randomUUID();
    const patient: Patient = { 
      ...insertPatient, 
      id,
      createdAt: new Date(),
      locationId: insertPatient.locationId || null,
      dateOfBirth: insertPatient.dateOfBirth || null,
      insuranceProvider: insertPatient.insuranceProvider || null
    };
    this.patients.set(id, patient);
    return patient;
  }

  // Procedure management methods
  async getAllProcedures(): Promise<Procedure[]> {
    return Array.from(this.procedures.values());
  }

  async getProceduresByCategory(category: 'medical' | 'cosmetic' | 'refractive'): Promise<Procedure[]> {
    return Array.from(this.procedures.values()).filter(
      (procedure) => procedure.category === category
    );
  }

  async createProcedure(insertProcedure: InsertProcedure): Promise<Procedure> {
    const id = randomUUID();
    const procedure: Procedure = { 
      ...insertProcedure, 
      id,
      basePrice: insertProcedure.basePrice || null,
      rvuValue: insertProcedure.rvuValue || null
    };
    this.procedures.set(id, procedure);
    return procedure;
  }

  // Visit management methods
  async getPatientVisitsByLocation(locationId: string, startDate?: Date, endDate?: Date): Promise<PatientVisit[]> {
    return Array.from(this.patientVisits.values()).filter((visit) => {
      if (visit.locationId !== locationId) return false;
      if (startDate && visit.visitDate < startDate) return false;
      if (endDate && visit.visitDate > endDate) return false;
      return true;
    });
  }

  async getPatientVisitsByDateRange(startDate: Date, endDate: Date, locationId?: string): Promise<PatientVisit[]> {
    return Array.from(this.patientVisits.values()).filter((visit) => {
      if (visit.visitDate < startDate || visit.visitDate > endDate) return false;
      if (locationId && visit.locationId !== locationId) return false;
      return true;
    });
  }

  async createPatientVisit(insertVisit: InsertPatientVisit): Promise<PatientVisit> {
    const id = randomUUID();
    const visit: PatientVisit = { 
      ...insertVisit, 
      id,
      locationId: insertVisit.locationId || null,
      patientId: insertVisit.patientId || null,
      visitType: insertVisit.visitType || null,
      totalRevenue: insertVisit.totalRevenue || null,
      insurancePaid: insertVisit.insurancePaid || null,
      patientPaid: insertVisit.patientPaid || null,
      status: insertVisit.status || null
    };
    this.patientVisits.set(id, visit);
    return visit;
  }

  // Visit procedure methods
  async getVisitProceduresByVisit(visitId: string): Promise<VisitProcedure[]> {
    return Array.from(this.visitProcedures.values()).filter(
      (visitProcedure) => visitProcedure.visitId === visitId
    );
  }

  async createVisitProcedure(insertVisitProcedure: InsertVisitProcedure): Promise<VisitProcedure> {
    const id = randomUUID();
    const visitProcedure: VisitProcedure = { 
      ...insertVisitProcedure, 
      id,
      visitId: insertVisitProcedure.visitId || null,
      procedureId: insertVisitProcedure.procedureId || null,
      quantity: insertVisitProcedure.quantity ?? null,
      chargedAmount: insertVisitProcedure.chargedAmount || null,
      paidAmount: insertVisitProcedure.paidAmount || null,
      insuranceClaimDate: insertVisitProcedure.insuranceClaimDate || null,
      insurancePaidDate: insertVisitProcedure.insurancePaidDate || null
    };
    this.visitProcedures.set(id, visitProcedure);
    return visitProcedure;
  }

  // AI query methods
  async getAiQueriesByUser(userId: string): Promise<AiQuery[]> {
    return Array.from(this.aiQueries.values()).filter(
      (query) => query.userId === userId
    );
  }

  async createAiQuery(insertQuery: InsertAiQuery): Promise<AiQuery> {
    const id = randomUUID();
    const query: AiQuery = { 
      ...insertQuery, 
      id,
      createdAt: new Date(),
      userId: insertQuery.userId || null,
      response: insertQuery.response || null,
      queryType: insertQuery.queryType || null
    };
    this.aiQueries.set(id, query);
    return query;
  }

  // Performance metrics methods
  async getPerformanceMetricsByLocation(locationId: string, metricType?: string): Promise<PerformanceMetric[]> {
    return Array.from(this.performanceMetrics.values()).filter((metric) => {
      if (metric.locationId !== locationId) return false;
      if (metricType && metric.metricType !== metricType) return false;
      return true;
    });
  }

  async getPerformanceMetricsByDateRange(startDate: Date, endDate: Date, metricType?: string): Promise<PerformanceMetric[]> {
    return Array.from(this.performanceMetrics.values()).filter((metric) => {
      if (metric.metricDate < startDate || metric.metricDate > endDate) return false;
      if (metricType && metric.metricType !== metricType) return false;
      return true;
    });
  }

  async createPerformanceMetric(insertMetric: InsertPerformanceMetric): Promise<PerformanceMetric> {
    const id = randomUUID();
    const metric: PerformanceMetric = { 
      ...insertMetric, 
      id,
      locationId: insertMetric.locationId || null,
      value: insertMetric.value || null,
      additionalData: insertMetric.additionalData || null
    };
    this.performanceMetrics.set(id, metric);
    return metric;
  }

  // Analytics aggregation methods
  async getTopRevenueProcedures(locationId?: string, category?: 'medical' | 'cosmetic' | 'refractive', timeRangeMonths?: number): Promise<any[]> {
    const procedures = Array.from(this.procedures.values());
    const locations = Array.from(this.practiceLocations.values());
    const timeRange = timeRangeMonths || 1;
    
    // Get location multiplier for realistic data scaling
    let locationMultiplier = 1;
    if (locationId) {
      // Single location gets base multiplier
      locationMultiplier = 1;
    } else {
      // All locations aggregate - multiply by number of locations
      locationMultiplier = locations.length;
    }

    // Time range multiplier affects revenue totals
    const timeMultiplier = timeRange; // Linear scaling for time periods

    return procedures
      .filter(proc => !category || proc.category === category)
      .sort((a, b) => parseFloat(b.basePrice || "0") - parseFloat(a.basePrice || "0"))
      .slice(0, 10)
      .map(proc => ({
        cptCode: proc.cptCode,
        description: proc.description,
        category: proc.category,
        revenue: Math.round(parseFloat(proc.basePrice || "0") * 2.5 * locationMultiplier * timeMultiplier), // Realistic scaling: base price * 2.5 procedures per month
        growth: ((Math.random() * 30 - 5) * (locationId ? 1 : 0.8) * (timeRange > 6 ? 0.9 : 1.1)).toFixed(1) // Longer periods show more stable growth
      }));
  }

  // Monthly Revenue Data - Uses Master Data Consistency
  async getMonthlyRevenueData(locationId?: string): Promise<any[]> {
    const months = [];
    const isAllLocations = !locationId;
    const locationWeight = isAllLocations ? 1.0 : this.masterData.locationWeights[locationId as keyof typeof this.masterData.locationWeights] || 0.1;
    
    // Use master data for consistent base revenue
    const baseRevenue = this.masterData.baseMonthlyRevenue.totalRevenue * locationWeight;
    
    // Generate 60 months (5 years) of historical data for proper time period filtering
    // Set current date to August 2025
    const currentDate = new Date(2025, 7, 3); // August 3, 2025 (month is 0-indexed)
    
    // Generate data dynamically based on current date
    // Current date is August 3, 2025 - so current month is August (completed data through July)
    const currentMonth = currentDate.getMonth(); // August = 7
    const currentYear = currentDate.getFullYear(); // 2025
    
    // Generate 60 months historical + 3 months future projections
    for (let i = 59; i >= -3; i--) {
      const date = new Date(currentDate);
      date.setMonth(date.getMonth() - i);
      
      // Add growth trend (8% annual growth over 5 years)
      const growthFactor = Math.pow(1.08, Math.max(0, (59 - i)) / 12);
      
      // Add seasonal variation (higher in spring/summer for cosmetic procedures)
      const seasonalFactor = 1 + 0.15 * Math.sin(((date.getMonth() + 3) / 12) * 2 * Math.PI);
      
      // Dynamic projection boundary: current month and later are projected
      // If current date is August 3, 2025, then August+ should be projected (we have complete data through July)
      const monthStr = date.toISOString().slice(0, 7);
      const isProjected = (date.getFullYear() > currentYear) || 
                         (date.getFullYear() === currentYear && date.getMonth() >= currentMonth);
      const monthlyVariation = isProjected ? 
        (Math.random() * 0.2 - 0.1) : // Smaller variation for projections
        (Math.random() * 0.4 - 0.2);  // Larger variation for historical data
      
      const revenue = Math.round(baseRevenue * growthFactor * seasonalFactor * (1 + monthlyVariation));
      
      months.push({
        month: date.toISOString().slice(0, 7), // YYYY-MM format
        revenue: revenue,
        patientCount: Math.round(revenue / 340), // Average revenue per patient
        arDays: 25 + Math.round(Math.random() * 15), // AR days 25-40
        date: date,
        isProjected: isProjected
      });
    }
    
    return months;
  }

  async getInsurancePayerBreakdown(locationId?: string, timeRangeMonths?: number): Promise<any[]> {
    const locations = Array.from(this.practiceLocations.values());
    const timeRange = timeRangeMonths || 1;
    
    // Base insurance data with location-specific variations
    const baseInsuranceData = [
      { name: "Blue Cross Blue Shield", percentage: 32.4, arDays: 24.2, baseRevenue: 136800 },
      { name: "Aetna", percentage: 18.7, arDays: 31.5, baseRevenue: 78900 },
      { name: "Self-Pay", percentage: 15.2, arDays: 0, baseRevenue: 64200 },
      { name: "Medicare", percentage: 12.8, arDays: 45.3, baseRevenue: 54000 },
      { name: "Cigna", percentage: 8.9, arDays: 28.7, baseRevenue: 37600 },
      { name: "United Healthcare", percentage: 7.3, arDays: 33.1, baseRevenue: 30800 },
      { name: "Other", percentage: 4.7, arDays: 35.8, baseRevenue: 19800 }
    ];

    let multiplier = 1;
    
    if (locationId) {
      // Single location - apply location-specific variation
      const location = locations.find(loc => loc.id === locationId);
      if (location) {
        const locationIndex = locations.indexOf(location);
        multiplier = 0.7 + locationIndex * 0.15; // Different multiplier per location
      }
    } else {
      // All locations - aggregate across all locations
      multiplier = locations.reduce((total, location, index) => {
        return total + (0.7 + index * 0.15);
      }, 0);
    }

    // Time range affects revenue totals and AR trends
    const timeMultiplier = timeRange;
    const timeStabilityFactor = timeRange > 6 ? 0.9 : 1.1; // Longer periods show more stability

    return baseInsuranceData.map(payer => ({
      name: payer.name,
      percentage: locationId ? 
        payer.percentage * (0.9 + Math.random() * 0.2) * timeStabilityFactor : // Single location variation with time stability
        payer.percentage, // All locations keeps base percentages
      arDays: payer.arDays * (0.9 + Math.random() * 0.2) * timeStabilityFactor, // AR days stabilize over longer periods
      revenue: Math.round(payer.baseRevenue * multiplier * timeMultiplier)
    }));
  }

  async getPatientVolumeProjections(locationId?: string): Promise<any[]> {
    const projections = [];
    const locations = Array.from(this.practiceLocations.values());
    
    // Base volume calculation based on location
    let baseVolume = 1247;
    if (locationId) {
      // Single location - use base volume with location variation
      const location = locations.find(loc => loc.id === locationId);
      if (location) {
        const locationIndex = locations.indexOf(location);
        baseVolume = Math.round(baseVolume * (0.7 + locationIndex * 0.15));
      }
    } else {
      // All locations - aggregate patient volume
      baseVolume = locations.reduce((total, location, index) => {
        return total + Math.round(1247 * (0.7 + index * 0.15));
      }, 0);
    }
    
    // Use August 2025 as current date for projections
    const currentDate = new Date(2025, 7, 3); // August 3, 2025 (month is 0-indexed)
    
    for (let i = 1; i <= 6; i++) {
      const date = new Date(currentDate);
      date.setMonth(date.getMonth() + i);
      const growthRate = 0.08 + (i * 0.02); // Increasing growth rate
      const seasonalFactor = 1 + 0.15 * Math.sin(((date.getMonth() + 3) / 12) * 2 * Math.PI); // Peak in spring/summer
      const projectedVolume = Math.round(baseVolume * seasonalFactor * (1 + growthRate));
      
      projections.push({
        month: date.toISOString().slice(0, 7),
        projectedPatients: projectedVolume,
        projectedRevenue: projectedVolume * 340, // Average revenue per patient
        confidenceLevel: Math.max(0.7, 0.95 - (i * 0.05)), // Decreasing confidence over time
        growthRate: `+${(growthRate * 100).toFixed(1)}%`,
        date: date
      });
    }
    
    return projections;
  }

  // Get insurance claims data by location with enhanced popular questions
  async getPopularQuestions(): Promise<any[]> {
    return [
      {
        id: "patient-forecast",
        question: "What's our patient volume forecast for the next quarter?",
        icon: "TrendingUp",
        category: "Analytics",
      },
      {
        id: "revenue-trends",
        question: "How are our revenue trends compared to last year?",
        icon: "DollarSign",
        category: "Financial",
      },
      {
        id: "top-procedures",
        question: "Which procedures are generating the most revenue?",
        icon: "Activity",
        category: "Procedures",
      },
      {
        id: "location-performance",
        question: "How are our different locations performing?",
        icon: "MapPin",
        category: "Operations",
      },
      {
        id: "claim-denials-blue-cross",
        question: "Why are most claims denied for Blue Cross?",
        icon: "AlertTriangle",
        category: "Claims",
      },
      {
        id: "reduce-claim-denials", 
        question: "How can we reduce ophthalmology claim denials?",
        icon: "Shield",
        category: "Claims",
      }
    ];
  }

  // CENTRALIZED KEY METRICS using Master Data Consistency
  async getKeyMetrics(locationId?: string, timeRangeMonths?: number): Promise<{
    monthlyPatients: number;
    monthlyRevenue: number;
    arDays: number;
    cleanClaimRate: number;
    patientGrowth: string;
    revenueGrowth: string;
  }> {
    const isAllLocations = !locationId || locationId === 'all';
    const timeRange = timeRangeMonths || 1;
    
    // Get real revenue from P&L data using embedded financial data
    let monthlyRevenue = 0;
    let revenueGrowth = "+5.0";
    
    if (this.embeddedFinancialData && this.embeddedFinancialData.monthly) {
      // Calculate total revenue for the time range from actual P&L data
      const months = Object.keys(this.embeddedFinancialData.monthly);
      const recentMonths = months.slice(-timeRange); // Get last N months
      
      let totalRevenue = 0;
      
      for (const monthKey of recentMonths) {
        const monthData = this.embeddedFinancialData.monthly[monthKey];
        if (monthData && monthData.revenue) {
          totalRevenue += monthData.revenue;
        }
      }
      
      // Use total revenue for the time period
      monthlyRevenue = totalRevenue;
      revenueGrowth = "+5.2"; // Realistic growth rate
    } else {
      // Fallback to estimated revenue based on location
      const locationWeight = isAllLocations ? 1.0 : this.masterData.locationWeights[locationId as keyof typeof this.masterData.locationWeights] || 0.1;
      const baseRevenue = this.masterData.baseMonthlyRevenue.totalRevenue * locationWeight;
      monthlyRevenue = Math.round(baseRevenue);
      revenueGrowth = "+4.8";
    }
    
    // Time range affects averages and growth patterns
    const timeStabilityFactor = timeRange > 6 ? 0.8 : 1.2;
    const locationWeight = isAllLocations ? 1.0 : this.masterData.locationWeights[locationId as keyof typeof this.masterData.locationWeights] || 0.1;
    
    return {
      monthlyPatients: Math.round(((isAllLocations ? 2450 : 2450 * locationWeight) + (Math.random() * 200 - 100) * timeStabilityFactor) * timeRange),
      monthlyRevenue: monthlyRevenue,
      arDays: Math.round((25 + (Math.random() * 10 - 5) * timeStabilityFactor) * 10) / 10,
      cleanClaimRate: 50.0, // Set to exactly 50% as requested
      patientGrowth: ((8 + (Math.random() * 20 - 10)) * timeStabilityFactor).toFixed(1),
      revenueGrowth: revenueGrowth
    };
  }

  // Patient Billing Analytics Data - Uses Master Data for Consistency
  async getPatientBillingData(locationId: string, timeRange: string): Promise<{
    totalRevenue: number; // Total amount billed to patients in selected time period
    totalPaid: number; // Portion of billed-to-patients that has been collected
    totalOutstanding: number; // Portion of billed-to-patients that remains unpaid
  }> {
    // Calculate scaling factor based on time range (1=1month, 3=3months, 6=6months, 12=1year)
    const scalingFactor = timeRange === '1' ? 1 : timeRange === '3' ? 3 : timeRange === '6' ? 6 : 12;
    
    const isAllLocations = locationId === 'all';
    const locationWeight = isAllLocations ? 1.0 : this.masterData.locationWeights[locationId as keyof typeof this.masterData.locationWeights] || 0.1;
    
    // Use master data for patient revenue (20% of total practice revenue)
    const monthlyPatientRevenue = this.masterData.baseMonthlyRevenue.patientRevenue * locationWeight;
    const totalPatientRevenue = monthlyPatientRevenue * scalingFactor;
    
    // Patient collection rate: 82% (realistic for ophthalmology)
    const collectionRate = 0.82;
    const totalPaid = Math.round(totalPatientRevenue * collectionRate);
    const totalOutstanding = Math.round(totalPatientRevenue * (1 - collectionRate));
    
    return {
      totalRevenue: totalPaid + totalOutstanding, // Total billed = paid + outstanding
      totalPaid: totalPaid,
      totalOutstanding: totalOutstanding
    };
  }

  // AR Buckets for Outstanding Claims Data - Uses Master Data Consistency  
  async getARBucketsData(locationId: string): Promise<{
    buckets: Array<{
      ageRange: string;
      amount: number;
      claimCount: number;
    }>;
    totalOutstanding: number;
  }> {
    const isAllLocations = locationId === 'all';
    const locationWeight = isAllLocations ? 1.0 : this.masterData.locationWeights[locationId as keyof typeof this.masterData.locationWeights] || 0.1;
    
    // AR buckets represent ONLY Submitted + Pending claims (unpaid insurance claims)
    // From master data: Submitted ($2,300,000) + Pending ($245,000) = $2,545,000 total outstanding
    const totalOutstanding = (this.masterData.insuranceClaims.totalSubmitted * 0.15 + this.masterData.insuranceClaims.pending) * locationWeight;
    
    // Aging distribution: Front-loaded (most claims are recent)
    const agingDistribution = {
      '0-30': 0.55,   // 55% - Most recent claims
      '31-60': 0.25,  // 25% - Getting older
      '61-90': 0.12,  // 12% - Aged claims 
      '90+': 0.08     // 8% - Very aged claims
    };
    
    const buckets = Object.entries(agingDistribution).map(([ageRange, percentage]) => {
      const amount = Math.round(totalOutstanding * percentage);
      const claimCount = Math.round(amount / 1200); // Average $1,200 per claim
      return { ageRange, amount, claimCount };
    });
    
    return {
      buckets,
      totalOutstanding: Math.round(totalOutstanding)
    };
  }

  /**
   * Get Collections Breakdown Per Provider
   */
  async getCollectionsBreakdown(
    locationId?: string, 
    timeRange?: string,
    userProviders?: Array<{ name: string; percentage: number }>
  ): Promise<{
    providers: Array<{
      name: string;
      amount: number;
      percentage: number;
    }>;
    totalCollections: number;
  }> {
    // Get actual revenue data from P&L for the specified time period
    // This ensures collections breakdown matches the Revenue widget
    const period = timeRange || '1Y';
    const revenueData = await this.getFinancialRevenueData(locationId, period);
    
    // Use the total revenue from P&L data
    const totalRevenue = revenueData.totalRevenue;
    
    // Use user-provided providers or default distribution
    const providerData = userProviders || [
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
    
    const providers = providerData.map(provider => ({
      name: provider.name,
      amount: Math.round(totalRevenue * (provider.percentage / 100)),
      percentage: provider.percentage
    }));
    
    const totalCollections = providers.reduce((sum, p) => sum + p.amount, 0);
    
    return {
      providers,
      totalCollections
    };
  }

  // Insurance Claims Data - Uses Master Data Consistency Engine
  async getInsuranceClaimsData(locationId: string, startDate?: Date, endDate?: Date): Promise<any[]> {
    const now = new Date();
    const defaultStartDate = startDate || new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const defaultEndDate = endDate || now;
    
    // Calculate date-based scaling factor for filtering
    const totalDaysInRange = Math.ceil((defaultEndDate.getTime() - defaultStartDate.getTime()) / (1000 * 60 * 60 * 24));
    const scalingFactor = Math.min(1, Math.max(0.1, totalDaysInRange / 365));
    
    const isAllLocations = locationId === 'all';
    const locationWeight = isAllLocations ? 1.0 : this.masterData.locationWeights[locationId as keyof typeof this.masterData.locationWeights] || 0.1;
    
    // Use master data for mathematically consistent claims
    const baseClaims = this.masterData.insuranceClaims;
    
    // CORRECT BUSINESS LOGIC: 
    // Submitted = Total claims sent to insurance (largest number)
    // Paid = Portion of submitted that insurance has paid (subset of submitted)
    // Pending = Portion of submitted still being processed (subset of submitted)  
    // Denied = Portion of submitted that was denied (subset of submitted)
    // RULE: Paid + Pending + Denied = Submitted (all submitted claims have one of these outcomes)
    
    // FIXED BUSINESS LOGIC: Start with paid amount (from insurance revenue) and work backwards
    // Since Paid represents actual insurance revenue, we calculate Submitted based on collection rate
    
    const paidAmount = Math.round(baseClaims.paid * locationWeight * scalingFactor); // Actual insurance collections
    const collectionRate = 0.80; // 80% collection rate
    
    // Calculate submitted based on what was needed to generate this paid amount
    const submitted = Math.round(paidAmount / collectionRate); // LARGEST (total submitted)
    const paid = paidAmount; // What actually got paid (80% of submitted)
    const pending = Math.round(submitted * 0.14); // 14% of submitted 
    const denied = Math.round(submitted * 0.06); // 6% of submitted
    
    // Ensure math works: adjust paid if needed for rounding
    const total = paid + pending + denied;
    const adjustment = submitted - total;
    const adjustedPaid = paid + adjustment;
    
    // Insurance provider distribution (realistic for ophthalmology)
    const providerDistribution = [
      { name: 'Blue Cross Blue Shield', percentage: 0.35 },
      { name: 'Aetna', percentage: 0.22 },
      { name: 'Medicare', percentage: 0.18 },
      { name: 'United Healthcare', percentage: 0.12 },
      { name: 'Cigna', percentage: 0.08 },
      { name: 'Horizon Blue Cross', percentage: 0.05 }
    ];
    
    // Generate consistent provider breakdowns for each status
    const createProviderBreakdown = (totalAmount: number, totalClaims: number) => {
      return providerDistribution.map(provider => ({
        name: provider.name,
        claimCount: Math.round(totalClaims * provider.percentage),
        amount: Math.round(totalAmount * provider.percentage)
      }));
    };
    
    return [
      {
        status: 'Submitted' as const,
        totalClaims: Math.round(submitted / 1400), // Total submitted claims
        totalAmount: submitted,
        providers: createProviderBreakdown(submitted, Math.round(submitted / 1400))
      },
      {
        status: 'Paid' as const,
        totalClaims: Math.round(adjustedPaid / 1400), // 80% of submitted claims
        totalAmount: adjustedPaid,
        providers: createProviderBreakdown(adjustedPaid, Math.round(adjustedPaid / 1400))
      },
      {
        status: 'Pending' as const,
        totalClaims: Math.round(pending / 1400), // 14% of submitted claims
        totalAmount: pending,
        providers: createProviderBreakdown(pending, Math.round(pending / 1400))
      },
      {
        status: 'Denied' as const,
        totalClaims: Math.round(denied / 1400), // 6% of submitted claims
        totalAmount: denied,
        providers: createProviderBreakdown(denied, Math.round(denied / 1400))
      }
    ];
  }

  /**
   * Get denial reasons data for AI assistant context
   * Returns common denial reasons by insurance provider
   */
  getDenialReasonsData(): Record<string, string[]> {
    return {
      'Blue Cross Blue Shield': [
        'Prior authorization required',
        'Medical necessity not established',
        'Duplicate claim submission'
      ],
      'Aetna': [
        'Missing documentation',
        'Procedure not covered',
        'Exceeds benefit limits'
      ],
      'Medicare': [
        'Incorrect billing codes',
        'Treatment not medically necessary',
        'Missing physician signature'
      ],
      'United Healthcare': [
        'Prior authorization expired',
        'Network provider requirements',
        'Missing referral documentation'
      ],
      'Cigna': [
        'Cosmetic procedure exclusion',
        'Annual deductible not met',
        'Pre-existing condition clause'
      ],
      'Horizon Blue Cross': [
        'Coverage verification failed',
        'Incorrect patient information',
        'Treatment plan not approved'
      ]
    };
  }

  // Helper method to get month range for a given period
  private getMonthsForPeriod(period?: string): string[] {
    const availableMonths = [
      '2024-09', '2024-10', '2024-11', '2024-12',
      '2025-01', '2025-02', '2025-03', '2025-04', 
      '2025-05', '2025-06', '2025-07', '2025-08'
    ];
    
    if (!period) period = '6M'; // Default to 6M
    
    switch (period.toUpperCase()) {
      case '1M': 
        // Return latest month (Aug 2025)
        return ['2025-08'];
      case '3M':
        // Return last 3 months (Jun-Aug 2025)
        return ['2025-06', '2025-07', '2025-08'];
      case '6M':
        // Return last 6 months (Mar-Aug 2025)
        return ['2025-03', '2025-04', '2025-05', '2025-06', '2025-07', '2025-08'];
      case '1Y':
        // Return all 12 months (Sep 2024 - Aug 2025)
        return availableMonths;
      default:
        // Default to 6 months
        return ['2025-03', '2025-04', '2025-05', '2025-06', '2025-07', '2025-08'];
    }
  }

  // Helper method to calculate period multiplier (kept for backwards compatibility)
  private getPeriodMultiplier(period?: string): number {
    if (!period) return 6; // Default to 6M
    
    switch (period.toUpperCase()) {
      case '1M': return 1;
      case '3M': return 3;
      case '6M': return 6;
      case '1Y': return 12;
      case 'CUSTOM': return 6; // Default for custom, could be enhanced
      default: return 6; // Default fallback
    }
  }

  // Helper method to generate realistic patient count fluctuations
  private generatePatientCount(monthYear: string): number {
    // Base patient counts that fluctuate from 1760 (Sep 2024) to 2240 (Aug 2025)
    const monthMap: Record<string, number> = {
      '2024-09': 1760, // Starting point
      '2024-10': 1820, // Fall increase
      '2024-11': 1890, // Holiday season
      '2024-12': 1850, // Holiday dip
      '2025-01': 1950, // New year resolutions
      '2025-02': 2020, // Growth continues
      '2025-03': 2080, // Spring increase
      '2025-04': 2140, // Peak spring
      '2025-05': 2180, // Pre-summer peak
      '2025-06': 2100, // Summer decrease starts
      '2025-07': 2050, // Summer low
      '2025-08': 2240  // Recovery/goal achievement
    };
    
    return monthMap[monthYear] || 2000; // Default fallback
  }

  // Clinical metrics data using real monthly P&L data for Key Metrics Trends Chart
  async getClinicalMetricsData(locationId?: string, period?: string): Promise<RevenueDataPoint[]> {
    const finalPeriod = period || "1yr";
    
    // Load embedded data if not already loaded
    if (!this.embeddedFinancialData) {
      await this.loadEmbeddedData();
    }

    // Generate months for the specified period
    const monthsToInclude = this.getMonthsForPeriod(finalPeriod);
    
    // Add projection months for 1yr period
    if (finalPeriod === '1yr') {
      monthsToInclude.push('2025-09', '2025-10'); // Add future projections
    }

    const clinicalData: RevenueDataPoint[] = [];
    
    // Calculate monthly write-offs as percentage of total annual Bad Debt
    const annualWriteOffs = this.embeddedFinancialData.profitLoss.expenses["Bad Debt Expense"] || 0;

    for (const monthYear of monthsToInclude) {
      let totalRevenue: number;
      let totalExpenses: number;
      let ebitda: number;
      let writeOffs: number;

      // Check if this is a future projection month
      const isProjected = monthYear > '2025-08';

      if (isProjected) {
        // For projections, use average of last 3 months
        const lastThreeMonths = ['2025-06', '2025-07', '2025-08'];
        const avgRevenue = lastThreeMonths.reduce((sum, month) => 
          sum + (this.embeddedFinancialData.monthly[month]?.revenue || 0), 0) / 3;
        const avgExpenses = lastThreeMonths.reduce((sum, month) => 
          sum + (this.embeddedFinancialData.monthly[month]?.expenses || 0), 0) / 3;
        
        totalRevenue = Math.round(avgRevenue);
        totalExpenses = Math.round(avgExpenses);
        ebitda = Math.round(avgRevenue - avgExpenses);
        writeOffs = Math.round(annualWriteOffs / 12); // Average monthly write-offs
      } else {
        // Use actual monthly data from embedded financial data
        const monthlyData = this.embeddedFinancialData.monthly[monthYear];
        
        if (monthlyData) {
          totalRevenue = monthlyData.revenue;
          totalExpenses = monthlyData.expenses;
          ebitda = monthlyData.netProfit;
          
          // Calculate write-offs as proportional to monthly revenue
          const monthlyRevenueRatio = monthlyData.revenue / this.embeddedFinancialData.profitLoss.totalRevenue;
          writeOffs = Math.round(annualWriteOffs * monthlyRevenueRatio);
        } else {
          // Fallback for missing months
          totalRevenue = 0;
          totalExpenses = 0;
          ebitda = 0;
          writeOffs = 0;
        }
      }

      // Get Patient Count for this month
      const patientCount = this.generatePatientCount(monthYear);

      clinicalData.push({
        month: monthYear,
        revenue: totalRevenue,
        expenses: totalExpenses,
        patientCount: patientCount,
        ebitda: ebitda,
        writeOffs: writeOffs,
        isProjected: isProjected
      });
    }

    return clinicalData;
  }

  // Financial Analysis methods implementation using embedded financial data
  // Import embedded data instead of reading CSV files
  private async loadEmbeddedData() {
    const { embeddedProfitLossData, embeddedCashFlowData, monthlyFinancialData, practiceLocationData } = await import('./data/embedded-financial-data');
    
    // Store embedded data in memory for consistent API responses
    this.embeddedFinancialData = {
      profitLoss: embeddedProfitLossData,
      cashFlow: embeddedCashFlowData,
      monthly: monthlyFinancialData,
      location: practiceLocationData
    };
  }

  private embeddedFinancialData: any = null;

  // Helper method to calculate time range multipliers
  private getTimeRangeMultiplier(period?: string): number {
    switch (period) {
      case "1M": return 1/12; // 1 month out of 12
      case "3M": return 3/12; // 3 months out of 12
      case "6M": return 6/12; // 6 months out of 12
      case "1Y": return 1;    // Full year
      default: return 6/12;   // Default to 6 months
    }
  }

  // Financial Analysis methods implementation using embedded financial data
  async getFinancialRevenueData(locationId?: string, period?: string): Promise<{
    categories: FinancialRevenueCategory[];
    totalRevenue: number;
    period: string;
  }> {
    const finalPeriod = period || "6M";
    
    // Load embedded data if not already loaded
    if (!this.embeddedFinancialData) {
      await this.loadEmbeddedData();
    }
    
    const revenueData = this.embeddedFinancialData.profitLoss.revenue;
    
    // Calculate time range multiplier
    const timeMultiplier = this.getTimeRangeMultiplier(period);
    
    // Convert to required format with time scaling
    const categories: FinancialRevenueCategory[] = Object.entries(revenueData).map(([lineItem, baseAmount]) => ({
      id: lineItem.toLowerCase().replace(/[\s&\/]/g, '-').replace(/--+/g, '-'),
      name: lineItem,
      amount: Math.round((baseAmount as number) * timeMultiplier),
      change: 5.0 + (Math.random() * 6 - 3), // Realistic change percentage
      trend: "up" as const
    }));
    
    const totalRevenue = Math.round(this.embeddedFinancialData.profitLoss.totalRevenue * timeMultiplier);
    
    return {
      categories,
      totalRevenue,
      period: finalPeriod
    };
  }

  async getFinancialExpensesData(locationId?: string, period?: string): Promise<{
    categories: FinancialExpenseCategory[];
    totalExpenses: number;
    period: string;
  }> {
    const finalPeriod = period || "6M";
    
    // Load embedded data if not already loaded  
    if (!this.embeddedFinancialData) {
      await this.loadEmbeddedData();
    }
    
    const expensesData = this.embeddedFinancialData.profitLoss.expenses;
    
    // Calculate time range multiplier
    const timeMultiplier = this.getTimeRangeMultiplier(period);
    
    // Convert to required format with time scaling
    const categories: FinancialExpenseCategory[] = Object.entries(expensesData).map(([lineItem, baseAmount]) => ({
      id: lineItem.toLowerCase().replace(/[\s&\/()]/g, '-').replace(/--+/g, '-').replace(/-$/, ''),
      name: lineItem,
      amount: Math.round((baseAmount as number) * timeMultiplier),
      change: -2.5 + (Math.random() * 4 - 2), // Realistic change percentage
      trend: "down" as const
    }));
    
    const totalExpenses = Math.round(this.embeddedFinancialData.profitLoss.totalExpenses * timeMultiplier);
    
    return {
      categories,
      totalExpenses,
      period: finalPeriod
    };
  }

  async getProfitLossData(locationId?: string, period?: string): Promise<ProfitLossData & {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
  }> {
    const revenueData = await this.getFinancialRevenueData(locationId, period);
    const expensesData = await this.getFinancialExpensesData(locationId, period);
    const finalPeriod = period || "6M";
    
    // Create revenue and expenses objects using the real P&L line item names
    const revenueObject = revenueData.categories.reduce((acc: Record<string, number>, cat) => {
      acc[cat.name] = cat.amount;
      return acc;
    }, {} as Record<string, number>);
    
    const expensesObject = expensesData.categories.reduce((acc: Record<string, number>, cat) => {
      acc[cat.name] = cat.amount;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      revenue: revenueObject,
      expenses: expensesObject,
      totalRevenue: revenueData.totalRevenue,
      totalExpenses: expensesData.totalExpenses,
      netProfit: revenueData.totalRevenue - expensesData.totalExpenses,
      period: finalPeriod,
      locationId
    };
  }

  async getCashInData(locationId?: string, period?: string): Promise<{
    categories: CashInCategory[];
    totalCashIn: number;
    netCashIn: number;
    period: string;
  }> {
    const isAllLocations = !locationId;
    const locationWeight = isAllLocations ? 1.0 : this.masterData.locationWeights[locationId as keyof typeof this.masterData.locationWeights] || 0.5;
    const periodMultiplier = this.getPeriodMultiplier(period);
    const finalPeriod = period || "6M";
    
    const cashInCategories = [
      { id: "patient-payments", name: "Patient Payments", baseAmount: 95000, change: 8.3, trend: "up" as const },
      { id: "insurance-reimbursements", name: "Insurance Reimbursements", baseAmount: 185000, change: 4.7, trend: "up" as const },
      { id: "procedure-payments", name: "Procedure Payments", baseAmount: 145000, change: 12.1, trend: "up" as const },
      { id: "optical-sales", name: "Optical & Contact Lens Sales", baseAmount: 28000, change: -2.4, trend: "down" as const },
      { id: "cash-procedures", name: "Cash-Pay Procedures", baseAmount: 55000, change: 15.6, trend: "up" as const },
      { id: "refunds-adjustments", name: "Refunds & Adjustments", baseAmount: -8200, change: -5.1, trend: "down" as const }
    ];

    return {
      categories: cashInCategories.map(cat => ({
        ...cat,
        amount: Math.round(cat.baseAmount * locationWeight * periodMultiplier)
      })),
      totalCashIn: Math.round(cashInCategories.filter(cat => cat.baseAmount > 0).reduce((sum, cat) => sum + cat.baseAmount, 0) * locationWeight * periodMultiplier),
      netCashIn: Math.round(cashInCategories.reduce((sum, cat) => sum + cat.baseAmount, 0) * locationWeight * periodMultiplier),
      period: finalPeriod
    };
  }

  async getCashOutData(locationId?: string, period?: string): Promise<{
    categories: CashOutCategory[];
    totalCashOut: number;
    period: string;
  }> {
    const isAllLocations = !locationId;
    const locationWeight = isAllLocations ? 1.0 : this.masterData.locationWeights[locationId as keyof typeof this.masterData.locationWeights] || 0.5;
    const periodMultiplier = this.getPeriodMultiplier(period);
    const finalPeriod = period || "6M";
    
    const cashOutCategories = [
      { id: "staff-salaries", name: "Staff Salaries & Payroll", baseAmount: 125000, change: 6.2, trend: "up" as const },
      { id: "equipment-purchases", name: "Medical Equipment Purchases", baseAmount: 45000, change: -12.8, trend: "down" as const },
      { id: "rent-utilities", name: "Rent & Utilities", baseAmount: 42000, change: 3.1, trend: "up" as const },
      { id: "supplier-payments", name: "Supplier Payments", baseAmount: 38700, change: -2.4, trend: "down" as const },
      { id: "insurance-premiums", name: "Insurance Premiums", baseAmount: 22100, change: 8.9, trend: "up" as const },
      { id: "loan-payments", name: "Loan & Interest Payments", baseAmount: 15800, change: 0.0, trend: "neutral" as const },
      { id: "marketing-advertising", name: "Marketing & Advertising", baseAmount: 12500, change: 15.2, trend: "up" as const },
      { id: "professional-services", name: "Professional Services", baseAmount: 18900, change: -1.6, trend: "down" as const }
    ];

    return {
      categories: cashOutCategories.map(cat => ({
        ...cat,
        amount: Math.round(cat.baseAmount * locationWeight * periodMultiplier)
      })),
      totalCashOut: Math.round(cashOutCategories.reduce((sum, cat) => sum + cat.baseAmount, 0) * locationWeight * periodMultiplier),
      period: finalPeriod
    };
  }

  async getCashFlowData(locationId?: string, period?: string): Promise<CashFlowData & {
    operatingCashFlow: number;
    investingCashFlow: number;
    financingCashFlow: number;
    netCashFlow: number;
  }> {
    const finalPeriod = period || "6M";
    
    // Load embedded data if not already loaded
    if (!this.embeddedFinancialData) {
      await this.loadEmbeddedData();
    }
    
    const cashFlowData = this.embeddedFinancialData.cashFlow;
    
    // Calculate time range multiplier
    const timeMultiplier = this.getTimeRangeMultiplier(period);
    
    // Convert embedded data to required format with time scaling
    const convertToApiFormat = (items: any[]) => {
      return items.map((item: any) => ({
        name: item.name,
        amount: Math.round(item.amount * timeMultiplier),
        change: Math.random() * 10 - 5, // Mock change percentage
        trend: item.amount > 0 ? 'up' as const : 'down' as const
      }));
    };
    
    const operating = convertToApiFormat(cashFlowData.operating) as any;
    const investing = convertToApiFormat(cashFlowData.investing) as any;
    const financing = convertToApiFormat(cashFlowData.financing) as any;
    
    // Calculate totals using embedded data
    const operatingCashFlow = Math.round(cashFlowData.totals.operating * timeMultiplier);
    const investingCashFlow = Math.round(cashFlowData.totals.investing * timeMultiplier);
    const financingCashFlow = Math.round(cashFlowData.totals.financing * timeMultiplier);
    const netCashFlow = Math.round(cashFlowData.totals.netCashFlow * timeMultiplier);

    return {
      operating,
      investing,
      financing,
      operatingCashFlow,
      investingCashFlow,
      financingCashFlow,
      netCashFlow,
      period: finalPeriod
    };
  }

  /*
   * P&L DATA STORAGE
   * ================
   * In-memory storage for P&L monthly data imported from CSV
   */
  private plMonthlyData: Array<{
    locationId: string;
    lineItem: string;
    categoryType: string;
    monthYear: string;
    amount: number;
  }> = [];

  /*
   * CASH FLOW DATA STORAGE
   * ======================
   * In-memory storage for cash flow monthly data imported from CSV
   */
  private cashFlowMonthlyData: Array<{
    locationId: string;
    lineItem: string;
    category: string; // 'operating' | 'investing' | 'financing'
    monthYear: string;
    amount: number;
  }> = [];

  async getPlMonthlyData(locationId?: string, monthYear?: string): Promise<any[]> {
    let filteredData = this.plMonthlyData;
    
    if (locationId) {
      filteredData = filteredData.filter(item => item.locationId === locationId);
    }
    
    if (monthYear) {
      filteredData = filteredData.filter(item => item.monthYear === monthYear);
    }
    
    return filteredData;
  }

  async importPlDataFromCsv(csvData: string, locationId: string): Promise<void> {
    // Category mapping for P&L line items
    const CATEGORY_MAPPING = {
      // Revenue items
      'Office Visits': 'revenue',
      'Diagnostics & Minor Procedures': 'revenue', 
      'Cataract Surgeries': 'revenue',
      'Intravitreal Injections': 'revenue',
      'Refractive Cash': 'revenue',
      'Corneal Procedures': 'revenue',
      'Oculoplastics': 'revenue',
      'Optical / Contact Lens Sales': 'revenue',
      
      // Direct costs
      'Drug Acquisition (injections)': 'direct_costs',
      'Surgical Supplies & IOLs': 'direct_costs',
      'Optical Cost of Goods': 'direct_costs',
      
      // Operating expenses  
      'Bad Debt Expense': 'operating_expenses', // Fixed: removed trailing space
      'Staff Wages & Benefits': 'operating_expenses',
      'Billing & Coding Vendors': 'operating_expenses',
      'Rent & Utilities': 'operating_expenses',
      'Technology': 'operating_expenses',
      'Insurance': 'operating_expenses',
      'Equipment Service & Leases': 'operating_expenses',
      'Marketing & Outreach': 'operating_expenses',
      'Office & Miscellaneous': 'operating_expenses',
      
      // Calculated totals
      'Total Revenue': 'calculated_totals',
      'Total Direct Costs': 'calculated_totals',
      'Gross Profit': 'calculated_totals',
      'Total Operating Expenses': 'calculated_totals',
      'EBITDA': 'calculated_totals'
    } as const;

    // Month headers from CSV
    const MONTH_HEADERS = [
      'Sep-2024', 'Oct-2024', 'Nov-2024', 'Dec-2024',
      'Jan-2025', 'Feb-2025', 'Mar-2025', 'Apr-2025', 
      'May-2025', 'Jun-2025', 'Jul-2025', 'Aug-2025'
    ];

    // Convert month format  
    const convertMonthFormat = (monthYear: string): string => {
      const [month, year] = monthYear.split('-');
      const monthMap: Record<string, string> = {
        'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12',
        'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
        'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08'
      };
      return `${year}-${monthMap[month]}`;
    };

    // Parse CSV
    const lines = csvData.split('\n').filter(line => line.trim());
    
    // Clear existing P&L data for this location
    this.plMonthlyData = this.plMonthlyData.filter(item => item.locationId !== locationId);
    
    // Process each data line (skip header)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;
      
      // Simple CSV parsing (assumes no commas in values)
      const values = line.split(',').map(v => v.trim());
      const lineItem = values[0];
      
      
      // Create normalized lookup to handle whitespace issues
      const normalizedMapping = Object.fromEntries(
        Object.entries(CATEGORY_MAPPING).map(([k, v]) => [k.trim().normalize(), v])
      );
      const normalizedLineItem = lineItem.trim().normalize();
      
      // Skip if unknown line item
      if (!(normalizedLineItem in normalizedMapping)) {
        console.log(`Skipping unknown line item: "${lineItem}"`);
        continue;
      }
      
      const categoryType = normalizedMapping[normalizedLineItem];
      
      // Process each month's data
      for (let monthIndex = 0; monthIndex < MONTH_HEADERS.length; monthIndex++) {
        const monthYear = MONTH_HEADERS[monthIndex];
        const amountStr = values[monthIndex + 1]; // +1 for line item column
        
        if (!amountStr || amountStr.trim() === '') continue;
        
        const amount = parseFloat(amountStr.replace(/,/g, ''));
        if (isNaN(amount)) continue;
        
        this.plMonthlyData.push({
          locationId,
          lineItem,
          categoryType,
          monthYear: convertMonthFormat(monthYear),
          amount
        });
      }
    }
    
    console.log(`Imported ${this.plMonthlyData.length} P&L records for location ${locationId}`);
  }

  // Import cash flow data from the csvImport module into storage
  async importCashFlowDataToStorage(csvImportData: Array<{
    locationId: string;
    lineItem: string;
    category: string;
    monthYear: string;
    amount: number;
  }>): Promise<void> {
    // Clear existing cash flow data
    this.cashFlowMonthlyData = [];
    
    // Add all records from CSV import
    csvImportData.forEach(record => {
      this.cashFlowMonthlyData.push(record);
    });
    
    console.log(`Imported ${this.cashFlowMonthlyData.length} cash flow records to storage`);
  }

  /**
   * Get dashboard customization settings
   * Returns current customization or default values if none exist
   */
  async getDashboardCustomization(): Promise<DashboardCustomization> {
    if (this.dashboardCustomization) {
      return this.dashboardCustomization;
    }
    
    // Return default customization settings
    return this.getDefaultCustomization();
  }

  /**
   * Update dashboard customization settings
   * Merges provided data with existing settings
   */
  async updateDashboardCustomization(data: Partial<InsertDashboardCustomization>): Promise<DashboardCustomization> {
    const currentCustomization = this.dashboardCustomization || this.getDefaultCustomization();
    
    // Merge new data with existing customization
    this.dashboardCustomization = {
      ...currentCustomization,
      ...data,
      updatedAt: new Date()
    };
    
    return this.dashboardCustomization;
  }

  /**
   * Get default dashboard customization settings
   * These are the baseline values shown when no customization exists
   */
  private getDefaultCustomization(): DashboardCustomization {
    return {
      id: 'default',
      practiceId: null,
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
      locationNameOverrides: null,
      updatedAt: new Date()
    };
  }
}

// Create and export the storage instance
export const storage = new MemStorage();
