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
  getTopRevenueProcedures(locationId?: string, category?: 'medical' | 'cosmetic'): Promise<any[]>;
  getMonthlyRevenueData(locationId?: string): Promise<any[]>;
  getInsurancePayerBreakdown(locationId?: string): Promise<any[]>;
  getPatientVolumeProjections(locationId?: string): Promise<any[]>;
}

/**
 * In-memory storage implementation for development and prototyping
 * This provides a fast, reliable storage solution that mimics a real database
 * All data is structured to support comprehensive medical practice analytics
 */
export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private practiceLocations: Map<string, PracticeLocation>;
  private patients: Map<string, Patient>;
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

    // Initialize with real Rao Dermatology data
    this.initializeRealData();
  }

  /**
   * Initialize storage with authentic Rao Dermatology practice data
   * This includes real locations, procedures, and sample analytics data
   */
  private initializeRealData(): void {
    // Initialize real practice locations
    const locations: InsertPracticeLocation[] = [
      {
        name: "Manhattan, NY",
        address: "900 Broadway, Suite 203",
        city: "New York",
        state: "NY",
        zipCode: "10003",
        phone: "212-949-0393",
        isActive: true
      },
      {
        name: "Atlantic Highlands, NJ",
        address: "95 First Avenue",
        city: "Atlantic Highlands",
        state: "NJ",
        zipCode: "07716",
        phone: "732-872-2007",
        isActive: true
      },
      {
        name: "Woodbridge, NJ",
        address: "850-B Woodbridge Center Drive",
        city: "Woodbridge",
        state: "NJ",
        zipCode: "07095",
        phone: "732-872-5802",
        isActive: true
      },
      {
        name: "Fresno, CA",
        address: "7055 North Fresno St, Suite 310",
        city: "Fresno",
        state: "CA",
        zipCode: "93720",
        phone: "559-446-0285",
        isActive: true
      },
      {
        name: "Hanford, CA",
        address: "609 N. Douty St.",
        city: "Hanford",
        state: "CA",
        zipCode: "93230",
        phone: "559-582-2422",
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
      username: "dr.rao",
      password: "secure_password", // In production, this would be hashed
      name: "Dr. Babar K. Rao",
      role: "practice_owner",
      practiceId: "rao_dermatology"
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
  async getTopRevenueProcedures(locationId?: string, category?: 'medical' | 'cosmetic'): Promise<any[]> {
    const procedures = Array.from(this.procedures.values());
    const locations = Array.from(this.practiceLocations.values());
    
    // Get location multiplier for realistic data scaling
    let locationMultiplier = 1;
    if (locationId) {
      // Single location gets base multiplier
      locationMultiplier = 1;
    } else {
      // All locations aggregate - multiply by number of locations
      locationMultiplier = locations.length;
    }

    return procedures
      .filter(proc => !category || proc.category === category)
      .sort((a, b) => parseFloat(b.basePrice || "0") - parseFloat(a.basePrice || "0"))
      .slice(0, 10)
      .map(proc => ({
        cptCode: proc.cptCode,
        description: proc.description,
        category: proc.category,
        revenue: Math.round(parseFloat(proc.basePrice || "0") * 45 * locationMultiplier), // Scale by locations
        growth: ((Math.random() * 30 - 5) * (locationId ? 1 : 0.8)).toFixed(1) // Slightly lower growth for aggregated data
      }));
  }

  async getMonthlyRevenueData(locationId?: string): Promise<any[]> {
    const months = [];
    const locations = Array.from(this.practiceLocations.values());
    
    // Base revenue per location - different for each location type
    let baseRevenue = 420000;
    if (locationId) {
      // Single location - use base revenue with location-specific variation
      const location = locations.find(loc => loc.id === locationId);
      if (location) {
        // Adjust base revenue by location characteristics
        const locationIndex = locations.indexOf(location);
        baseRevenue = baseRevenue * (0.7 + locationIndex * 0.15); // Variation between locations
      }
    } else {
      // All locations - aggregate all location revenues
      baseRevenue = locations.reduce((total, location, index) => {
        return total + (420000 * (0.7 + index * 0.15));
      }, 0);
    }
    
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

  async getInsurancePayerBreakdown(locationId?: string): Promise<any[]> {
    const locations = Array.from(this.practiceLocations.values());
    
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

    return baseInsuranceData.map(payer => ({
      name: payer.name,
      percentage: locationId ? 
        payer.percentage * (0.9 + Math.random() * 0.2) : // Single location variation
        payer.percentage, // All locations keeps base percentages
      arDays: payer.arDays * (0.9 + Math.random() * 0.2), // Small AR variation
      revenue: Math.round(payer.baseRevenue * multiplier)
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

  async getInsuranceClaimsData(locationId: string): Promise<any[]> {
    // Get all locations to map by name since IDs are dynamic
    const allLocations = await this.getAllPracticeLocations();
    const locationMap = new Map(allLocations.map(loc => [loc.name, loc.id]));
    
    // Location-specific claims data with realistic volumes for dermatology practice
    // Total claims across all locations: ~9,596 (aligned with patient volume)
    const locationClaimsDataByName = {
      // Manhattan, NY - Highest volume, premium cosmetic procedures
      'Manhattan, NY': [
        {
          status: 'Pending' as const,
          totalClaims: 892,
          totalAmount: 1247800,
          providers: [
            { name: 'Blue Cross Blue Shield', claimCount: 324, amount: 453600 },
            { name: 'Aetna', claimCount: 289, amount: 404600 },
            { name: 'United Healthcare', claimCount: 167, amount: 233800 },
            { name: 'Cigna', claimCount: 112, amount: 155800 }
          ]
        },
        {
          status: 'Submitted' as const,
          totalClaims: 1567,
          totalAmount: 2194800,
          providers: [
            { name: 'Blue Cross Blue Shield', claimCount: 578, amount: 809200 },
            { name: 'Aetna', claimCount: 392, amount: 548800 },
            { name: 'United Healthcare', claimCount: 314, amount: 439600 },
            { name: 'Cigna', claimCount: 283, amount: 397200 }
          ]
        },
        {
          status: 'Denied' as const,
          totalClaims: 234,
          totalAmount: 327600,
          providers: [
            { name: 'Blue Cross Blue Shield', claimCount: 89, amount: 124600 },
            { name: 'Aetna', claimCount: 67, amount: 93800 },
            { name: 'United Healthcare', claimCount: 45, amount: 63000 },
            { name: 'Cigna', claimCount: 33, amount: 46200 }
          ]
        }
      ],

      // Atlantic Highlands, NJ - Balanced medical/cosmetic mix
      'Atlantic Highlands, NJ': [
        {
          status: 'Pending' as const,
          totalClaims: 567,
          totalAmount: 623700,
          providers: [
            { name: 'Blue Cross Blue Shield', claimCount: 189, amount: 207900 },
            { name: 'Horizon Blue Cross', claimCount: 156, amount: 171600 },
            { name: 'Aetna', claimCount: 123, amount: 135300 },
            { name: 'Medicare', claimCount: 99, amount: 108900 }
          ]
        },
        {
          status: 'Submitted' as const,
          totalClaims: 1203,
          totalAmount: 1323300,
          providers: [
            { name: 'Blue Cross Blue Shield', claimCount: 421, amount: 463100 },
            { name: 'Horizon Blue Cross', claimCount: 289, amount: 317900 },
            { name: 'Aetna', claimCount: 265, amount: 291500 },
            { name: 'Medicare', claimCount: 228, amount: 250800 }
          ]
        },
        {
          status: 'Denied' as const,
          totalClaims: 178,
          totalAmount: 195800,
          providers: [
            { name: 'Blue Cross Blue Shield', claimCount: 67, amount: 73700 },
            { name: 'Horizon Blue Cross', claimCount: 45, amount: 49500 },
            { name: 'Aetna', claimCount: 34, amount: 37400 },
            { name: 'Medicare', claimCount: 32, amount: 35200 }
          ]
        }
      ],

      // Woodbridge, NJ - Growing location, medical focus
      'Woodbridge, NJ': [
        {
          status: 'Pending' as const,
          totalClaims: 445,
          totalAmount: 400500,
          providers: [
            { name: 'Horizon Blue Cross', claimCount: 167, amount: 150300 },
            { name: 'Blue Cross Blue Shield', claimCount: 123, amount: 110700 },
            { name: 'Medicare', claimCount: 89, amount: 80100 },
            { name: 'Aetna', claimCount: 66, amount: 59400 }
          ]
        },
        {
          status: 'Submitted' as const,
          totalClaims: 987,
          totalAmount: 888300,
          providers: [
            { name: 'Horizon Blue Cross', claimCount: 345, amount: 310500 },
            { name: 'Blue Cross Blue Shield', claimCount: 278, amount: 250200 },
            { name: 'Medicare', claimCount: 198, amount: 178200 },
            { name: 'Aetna', claimCount: 166, amount: 149400 }
          ]
        },
        {
          status: 'Denied' as const,
          totalClaims: 145,
          totalAmount: 130500,
          providers: [
            { name: 'Horizon Blue Cross', claimCount: 56, amount: 50400 },
            { name: 'Blue Cross Blue Shield', claimCount: 43, amount: 38700 },
            { name: 'Medicare', claimCount: 28, amount: 25200 },
            { name: 'Aetna', claimCount: 18, amount: 16200 }
          ]
        }
      ],

      // Fresno, CA - Established location, diverse patient base
      'Fresno, CA': [
        {
          status: 'Pending' as const,
          totalClaims: 678,
          totalAmount: 745800,
          providers: [
            { name: 'Kaiser Permanente', claimCount: 243, amount: 267300 },
            { name: 'Blue Cross Blue Shield', claimCount: 189, amount: 207900 },
            { name: 'Aetna', claimCount: 134, amount: 147400 },
            { name: 'Medicare', claimCount: 112, amount: 123200 }
          ]
        },
        {
          status: 'Submitted' as const,
          totalClaims: 1356,
          totalAmount: 1491600,
          providers: [
            { name: 'Kaiser Permanente', claimCount: 487, amount: 535700 },
            { name: 'Blue Cross Blue Shield', claimCount: 352, amount: 387200 },
            { name: 'Aetna', claimCount: 298, amount: 327800 },
            { name: 'Medicare', claimCount: 219, amount: 240900 }
          ]
        },
        {
          status: 'Denied' as const,
          totalClaims: 198,
          totalAmount: 217800,
          providers: [
            { name: 'Kaiser Permanente', claimCount: 78, amount: 85800 },
            { name: 'Blue Cross Blue Shield', claimCount: 56, amount: 61600 },
            { name: 'Aetna', claimCount: 38, amount: 41800 },
            { name: 'Medicare', claimCount: 26, amount: 28600 }
          ]
        }
      ],

      // Hanford, CA - Newest location, building patient volume
      'Hanford, CA': [
        {
          status: 'Pending' as const,
          totalClaims: 334,
          totalAmount: 267200,
          providers: [
            { name: 'Kaiser Permanente', claimCount: 123, amount: 98400 },
            { name: 'Blue Cross Blue Shield', claimCount: 89, amount: 71200 },
            { name: 'Medicare', claimCount: 67, amount: 53600 },
            { name: 'Aetna', claimCount: 55, amount: 44000 }
          ]
        },
        {
          status: 'Submitted' as const,
          totalClaims: 723,
          totalAmount: 578400,
          providers: [
            { name: 'Kaiser Permanente', claimCount: 267, amount: 213600 },
            { name: 'Blue Cross Blue Shield', claimCount: 189, amount: 151200 },
            { name: 'Medicare', claimCount: 145, amount: 116000 },
            { name: 'Aetna', claimCount: 122, amount: 97600 }
          ]
        },
        {
          status: 'Denied' as const,
          totalClaims: 89,
          totalAmount: 71200,
          providers: [
            { name: 'Kaiser Permanente', claimCount: 34, amount: 27200 },
            { name: 'Blue Cross Blue Shield', claimCount: 23, amount: 18400 },
            { name: 'Medicare', claimCount: 18, amount: 14400 },
            { name: 'Aetna', claimCount: 14, amount: 11200 }
          ]
        }
      ]
    };

    // Convert locationId to location name for lookup
    let targetLocationName = null;
    if (locationId !== 'all') {
      const targetLocation = allLocations.find(loc => loc.id === locationId);
      targetLocationName = targetLocation?.name;
    }

    // Return location-specific data or aggregate for 'all'
    if (targetLocationName && locationClaimsDataByName[targetLocationName]) {
      return locationClaimsDataByName[targetLocationName];
    }

    // Aggregate all locations for 'all' view
    const aggregatedData = [
      { status: 'Pending' as const, totalClaims: 0, totalAmount: 0, providers: new Map() },
      { status: 'Submitted' as const, totalClaims: 0, totalAmount: 0, providers: new Map() },
      { status: 'Denied' as const, totalClaims: 0, totalAmount: 0, providers: new Map() }
    ];

    // Aggregate data from all locations
    Object.values(locationClaimsDataByName).forEach(locationData => {
      locationData.forEach((bucket, index) => {
        aggregatedData[index].totalClaims += bucket.totalClaims;
        aggregatedData[index].totalAmount += bucket.totalAmount;
        
        bucket.providers.forEach(provider => {
          const existingProvider = aggregatedData[index].providers.get(provider.name);
          if (existingProvider) {
            existingProvider.claimCount += provider.claimCount;
            existingProvider.amount += provider.amount;
          } else {
            aggregatedData[index].providers.set(provider.name, {
              name: provider.name,
              claimCount: provider.claimCount,
              amount: provider.amount
            });
          }
        });
      });
    });

    // Convert provider maps back to arrays and sort by claim count
    return aggregatedData.map(bucket => ({
      ...bucket,
      providers: Array.from(bucket.providers.values()).sort((a, b) => b.claimCount - a.claimCount)
    }));
  }

  // Denial reasons dataset for AI assistant context only
  getDenialReasonsData(): Record<string, string[]> {
    return {
      "Blue Cross Blue Shield": [
        "Incorrect CPT / ICD-10 Coding",
        "Modifier Misuse (especially 25 / 59)",
        "Insufficient Medical Necessity Documentation"
      ],
      "Aetna": [
        "Missing or Incomplete Documentation", 
        "Lack of Prior Authorization",
        "Insurance Eligibility / Coverage Verification Issues"
      ],
      "Cigna": [
        "Claim Submission After Deadline",
        "Duplicate Claims",
        "Bundling / Unbundling Errors"
      ],
      "Medicare": [
        "Coordination of Benefits (COB) Issues",
        "Incorrect CPT / ICD-10 Coding",
        "Insufficient Medical Necessity Documentation"
      ],
      "United Healthcare": [
        "Modifier Misuse (especially 25 / 59)",
        "Missing or Incomplete Documentation",
        "Lack of Prior Authorization"
      ]
    };
  }
}

// Export singleton instance for use throughout the application
export const storage = new MemStorage();
