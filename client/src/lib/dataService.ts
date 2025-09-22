/*
 * DATA SERVICE FOR MDS AI ANALYTICS
 * =================================
 * 
 * This service provides embedded data to the frontend components instead of making API calls.
 * It uses the mock data from mockData.ts and provides the same interface that the components expect.
 * 
 * BENEFITS:
 * - No API calls needed (faster loading)
 * - No network dependencies
 * - Consistent data across all environments
 * - No database required
 * - Works offline
 */

import {
  practiceLocations,
  topRevenueProcedures,
  insurancePayerBreakdown,
  keyPerformanceIndicators,
  popularQuestions,
  generateRevenueTimeSeriesData,
  generatePatientVolumeProjections
} from './mockData';

// Types to match the API responses
export interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  isActive: boolean;
}

export interface KeyMetrics {
  monthlyPatients: number;
  monthlyRevenue: number;
  arDays: number;
  cleanClaimRate: number;
  patientGrowth: string;
  revenueGrowth: string;
  averageRevenuePerPatient: number;
  noShowRate: number;
  cancellationRate: number;
  newPatientRate: number;
  referralRate: number;
}

export interface FinancialCategory {
  id: string;
  name: string;
  amount: number;
  change: number;
  trend: 'up' | 'down';
}

export interface FinancialResponse {
  categories: FinancialCategory[];
  total: number;
  period: string;
}

export interface CashFlowResponse {
  operating: Array<{ name: string; amount: number; change: number; trend: 'up' | 'down' }>;
  investing: Array<{ name: string; amount: number; change: number; trend: 'up' | 'down' }>;
  financing: Array<{ name: string; amount: number; change: number; trend: 'up' | 'down' }>;
  netCashFlow: number;
  period: string;
}

export interface ProfitLossResponse {
  revenue: Record<string, number>;
  expenses: Record<string, number>;
  grossProfit: number;
  ebitda: number;
  netIncome: number;
  period: string;
}

export interface RevenueTrendData {
  month: string;
  revenue: number;
  expenses: number;
  ebitda: number;
  writeOffs: number;
  patientCount: number;
  isProjected?: boolean;
}

export interface ARBucket {
  name: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface ARBucketsResponse {
  buckets: ARBucket[];
  totalAR: number;
  period: string;
}

export interface InsuranceClaimsData {
  submitted: number;
  paid: number;
  pending: number;
  denied: number;
  paidPercentage: number;
  pendingPercentage: number;
  deniedPercentage: number;
}

export interface PatientBillingData {
  totalBilled: number;
  totalCollected: number;
  collectionRate: number;
  averageDaysToPayment: number;
  outstandingBalance: number;
}

// Data service functions that return embedded data
export const dataService = {
  // Get all practice locations
  async getLocations(): Promise<Location[]> {
    return practiceLocations.map(loc => ({
      id: loc.id,
      name: loc.name,
      address: loc.address,
      city: loc.city,
      state: loc.state,
      zipCode: loc.zipCode,
      phone: loc.phone,
      isActive: loc.isActive
    }));
  },

  // Get key performance metrics
  async getKeyMetrics(locationId?: string, timeRange?: string): Promise<KeyMetrics> {
    // For now, return the same metrics regardless of location/timeRange
    // In a real app, you'd filter based on these parameters
    return keyPerformanceIndicators;
  },

  // Get financial revenue data
  async getFinancialRevenue(locationId?: string, period?: string): Promise<FinancialResponse> {
    // Generate revenue categories based on the embedded data
    const categories: FinancialCategory[] = [
      {
        id: 'office-visits',
        name: 'Office Visits',
        amount: 1671668,
        change: 3.6,
        trend: 'up'
      },
      {
        id: 'diagnostics-minor-procedures',
        name: 'Diagnostics & Minor Procedures',
        amount: 990618,
        change: 2.1,
        trend: 'up'
      },
      {
        id: 'cataract-surgeries',
        name: 'Cataract Surgeries',
        amount: 756000,
        change: 1.8,
        trend: 'up'
      },
      {
        id: 'intravitreal-injections',
        name: 'Intravitreal Injections',
        amount: 3497582,
        change: 4.2,
        trend: 'up'
      },
      {
        id: 'refractive-cash',
        name: 'Refractive Cash',
        amount: 226800,
        change: 5.1,
        trend: 'up'
      },
      {
        id: 'corneal-procedures',
        name: 'Corneal Procedures',
        amount: 189000,
        change: 2.3,
        trend: 'up'
      },
      {
        id: 'oculoplastics',
        name: 'Oculoplastics',
        amount: 189000,
        change: 1.9,
        trend: 'up'
      },
      {
        id: 'optical-contact-lens-sales',
        name: 'Optical / Contact Lens Sales',
        amount: 138600,
        change: 0.8,
        trend: 'up'
      }
    ];

    const total = categories.reduce((sum, cat) => sum + cat.amount, 0);

    return {
      categories,
      total,
      period: period || '1Y'
    };
  },

  // Get financial expenses data
  async getFinancialExpenses(locationId?: string, period?: string): Promise<FinancialResponse> {
    const categories: FinancialCategory[] = [
      {
        id: 'drug-acquisition-injections',
        name: 'Drug Acquisition (injections)',
        amount: 2268000,
        change: -2.4,
        trend: 'down'
      },
      {
        id: 'surgical-supplies-iols',
        name: 'Surgical Supplies (IOLs)',
        amount: 1890000,
        change: -1.8,
        trend: 'down'
      },
      {
        id: 'staff-wages',
        name: 'Staff Wages',
        amount: 1450000,
        change: 3.2,
        trend: 'up'
      },
      {
        id: 'rent-facilities',
        name: 'Rent & Facilities',
        amount: 420000,
        change: 2.1,
        trend: 'up'
      },
      {
        id: 'technology-software',
        name: 'Technology & Software',
        amount: 180000,
        change: 4.5,
        trend: 'up'
      },
      {
        id: 'marketing-advertising',
        name: 'Marketing & Advertising',
        amount: 120000,
        change: 1.2,
        trend: 'up'
      },
      {
        id: 'insurance-malpractice',
        name: 'Insurance & Malpractice',
        amount: 95000,
        change: 0.8,
        trend: 'up'
      },
      {
        id: 'utilities',
        name: 'Utilities',
        amount: 75000,
        change: -0.5,
        trend: 'down'
      }
    ];

    const total = categories.reduce((sum, cat) => sum + cat.amount, 0);

    return {
      categories,
      total,
      period: period || '1Y'
    };
  },

  // Get cash flow data
  async getCashFlow(locationId?: string, period?: string): Promise<CashFlowResponse> {
    return {
      operating: [
        {
          name: 'Insurance Reimbursements',
          amount: 5361488,
          change: -0.35,
          trend: 'up'
        },
        {
          name: 'Patient Payments',
          amount: 2297780,
          change: 2.29,
          trend: 'up'
        }
      ],
      investing: [
        {
          name: 'Equipment Purchases',
          amount: -450000,
          change: -5.2,
          trend: 'down'
        },
        {
          name: 'Facility Improvements',
          amount: -180000,
          change: 2.1,
          trend: 'up'
        }
      ],
      financing: [
        {
          name: 'Loan Payments',
          amount: -125000,
          change: 0.0,
          trend: 'up'
        },
        {
          name: 'Equipment Financing',
          amount: -85000,
          change: -1.2,
          trend: 'down'
        }
      ],
      netCashFlow: 6871188,
      period: period || '1Y'
    };
  },

  // Get profit & loss data
  async getProfitLoss(locationId?: string, period?: string): Promise<ProfitLossResponse> {
    return {
      revenue: {
        'Office Visits': 1671668,
        'Diagnostics & Minor Procedures': 990618,
        'Cataract Surgeries': 756000,
        'Intravitreal Injections': 3497582,
        'Refractive Cash': 226800,
        'Corneal Procedures': 189000,
        'Oculoplastics': 189000,
        'Optical / Contact Lens Sales': 138600
      },
      expenses: {
        'Drug Acquisition (injections)': 2268000,
        'Surgical Supplies (IOLs)': 1890000,
        'Staff Wages': 1450000,
        'Rent & Facilities': 420000,
        'Technology & Software': 180000,
        'Marketing & Advertising': 120000,
        'Insurance & Malpractice': 95000,
        'Utilities': 75000
      },
      grossProfit: 7659000 - 6505000, // Revenue - Direct Costs
      ebitda: 1154000,
      netIncome: 892000,
      period: period || '1Y'
    };
  },

  // Get revenue trends data
  async getRevenueTrends(locationId?: string, period?: string): Promise<RevenueTrendData[]> {
    const timeSeriesData = generateRevenueTimeSeriesData(24, 2450000);
    
    return timeSeriesData.map(item => ({
      month: item.month,
      revenue: item.revenue,
      expenses: Math.round(item.revenue * 0.65), // Assume 65% expense ratio
      ebitda: Math.round(item.revenue * 0.35), // Assume 35% EBITDA margin
      writeOffs: Math.round(item.revenue * 0.08), // Assume 8% write-off rate
      patientCount: item.patientCount,
      isProjected: item.isProjected
    }));
  },

  // Get AR buckets data
  async getARBuckets(locationId?: string): Promise<ARBucketsResponse> {
    const buckets: ARBucket[] = [
      {
        name: '0-30 Days',
        amount: 245000,
        percentage: 45.2,
        color: 'green'
      },
      {
        name: '31-60 Days',
        amount: 156000,
        percentage: 28.8,
        color: 'yellow'
      },
      {
        name: '61-90 Days',
        amount: 89000,
        percentage: 16.4,
        color: 'orange'
      },
      {
        name: '90+ Days',
        amount: 52000,
        percentage: 9.6,
        color: 'red'
      }
    ];

    const totalAR = buckets.reduce((sum, bucket) => sum + bucket.amount, 0);

    return {
      buckets,
      totalAR,
      period: '1Y'
    };
  },

  // Get insurance claims data
  async getInsuranceClaims(locationId?: string, startDate?: Date, endDate?: Date): Promise<InsuranceClaimsData> {
    return {
      submitted: 2450000,
      paid: 1960000,
      pending: 343000,
      denied: 147000,
      paidPercentage: 80.0,
      pendingPercentage: 14.0,
      deniedPercentage: 6.0
    };
  },

  // Get patient billing data
  async getPatientBilling(locationId?: string, timeRange?: string): Promise<PatientBillingData> {
    return {
      totalBilled: 2450000,
      totalCollected: 2297780,
      collectionRate: 93.8,
      averageDaysToPayment: 28.4,
      outstandingBalance: 152220
    };
  },

  // Get top revenue procedures
  async getTopRevenueProcedures(locationId?: string, category?: string, timeRange?: string) {
    let procedures = topRevenueProcedures;
    
    if (category && category !== 'all') {
      procedures = procedures.filter(p => p.category === category);
    }
    
    return procedures;
  },

  // Get insurance payer breakdown
  async getInsurancePayerBreakdown(locationId?: string, timeRange?: string) {
    return insurancePayerBreakdown;
  },

  // Get patient volume projections
  async getPatientVolumeProjections(locationId?: string) {
    return generatePatientVolumeProjections(6);
  },

  // Get popular questions
  async getPopularQuestions() {
    return popularQuestions;
  }
};

// Export individual functions for easier importing
export const {
  getLocations,
  getKeyMetrics,
  getFinancialRevenue,
  getFinancialExpenses,
  getCashFlow,
  getProfitLoss,
  getRevenueTrends,
  getARBuckets,
  getInsuranceClaims,
  getPatientBilling,
  getTopRevenueProcedures,
  getInsurancePayerBreakdown,
  getPatientVolumeProjections,
  getPopularQuestions
} = dataService;
