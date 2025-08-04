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

  // Patient Billing Analytics Data
  async getPatientBillingData(locationId: string, timeRange: string): Promise<{
    totalOutstanding: number;
    totalOutstandingTrend: number;
    collectionRate: number;
    collectionRateTrend: number;
    agingBreakdown: {
      days0to30: number;
      days31to60: number;
      days61to90: number;
      days90plus: number;
    };
    topOverdueAccounts: {
      patientId: string;
      patientName: string;
      balance: number;
      daysOverdue: number;
      actionStatus: 'Uncontacted' | 'Reminder Sent' | 'Payment Plan' | 'Collection Agency';
    }[];
  }> {
    // Calculate scaling factor based on time range (similar to insurance claims)
    const scalingFactor = timeRange === '30' ? 0.3 : timeRange === '60' ? 0.6 : 1.0;
    
    // Base patient billing data by location
    const baseData = {
      'all': {
        totalOutstanding: Math.round(145750 * scalingFactor),
        totalOutstandingTrend: -8.5, // Negative trend is good (decreasing outstanding)
        collectionRate: 87.3,
        collectionRateTrend: 2.1,
        agingBreakdown: {
          days0to30: Math.round(45200 * scalingFactor),
          days31to60: Math.round(38900 * scalingFactor),
          days61to90: Math.round(32150 * scalingFactor),
          days90plus: Math.round(29500 * scalingFactor)
        },
        topOverdueAccounts: [
          {
            patientId: 'PT-2024-8901',
            patientName: 'Sarah M. Johnson',
            balance: Math.round(4850 * scalingFactor),
            daysOverdue: 127,
            actionStatus: 'Collection Agency' as const
          },
          {
            patientId: 'PT-2024-7563',
            patientName: 'Michael R. Chen',
            balance: Math.round(3275 * scalingFactor),
            daysOverdue: 89,
            actionStatus: 'Reminder Sent' as const
          },
          {
            patientId: 'PT-2024-9102',
            patientName: 'Jennifer L. Davis',
            balance: Math.round(2960 * scalingFactor),
            daysOverdue: 156,
            actionStatus: 'Payment Plan' as const
          }
        ]
      },
      'manhattan-ny': {
        totalOutstanding: Math.round(52100 * scalingFactor),
        totalOutstandingTrend: -12.3,
        collectionRate: 89.1,
        collectionRateTrend: 3.2,
        agingBreakdown: {
          days0to30: Math.round(18200 * scalingFactor),
          days31to60: Math.round(14900 * scalingFactor),
          days61to90: Math.round(11800 * scalingFactor),
          days90plus: Math.round(7200 * scalingFactor)
        },
        topOverdueAccounts: [
          {
            patientId: 'PT-NY-8901',
            patientName: 'Alexandra Wong',
            balance: Math.round(5200 * scalingFactor),
            daysOverdue: 134,
            actionStatus: 'Collection Agency' as const
          },
          {
            patientId: 'PT-NY-7821',
            patientName: 'David Rodriguez',
            balance: Math.round(3450 * scalingFactor),
            daysOverdue: 98,
            actionStatus: 'Reminder Sent' as const
          },
          {
            patientId: 'PT-NY-9156',
            patientName: 'Lisa Thompson',
            balance: Math.round(2890 * scalingFactor),
            daysOverdue: 145,
            actionStatus: 'Payment Plan' as const
          }
        ]
      },
      'atlantic-highlands-nj': {
        totalOutstanding: Math.round(31800 * scalingFactor),
        totalOutstandingTrend: -6.7,
        collectionRate: 85.4,
        collectionRateTrend: 1.8,
        agingBreakdown: {
          days0to30: Math.round(11200 * scalingFactor),
          days31to60: Math.round(9800 * scalingFactor),
          days61to90: Math.round(6900 * scalingFactor),
          days90plus: Math.round(3900 * scalingFactor)
        },
        topOverdueAccounts: [
          {
            patientId: 'PT-AH-5632',
            patientName: 'Robert Kim',
            balance: Math.round(3100 * scalingFactor),
            daysOverdue: 112,
            actionStatus: 'Reminder Sent' as const
          },
          {
            patientId: 'PT-AH-7890',
            patientName: 'Maria Gonzalez',
            balance: Math.round(2750 * scalingFactor),
            daysOverdue: 156,
            actionStatus: 'Collection Agency' as const
          },
          {
            patientId: 'PT-AH-4521',
            patientName: 'James Wilson',
            balance: Math.round(2480 * scalingFactor),
            daysOverdue: 78,
            actionStatus: 'Payment Plan' as const
          }
        ]
      },
      'woodbridge-nj': {
        totalOutstanding: Math.round(25900 * scalingFactor),
        totalOutstandingTrend: -4.2,
        collectionRate: 86.8,
        collectionRateTrend: 2.5,
        agingBreakdown: {
          days0to30: Math.round(9200 * scalingFactor),
          days31to60: Math.round(7800 * scalingFactor),
          days61to90: Math.round(5400 * scalingFactor),
          days90plus: Math.round(3500 * scalingFactor)
        },
        topOverdueAccounts: [
          {
            patientId: 'PT-WB-3421',
            patientName: 'Susan Miller',
            balance: Math.round(2890 * scalingFactor),
            daysOverdue: 123,
            actionStatus: 'Reminder Sent' as const
          },
          {
            patientId: 'PT-WB-6754',
            patientName: 'Thomas Lee',
            balance: Math.round(2650 * scalingFactor),
            daysOverdue: 89,
            actionStatus: 'Payment Plan' as const
          },
          {
            patientId: 'PT-WB-8901',
            patientName: 'Rachel Brown',
            balance: Math.round(2340 * scalingFactor),
            daysOverdue: 167,
            actionStatus: 'Collection Agency' as const
          }
        ]
      },
      'fresno-ca': {
        totalOutstanding: Math.round(23700 * scalingFactor),
        totalOutstandingTrend: -7.8,
        collectionRate: 88.2,
        collectionRateTrend: 1.9,
        agingBreakdown: {
          days0to30: Math.round(8900 * scalingFactor),
          days31to60: Math.round(7200 * scalingFactor),
          days61to90: Math.round(4800 * scalingFactor),
          days90plus: Math.round(2800 * scalingFactor)
        },
        topOverdueAccounts: [
          {
            patientId: 'PT-FR-5612',
            patientName: 'Carlos Hernandez',
            balance: Math.round(3200 * scalingFactor),
            daysOverdue: 145,
            actionStatus: 'Collection Agency' as const
          },
          {
            patientId: 'PT-FR-7834',
            patientName: 'Angela Smith',
            balance: Math.round(2890 * scalingFactor),
            daysOverdue: 102,
            actionStatus: 'Reminder Sent' as const
          },
          {
            patientId: 'PT-FR-9012',
            patientName: 'Kevin Johnson',
            balance: Math.round(2550 * scalingFactor),
            daysOverdue: 87,
            actionStatus: 'Payment Plan' as const
          }
        ]
      },
      'hanford-ca': {
        totalOutstanding: Math.round(12250 * scalingFactor),
        totalOutstandingTrend: -3.1,
        collectionRate: 84.7,
        collectionRateTrend: 1.2,
        agingBreakdown: {
          days0to30: Math.round(4700 * scalingFactor),
          days31to60: Math.round(3900 * scalingFactor),
          days61to90: Math.round(2350 * scalingFactor),
          days90plus: Math.round(1300 * scalingFactor)
        },
        topOverdueAccounts: [
          {
            patientId: 'PT-HF-2341',
            patientName: 'Patricia Davis',
            balance: Math.round(1890 * scalingFactor),
            daysOverdue: 134,
            actionStatus: 'Reminder Sent' as const
          },
          {
            patientId: 'PT-HF-5672',
            patientName: 'Mark Anderson',
            balance: Math.round(1650 * scalingFactor),
            daysOverdue: 78,
            actionStatus: 'Payment Plan' as const
          },
          {
            patientId: 'PT-HF-8903',
            patientName: 'Nicole Taylor',
            balance: Math.round(1420 * scalingFactor),
            daysOverdue: 156,
            actionStatus: 'Collection Agency' as const
          }
        ]
      }
    };

    return baseData[locationId as keyof typeof baseData] || baseData['all'];
  }

  async getInsuranceClaimsData(locationId: string, startDate?: Date, endDate?: Date): Promise<any[]> {
    // Get all locations to map by name since IDs are dynamic
    const allLocations = await this.getAllPracticeLocations();
    const locationMap = new Map(allLocations.map(loc => [loc.name, loc.id]));
    
    // Generate date-filtered claims data based on current date and filter range
    const now = new Date();
    const defaultStartDate = startDate || new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()); // Default: last month
    const defaultEndDate = endDate || now;
    
    // Calculate date-based scaling factor (how much of total data to show based on date range)
    const totalDaysInRange = Math.ceil((defaultEndDate.getTime() - defaultStartDate.getTime()) / (1000 * 60 * 60 * 24));
    const scalingFactor = Math.min(1, Math.max(0.1, totalDaysInRange / 365)); // Scale between 10% and 100%
    
    // Location-specific claims data with realistic volumes for dermatology practice
    // Data will be scaled based on selected date range
    const locationClaimsDataByName = {
      // Manhattan, NY - Highest volume, premium cosmetic procedures
      'Manhattan, NY': [
        {
          status: 'Submitted' as const,
          totalClaims: Math.round(1567 * scalingFactor),
          totalAmount: Math.round(2194800 * scalingFactor),
          providers: [
            { name: 'Blue Cross Blue Shield', claimCount: Math.round(578 * scalingFactor), amount: Math.round(809200 * scalingFactor) },
            { name: 'Aetna', claimCount: Math.round(392 * scalingFactor), amount: Math.round(548800 * scalingFactor) },
            { name: 'United Healthcare', claimCount: Math.round(314 * scalingFactor), amount: Math.round(439600 * scalingFactor) },
            { name: 'Cigna', claimCount: Math.round(283 * scalingFactor), amount: Math.round(397200 * scalingFactor) }
          ]
        },
        {
          status: 'Paid' as const,
          totalClaims: Math.round(2845 * scalingFactor),
          totalAmount: Math.round(3983000 * scalingFactor),
          providers: [
            { name: 'Blue Cross Blue Shield', claimCount: Math.round(1048 * scalingFactor), amount: Math.round(1467200 * scalingFactor) },
            { name: 'Aetna', claimCount: Math.round(711 * scalingFactor), amount: Math.round(995400 * scalingFactor) },
            { name: 'United Healthcare', claimCount: Math.round(569 * scalingFactor), amount: Math.round(796600 * scalingFactor) },
            { name: 'Cigna', claimCount: Math.round(517 * scalingFactor), amount: Math.round(723800 * scalingFactor) }
          ]
        },
        {
          status: 'Pending' as const,
          totalClaims: Math.round(892 * scalingFactor),
          totalAmount: Math.round(1247800 * scalingFactor),
          providers: [
            { name: 'Blue Cross Blue Shield', claimCount: Math.round(324 * scalingFactor), amount: Math.round(453600 * scalingFactor) },
            { name: 'Aetna', claimCount: Math.round(289 * scalingFactor), amount: Math.round(404600 * scalingFactor) },
            { name: 'United Healthcare', claimCount: Math.round(167 * scalingFactor), amount: Math.round(233800 * scalingFactor) },
            { name: 'Cigna', claimCount: Math.round(112 * scalingFactor), amount: Math.round(155800 * scalingFactor) }
          ]
        },
        {
          status: 'Denied' as const,
          totalClaims: Math.round(234 * scalingFactor),
          totalAmount: Math.round(327600 * scalingFactor),
          providers: [
            { name: 'Blue Cross Blue Shield', claimCount: Math.round(89 * scalingFactor), amount: Math.round(124600 * scalingFactor) },
            { name: 'Aetna', claimCount: Math.round(67 * scalingFactor), amount: Math.round(93800 * scalingFactor) },
            { name: 'United Healthcare', claimCount: Math.round(45 * scalingFactor), amount: Math.round(63000 * scalingFactor) },
            { name: 'Cigna', claimCount: Math.round(33 * scalingFactor), amount: Math.round(46200 * scalingFactor) }
          ]
        }
      ],

      // Atlantic Highlands, NJ - Balanced medical/cosmetic mix
      'Atlantic Highlands, NJ': [
        {
          status: 'Submitted' as const,
          totalClaims: Math.round(1203 * scalingFactor),
          totalAmount: Math.round(1323300 * scalingFactor),
          providers: [
            { name: 'Blue Cross Blue Shield', claimCount: Math.round(421 * scalingFactor), amount: Math.round(463100 * scalingFactor) },
            { name: 'Horizon Blue Cross', claimCount: Math.round(289 * scalingFactor), amount: Math.round(317900 * scalingFactor) },
            { name: 'Aetna', claimCount: Math.round(265 * scalingFactor), amount: Math.round(291500 * scalingFactor) },
            { name: 'Medicare', claimCount: Math.round(228 * scalingFactor), amount: Math.round(250800 * scalingFactor) }
          ]
        },
        {
          status: 'Paid' as const,
          totalClaims: Math.round(2177 * scalingFactor),
          totalAmount: Math.round(2394700 * scalingFactor),
          providers: [
            { name: 'Blue Cross Blue Shield', claimCount: Math.round(762 * scalingFactor), amount: Math.round(838200 * scalingFactor) },
            { name: 'Horizon Blue Cross', claimCount: Math.round(523 * scalingFactor), amount: Math.round(575300 * scalingFactor) },
            { name: 'Aetna', claimCount: Math.round(479 * scalingFactor), amount: Math.round(526900 * scalingFactor) },
            { name: 'Medicare', claimCount: Math.round(413 * scalingFactor), amount: Math.round(454300 * scalingFactor) }
          ]
        },
        {
          status: 'Pending' as const,
          totalClaims: Math.round(567 * scalingFactor),
          totalAmount: Math.round(623700 * scalingFactor),
          providers: [
            { name: 'Blue Cross Blue Shield', claimCount: Math.round(189 * scalingFactor), amount: Math.round(207900 * scalingFactor) },
            { name: 'Horizon Blue Cross', claimCount: Math.round(156 * scalingFactor), amount: Math.round(171600 * scalingFactor) },
            { name: 'Aetna', claimCount: Math.round(123 * scalingFactor), amount: Math.round(135300 * scalingFactor) },
            { name: 'Medicare', claimCount: Math.round(99 * scalingFactor), amount: Math.round(108900 * scalingFactor) }
          ]
        },
        {
          status: 'Denied' as const,
          totalClaims: Math.round(178 * scalingFactor),
          totalAmount: Math.round(195800 * scalingFactor),
          providers: [
            { name: 'Blue Cross Blue Shield', claimCount: Math.round(67 * scalingFactor), amount: Math.round(73700 * scalingFactor) },
            { name: 'Horizon Blue Cross', claimCount: Math.round(45 * scalingFactor), amount: Math.round(49500 * scalingFactor) },
            { name: 'Aetna', claimCount: Math.round(34 * scalingFactor), amount: Math.round(37400 * scalingFactor) },
            { name: 'Medicare', claimCount: Math.round(32 * scalingFactor), amount: Math.round(35200 * scalingFactor) }
          ]
        }
      ],

      // Woodbridge, NJ - Growing location, medical focus
      'Woodbridge, NJ': [
        {
          status: 'Submitted' as const,
          totalClaims: Math.round(987 * scalingFactor),
          totalAmount: Math.round(888300 * scalingFactor),
          providers: [
            { name: 'Horizon Blue Cross', claimCount: Math.round(345 * scalingFactor), amount: Math.round(310500 * scalingFactor) },
            { name: 'Blue Cross Blue Shield', claimCount: Math.round(278 * scalingFactor), amount: Math.round(250200 * scalingFactor) },
            { name: 'Medicare', claimCount: Math.round(198 * scalingFactor), amount: Math.round(178200 * scalingFactor) },
            { name: 'Aetna', claimCount: Math.round(166 * scalingFactor), amount: Math.round(149400 * scalingFactor) }
          ]
        },
        {
          status: 'Paid' as const,
          totalClaims: Math.round(1789 * scalingFactor),
          totalAmount: Math.round(1610100 * scalingFactor),
          providers: [
            { name: 'Horizon Blue Cross', claimCount: Math.round(625 * scalingFactor), amount: Math.round(562500 * scalingFactor) },
            { name: 'Blue Cross Blue Shield', claimCount: Math.round(504 * scalingFactor), amount: Math.round(453600 * scalingFactor) },
            { name: 'Medicare', claimCount: Math.round(358 * scalingFactor), amount: Math.round(322200 * scalingFactor) },
            { name: 'Aetna', claimCount: Math.round(302 * scalingFactor), amount: Math.round(271800 * scalingFactor) }
          ]
        },
        {
          status: 'Pending' as const,
          totalClaims: Math.round(445 * scalingFactor),
          totalAmount: Math.round(400500 * scalingFactor),
          providers: [
            { name: 'Horizon Blue Cross', claimCount: Math.round(167 * scalingFactor), amount: Math.round(150300 * scalingFactor) },
            { name: 'Blue Cross Blue Shield', claimCount: Math.round(123 * scalingFactor), amount: Math.round(110700 * scalingFactor) },
            { name: 'Medicare', claimCount: Math.round(89 * scalingFactor), amount: Math.round(80100 * scalingFactor) },
            { name: 'Aetna', claimCount: Math.round(66 * scalingFactor), amount: Math.round(59400 * scalingFactor) }
          ]
        },
        {
          status: 'Denied' as const,
          totalClaims: Math.round(145 * scalingFactor),
          totalAmount: Math.round(130500 * scalingFactor),
          providers: [
            { name: 'Horizon Blue Cross', claimCount: Math.round(56 * scalingFactor), amount: Math.round(50400 * scalingFactor) },
            { name: 'Blue Cross Blue Shield', claimCount: Math.round(43 * scalingFactor), amount: Math.round(38700 * scalingFactor) },
            { name: 'Medicare', claimCount: Math.round(28 * scalingFactor), amount: Math.round(25200 * scalingFactor) },
            { name: 'Aetna', claimCount: Math.round(18 * scalingFactor), amount: Math.round(16200 * scalingFactor) }
          ]
        }
      ],

      // Fresno, CA - Established location, diverse patient base
      'Fresno, CA': [
        {
          status: 'Submitted' as const,
          totalClaims: Math.round(1356 * scalingFactor),
          totalAmount: Math.round(1491600 * scalingFactor),
          providers: [
            { name: 'Kaiser Permanente', claimCount: Math.round(487 * scalingFactor), amount: Math.round(535700 * scalingFactor) },
            { name: 'Blue Cross Blue Shield', claimCount: Math.round(352 * scalingFactor), amount: Math.round(387200 * scalingFactor) },
            { name: 'Aetna', claimCount: Math.round(298 * scalingFactor), amount: Math.round(327800 * scalingFactor) },
            { name: 'Medicare', claimCount: Math.round(219 * scalingFactor), amount: Math.round(240900 * scalingFactor) }
          ]
        },
        {
          status: 'Paid' as const,
          totalClaims: Math.round(2456 * scalingFactor),
          totalAmount: Math.round(2701600 * scalingFactor),
          providers: [
            { name: 'Kaiser Permanente', claimCount: Math.round(882 * scalingFactor), amount: Math.round(970200 * scalingFactor) },
            { name: 'Blue Cross Blue Shield', claimCount: Math.round(637 * scalingFactor), amount: Math.round(700700 * scalingFactor) },
            { name: 'Aetna', claimCount: Math.round(540 * scalingFactor), amount: Math.round(594000 * scalingFactor) },
            { name: 'Medicare', claimCount: Math.round(397 * scalingFactor), amount: Math.round(436700 * scalingFactor) }
          ]
        },
        {
          status: 'Pending' as const,
          totalClaims: Math.round(678 * scalingFactor),
          totalAmount: Math.round(745800 * scalingFactor),
          providers: [
            { name: 'Kaiser Permanente', claimCount: Math.round(243 * scalingFactor), amount: Math.round(267300 * scalingFactor) },
            { name: 'Blue Cross Blue Shield', claimCount: Math.round(189 * scalingFactor), amount: Math.round(207900 * scalingFactor) },
            { name: 'Aetna', claimCount: Math.round(134 * scalingFactor), amount: Math.round(147400 * scalingFactor) },
            { name: 'Medicare', claimCount: Math.round(112 * scalingFactor), amount: Math.round(123200 * scalingFactor) }
          ]
        },
        {
          status: 'Denied' as const,
          totalClaims: Math.round(198 * scalingFactor),
          totalAmount: Math.round(217800 * scalingFactor),
          providers: [
            { name: 'Kaiser Permanente', claimCount: Math.round(78 * scalingFactor), amount: Math.round(85800 * scalingFactor) },
            { name: 'Blue Cross Blue Shield', claimCount: Math.round(56 * scalingFactor), amount: Math.round(61600 * scalingFactor) },
            { name: 'Aetna', claimCount: Math.round(38 * scalingFactor), amount: Math.round(41800 * scalingFactor) },
            { name: 'Medicare', claimCount: Math.round(26 * scalingFactor), amount: Math.round(28600 * scalingFactor) }
          ]
        }
      ],

      // Hanford, CA - Newest location, building patient volume
      'Hanford, CA': [
        {
          status: 'Submitted' as const,
          totalClaims: Math.round(723 * scalingFactor),
          totalAmount: Math.round(578400 * scalingFactor),
          providers: [
            { name: 'Kaiser Permanente', claimCount: Math.round(267 * scalingFactor), amount: Math.round(213600 * scalingFactor) },
            { name: 'Blue Cross Blue Shield', claimCount: Math.round(189 * scalingFactor), amount: Math.round(151200 * scalingFactor) },
            { name: 'Medicare', claimCount: Math.round(145 * scalingFactor), amount: Math.round(116000 * scalingFactor) },
            { name: 'Aetna', claimCount: Math.round(122 * scalingFactor), amount: Math.round(97600 * scalingFactor) }
          ]
        },
        {
          status: 'Paid' as const,
          totalClaims: Math.round(1308 * scalingFactor),
          totalAmount: Math.round(1046400 * scalingFactor),
          providers: [
            { name: 'Kaiser Permanente', claimCount: Math.round(483 * scalingFactor), amount: Math.round(386400 * scalingFactor) },
            { name: 'Blue Cross Blue Shield', claimCount: Math.round(342 * scalingFactor), amount: Math.round(273600 * scalingFactor) },
            { name: 'Medicare', claimCount: Math.round(262 * scalingFactor), amount: Math.round(209600 * scalingFactor) },
            { name: 'Aetna', claimCount: Math.round(221 * scalingFactor), amount: Math.round(176800 * scalingFactor) }
          ]
        },
        {
          status: 'Pending' as const,
          totalClaims: Math.round(334 * scalingFactor),
          totalAmount: Math.round(267200 * scalingFactor),
          providers: [
            { name: 'Kaiser Permanente', claimCount: Math.round(123 * scalingFactor), amount: Math.round(98400 * scalingFactor) },
            { name: 'Blue Cross Blue Shield', claimCount: Math.round(89 * scalingFactor), amount: Math.round(71200 * scalingFactor) },
            { name: 'Medicare', claimCount: Math.round(67 * scalingFactor), amount: Math.round(53600 * scalingFactor) },
            { name: 'Aetna', claimCount: Math.round(55 * scalingFactor), amount: Math.round(44000 * scalingFactor) }
          ]
        },
        {
          status: 'Denied' as const,
          totalClaims: Math.round(89 * scalingFactor),
          totalAmount: Math.round(71200 * scalingFactor),
          providers: [
            { name: 'Kaiser Permanente', claimCount: Math.round(34 * scalingFactor), amount: Math.round(27200 * scalingFactor) },
            { name: 'Blue Cross Blue Shield', claimCount: Math.round(23 * scalingFactor), amount: Math.round(18400 * scalingFactor) },
            { name: 'Medicare', claimCount: Math.round(18 * scalingFactor), amount: Math.round(14400 * scalingFactor) },
            { name: 'Aetna', claimCount: Math.round(14 * scalingFactor), amount: Math.round(11200 * scalingFactor) }
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

    // Aggregate all locations for 'all' view - Updated for 4 status buckets
    const statusOrder = ['Submitted', 'Paid', 'Pending', 'Denied'] as const;
    const aggregatedData = statusOrder.map(status => ({
      status,
      totalClaims: 0,
      totalAmount: 0,
      providers: new Map()
    }));

    // Aggregate data from all locations
    Object.values(locationClaimsDataByName).forEach(locationData => {
      locationData.forEach(bucket => {
        // Find the corresponding aggregated bucket by status
        const aggregatedBucket = aggregatedData.find(agg => agg.status === bucket.status);
        if (aggregatedBucket && bucket.totalClaims !== undefined && bucket.totalAmount !== undefined) {
          aggregatedBucket.totalClaims += bucket.totalClaims;
          aggregatedBucket.totalAmount += bucket.totalAmount;
          
          if (bucket.providers && Array.isArray(bucket.providers)) {
            bucket.providers.forEach(provider => {
              const existingProvider = aggregatedBucket.providers.get(provider.name);
              if (existingProvider) {
                existingProvider.claimCount += provider.claimCount;
                existingProvider.amount += provider.amount;
              } else {
                aggregatedBucket.providers.set(provider.name, {
                  name: provider.name,
                  claimCount: provider.claimCount,
                  amount: provider.amount
                });
              }
            });
          }
        }
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
