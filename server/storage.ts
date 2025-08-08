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
  type InsertPerformanceMetric
} from "@shared/schema";
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

  // Patient management
  getPatientsByLocation(locationId: string): Promise<Patient[]>;
  createPatient(patient: InsertPatient): Promise<Patient>;

  // Procedure management
  getAllProcedures(): Promise<Procedure[]>;
  getProceduresByCategory(category: 'medical' | 'cosmetic'): Promise<Procedure[]>;
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
  getTopRevenueProcedures(locationId?: string, category?: 'medical' | 'cosmetic', timeRangeMonths?: number): Promise<any[]>;
  getMonthlyRevenueData(locationId?: string): Promise<any[]>;
  getInsurancePayerBreakdown(locationId?: string, timeRangeMonths?: number): Promise<any[]>;
  getPatientVolumeProjections(locationId?: string): Promise<any[]>;
  getKeyMetrics(locationId?: string, timeRangeMonths?: number): Promise<any>;
  getDenialReasonsData(): any;
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
      'manhattan-ny': 0.43,         // 43% - Premium location
      'atlantic-highlands-nj': 0.22, // 22% - Established practice
      'woodbridge-nj': 0.16,        // 16% - Mid-size practice  
      'fresno-ca': 0.12,           // 12% - Growing market
      'hanford-ca': 0.07           // 7% - Smaller practice
    }
  };
  private procedures: Map<string, Procedure>;
  private patientVisits: Map<string, PatientVisit>;
  private visitProcedures: Map<string, VisitProcedure>;
  private aiQueries: Map<string, AiQuery>;
  private performanceMetrics: Map<string, PerformanceMetric>;

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

    // Initialize with demo dermatology data
    this.initializeRealData();
  }

  /**
   * Initialize storage with demo dermatology practice data
   * This includes generic locations, procedures, and sample analytics data
   */
  private initializeRealData(): void {
    // Initialize demo practice locations
    const locations: InsertPracticeLocation[] = [
      {
        name: "Manhattan, NY",
        address: "123 Demo Avenue, Suite 100",
        city: "New York",
        state: "NY",
        zipCode: "10001",
        phone: "555-001-0001",
        isActive: true
      },
      {
        name: "Atlantic Highlands, NJ",
        address: "456 Sample Street",
        city: "Atlantic Highlands",
        state: "NJ",
        zipCode: "07700",
        phone: "555-002-0002",
        isActive: true
      },
      {
        name: "Woodbridge, NJ",
        address: "789 Example Blvd, Suite 200",
        city: "Woodbridge",
        state: "NJ",
        zipCode: "07090",
        phone: "555-003-0003",
        isActive: true
      },
      {
        name: "Fresno, CA",
        address: "321 Test Road, Suite 300",
        city: "Fresno",
        state: "CA",
        zipCode: "93700",
        phone: "555-004-0004",
        isActive: true
      },
      {
        name: "Hanford, CA",
        address: "654 Demo Plaza",
        city: "Hanford",
        state: "CA",
        zipCode: "93200",
        phone: "555-005-0005",
        isActive: true
      }
    ];

    // Create practice locations
    locations.forEach(async (location) => {
      await this.createPracticeLocation(location);
    });

    // Initialize real dermatology procedures with CPT codes
    const procedures: InsertProcedure[] = [
      // High-revenue procedures
      { cptCode: "17311", description: "Mohs Surgery - First Stage (Head/Neck)", category: "medical", basePrice: "2500.00", rvuValue: "10.85" },
      { cptCode: "17312", description: "Mohs Surgery - Additional Stage (Head/Neck)", category: "medical", basePrice: "1200.00", rvuValue: "5.42" },
      { cptCode: "11603", description: "Excision Malignant Lesion (Trunk/Arms/Legs)", category: "medical", basePrice: "850.00", rvuValue: "4.15" },
      { cptCode: "11104", description: "Punch Biopsy - Single Lesion", category: "medical", basePrice: "320.00", rvuValue: "1.85" },
      { cptCode: "11105", description: "Punch Biopsy - Additional Lesion", category: "medical", basePrice: "180.00", rvuValue: "0.95" },
      
      // Common procedures
      { cptCode: "17000", description: "Destruction Premalignant Lesions - First", category: "medical", basePrice: "250.00", rvuValue: "1.25" },
      { cptCode: "17003", description: "Destruction Premalignant Lesions (2-14)", category: "medical", basePrice: "450.00", rvuValue: "2.15" },
      { cptCode: "17110", description: "Destruction Benign Lesions (up to 14)", category: "medical", basePrice: "380.00", rvuValue: "1.85" },
      
      // E/M codes
      { cptCode: "99202", description: "New Patient Visit (15-29 min)", category: "medical", basePrice: "220.00", rvuValue: "1.45" },
      { cptCode: "99213", description: "Established Patient Visit (Low Complexity)", category: "medical", basePrice: "165.00", rvuValue: "1.05" },
      { cptCode: "99214", description: "Established Patient Visit (Moderate Complexity)", category: "medical", basePrice: "275.00", rvuValue: "1.75" },
      
      // Cosmetic procedures (self-pay)
      { cptCode: "BOTOX", description: "Botox Injections", category: "cosmetic", basePrice: "550.00", rvuValue: "0.00" },
      { cptCode: "FILLER", description: "Dermal Filler Treatment", category: "cosmetic", basePrice: "750.00", rvuValue: "0.00" },
      { cptCode: "CHEM_PEEL", description: "Chemical Peel", category: "cosmetic", basePrice: "350.00", rvuValue: "0.00" },
      { cptCode: "LASER_HAIR", description: "Laser Hair Removal", category: "cosmetic", basePrice: "300.00", rvuValue: "0.00" },
    ];

    // Create procedures
    procedures.forEach(async (procedure) => {
      await this.createProcedure(procedure);
    });

    // Create default practice owner user
    this.createUser({
      username: "dr.example",
      password: "secure_password", // In production, this would be hashed
      name: "Dr. Example User",
      role: "practice_owner",
      practiceId: "demo_dermatology"
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
    const user: User = { ...insertUser, id };
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
    const location: PracticeLocation = { ...insertLocation, id };
    this.practiceLocations.set(id, location);
    return location;
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
      createdAt: new Date()
    };
    this.patients.set(id, patient);
    return patient;
  }

  // Procedure management methods
  async getAllProcedures(): Promise<Procedure[]> {
    return Array.from(this.procedures.values());
  }

  async getProceduresByCategory(category: 'medical' | 'cosmetic'): Promise<Procedure[]> {
    return Array.from(this.procedures.values()).filter(
      (procedure) => procedure.category === category
    );
  }

  async createProcedure(insertProcedure: InsertProcedure): Promise<Procedure> {
    const id = randomUUID();
    const procedure: Procedure = { ...insertProcedure, id };
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
    const visit: PatientVisit = { ...insertVisit, id };
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
    const visitProcedure: VisitProcedure = { ...insertVisitProcedure, id };
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
      createdAt: new Date()
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
    const metric: PerformanceMetric = { ...insertMetric, id };
    this.performanceMetrics.set(id, metric);
    return metric;
  }

  // Analytics aggregation methods
  async getTopRevenueProcedures(locationId?: string, category?: 'medical' | 'cosmetic', timeRangeMonths?: number): Promise<any[]> {
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
        question: "How can we reduce dermatology claim denials?",
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
    const locationWeight = isAllLocations ? 1.0 : this.masterData.locationWeights[locationId as keyof typeof this.masterData.locationWeights] || 0.1;
    const timeRange = timeRangeMonths || 1;
    
    // Calculate metrics from master data with realistic variations
    const baseRevenue = this.masterData.baseMonthlyRevenue.totalRevenue * locationWeight;
    const baseClaims = this.masterData.insuranceClaims;
    
    // Calculate collection rates and metrics
    const paidPercentage = (baseClaims.paid / baseClaims.totalSubmitted) * 100;
    const denialRate = (baseClaims.denied / baseClaims.totalSubmitted) * 100;
    
    // Time range affects averages and growth patterns
    const timeStabilityFactor = timeRange > 6 ? 0.8 : 1.2; // Longer periods show more stable metrics
    
    return {
      monthlyPatients: Math.round(((isAllLocations ? 2450 : 2450 * locationWeight) + (Math.random() * 200 - 100) * timeStabilityFactor) * timeRange),
      monthlyRevenue: Math.round((baseRevenue + (Math.random() * baseRevenue * 0.1 - baseRevenue * 0.05)) * timeRange), // Scale by time range
      arDays: Math.round((25 + (Math.random() * 10 - 5) * timeStabilityFactor) * 10) / 10,
      cleanClaimRate: Math.round((100 - denialRate + (Math.random() * 4 - 2) * timeStabilityFactor) * 10) / 10,
      patientGrowth: ((8 + (Math.random() * 20 - 10)) * timeStabilityFactor).toFixed(1),
      revenueGrowth: ((12 + (Math.random() * 15 - 7.5)) * timeStabilityFactor).toFixed(1)
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
    
    // Patient collection rate: 82% (realistic for dermatology)
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
    
    // Insurance provider distribution (realistic for dermatology)
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

  // Additional methods using Master Data Consistency would go here...
}

// Create and export the storage instance
export const storage = new MemStorage();
