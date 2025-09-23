/*
 * DATA SERVICE FOR MDS AI ANALYTICS
 * =================================
 * 
 * This service provides data from static JSON files to the frontend components.
 * It processes the real data from practice_locations.json, cash_flow_monthly_data.json,
 * and pl_monthly_data.json to provide the interface that components expect.
 * 
 * BENEFITS:
 * - Uses real practice data from JSON files
 * - No API calls needed (faster loading)
 * - No network dependencies
 * - No database required
 * - Works offline
 */

import {
  topRevenueProcedures,
  insurancePayerBreakdown,
  popularQuestions,
  generatePatientVolumeProjections
} from './mockData';

import {
  getProcessedLocations,
  getCashFlowDataForLocation,
  getPLDataForLocation,
  getRevenueTrendsFromPL,
  getFinancialRevenueFromPL,
  getFinancialExpensesFromPL,
  calculateKeyMetrics
} from './staticData';

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
    return getProcessedLocations();
  },

  // Get key performance metrics
  async getKeyMetrics(locationId?: string, timeRange?: string): Promise<KeyMetrics> {
    return calculateKeyMetrics(locationId, timeRange);
  },

  // Get financial revenue data
  async getFinancialRevenue(locationId?: string, period?: string): Promise<FinancialResponse> {
    return getFinancialRevenueFromPL(locationId, period);
  },

  // Get financial expenses data
  async getFinancialExpenses(locationId?: string, period?: string): Promise<FinancialResponse> {
    return getFinancialExpensesFromPL(locationId, period);
  },

  // Get cash flow data
  async getCashFlow(locationId?: string, period?: string): Promise<any> {
    return getCashFlowDataForLocation(locationId, period);
  },

  // Get profit & loss data
  async getProfitLoss(locationId?: string, period?: string): Promise<ProfitLossResponse> {
    return getPLDataForLocation(locationId, period);
  },

  // Get revenue trends data
  async getRevenueTrends(locationId?: string, period?: string): Promise<RevenueTrendData[]> {
    return getRevenueTrendsFromPL(locationId, period);
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
