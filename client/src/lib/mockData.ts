/*
 * MOCK DATA MODULE FOR MDS AI ANALYTICS
 * =====================================
 * 
 * This module provides sophisticated mock data generators that create realistic
 * medical practice analytics data for development, testing, and demonstration purposes.
 * 
 * WHY USE MOCK DATA?
 * - Real medical data contains PHI (Protected Health Information) and cannot be used
 * - Allows development and testing without HIPAA compliance concerns
 * - Provides consistent, predictable data for UI development
 * - Enables demos without requiring real practice management system integration
 * 
 * DATA MODELING APPROACH:
 * All mock data is based on real ophthalmology practice patterns:
 * - Actual CPT codes used in ophthalmology
 * - Realistic revenue ranges and patient volumes
 * - Seasonal patterns (cosmetic procedures peak in spring/summer)
 * - Insurance payer mix representative of US healthcare
 * - Growth trends typical of successful medical practices
 * 
 * MATHEMATICAL MODELING TECHNIQUES:
 * We use several mathematical functions to create realistic patterns:
 * - Sine waves for seasonal variation
 * - Exponential functions for growth trends
 * - Random variation within realistic bounds
 * - Compound calculations that mirror real business relationships
 */

// Import types from shared schema
import type { ClaimsBreakdown } from "../../../shared/schema";

/*
 * REVENUE TIME SERIES GENERATOR
 * =============================
 * 
 * This function creates historical and projected revenue data with realistic patterns.
 * It models the complex factors that affect medical practice revenue over time.
 * 
 * PARAMETERS EXPLAINED:
 * @param {number} months - How many months of data to generate (default: 24 for 2 years)
 * @param {number} baseRevenue - Starting monthly revenue amount (default: $420K)
 * 
 * RETURN VALUE:
 * Returns an array of objects, each representing one month's revenue data with:
 * - Historical data (actualRevenue) for past months
 * - Projected data (projectedRevenue) for future months
 * - Patient count estimates
 * - Date information in multiple formats
 * 
 * MATHEMATICAL COMPONENTS:
 * 1. Seasonal Factor: Uses sine wave to model seasonal peaks/valleys
 * 2. Growth Factor: Exponential growth representing practice expansion
 * 3. Monthly Variation: Random fluctuation within realistic bounds
 * 4. Final Revenue: Product of base × seasonal × growth × variation
 */
export function generateRevenueTimeSeriesData(months = 24, baseRevenue = 420000) {
  // Array to store the generated data points
  const data = [];
  // Get current date as reference point for generating time series
  const currentDate = new Date();
  
  /*
   * TIME SERIES GENERATION LOOP
   * ===========================
   * 
   * We loop backwards from the oldest month to the newest.
   * This ensures consistent data generation regardless of when the function is called.
   * 
   * LOOP LOGIC:
   * - i starts at (months - 1) and counts down to 0
   * - When i = months-1, we're generating the oldest data point
   * - When i = 0, we're generating the most recent data point
   */
  for (let i = months - 1; i >= 0; i--) {
    // Create a new date object for this data point
    const date = new Date(currentDate);
    // Set the month to i months ago
    date.setMonth(date.getMonth() - i);
    
    /*
     * SEASONAL VARIATION CALCULATION
     * ==============================
     * 
     * Medical practices, especially dermatology, have seasonal patterns:
     * - Spring/Summer: Higher cosmetic procedure volume (weddings, beach season)
     * - Fall/Winter: Lower cosmetic volume, stable medical procedures
     * 
     * SINE WAVE MATHEMATICS:
     * - Math.sin() creates a smooth wave pattern
     * - (date.getMonth() + 3) shifts the peak to summer months
     * - / 12 * 2 * Math.PI converts months to radians for sine function
     * - 0.15 limits variation to ±15% of base revenue
     * - + 1 ensures factor is always positive (0.85 to 1.15)
     */
    const seasonalFactor = 1 + 0.15 * Math.sin(((date.getMonth() + 3) / 12) * 2 * Math.PI);
    
    /*
     * GROWTH TREND CALCULATION
     * ========================
     * 
     * Successful medical practices typically grow 5-15% annually.
     * We use compound growth to model realistic practice expansion.
     * 
     * EXPONENTIAL GROWTH MATHEMATICS:
     * - Math.pow(1.08, exponent) calculates compound 8% annual growth
     * - (months - i - 1) / 12 converts the time period to years
     * - This creates accelerating growth over time, like real businesses
     */
    const growthFactor = Math.pow(1.08, (months - i - 1) / 12);
    
    /*
     * MONTHLY VARIATION (NOISE)
     * =========================
     * 
     * Real revenue isn't perfectly smooth - there's month-to-month variation from:
     * - Patient scheduling patterns
     * - Staff availability
     * - Economic factors
     * - Random events (weather, local events, etc.)
     * 
     * RANDOM VARIATION MATHEMATICS:
     * - Math.random() generates 0 to 1
     * - * 0.3 scales to 0 to 0.3
     * - - 0.15 shifts range to -0.15 to +0.15 (±15%)
     * - + 1 ensures factor is positive (0.85 to 1.15)
     */
    const monthlyVariation = 1 + (Math.random() * 0.3 - 0.15);
    
    /*
     * FINAL REVENUE CALCULATION
     * =========================
     * 
     * Combine all factors to get realistic monthly revenue:
     * Revenue = Base × Seasonal × Growth × Random Variation
     * 
     * Math.round() ensures we get whole dollar amounts (no fractional cents)
     */
    const revenue = Math.round(baseRevenue * seasonalFactor * growthFactor * monthlyVariation);
    
    /*
     * DATA POINT CONSTRUCTION
     * =======================
     * 
     * Create a rich data object with multiple date formats and derived metrics
     */
    data.push({
      // ISO date string in YYYY-MM format for consistent sorting/parsing
      month: date.toISOString().slice(0, 7),
      
      // Human-readable date for UI display (e.g., "Jan 2025")
      monthName: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      
      // Core revenue amount
      revenue: revenue,
      
      // Estimated patient count based on average revenue per patient
      // $340 per patient is realistic for dermatology (mix of simple and complex visits)
      patientCount: Math.round(revenue / 340),
      
      /*
       * HISTORICAL vs PROJECTED DATA LOGIC
       * ==================================
       * 
       * We separate historical (known) data from projected (predicted) data.
       * This enables charts to show different styling for past vs future.
       * 
       * LOGIC:
       * - i > 2: This data point is more than 2 months ago (historical)
       * - i <= 2: This data point is recent or future (projected)
       * 
       * This creates a realistic scenario where we have historical data but
       * recent months might still be incomplete or projected.
       */
      actualRevenue: i > 2 ? revenue : null,        // Historical data only
      projectedRevenue: i <= 2 ? revenue : null,    // Recent/future data only
      
      // Full JavaScript Date object for complex date operations
      date: date,
      
      // Boolean flag for easy filtering of projected vs actual data
      isProjected: i <= 2
    });
  }
  
  // Return the complete time series dataset
  return data;
}

/*
 * PATIENT VOLUME PROJECTION GENERATOR
 * ===================================
 * 
 * This function creates forward-looking predictions for patient volume.
 * Unlike the revenue generator which includes historical data, this focuses
 * purely on future projections with confidence intervals.
 * 
 * BUSINESS CONTEXT:
 * Medical practices need patient volume forecasts for:
 * - Staffing decisions (how many doctors/nurses to schedule?)
 * - Facility planning (do we need more exam rooms?)
 * - Equipment purchasing (can we afford new laser equipment?)
 * - Financial projections (will we meet revenue targets?)
 * 
 * FORECASTING CHALLENGES:
 * Patient volume is influenced by many factors:
 * - Seasonal patterns (skin issues peak in summer, Botox peaks before events)
 * - Economic conditions (cosmetic procedures are discretionary spending)
 * - Marketing effectiveness (new patient acquisition campaigns)
 * - Competition (new dermatology practices opening nearby)
 * - Population growth in service area
 * 
 * CONFIDENCE MODELING:
 * Forecasts become less reliable the further into the future we project.
 * Our model reflects this by decreasing confidence over time.
 * 
 * @param {number} months - Number of future months to project (default: 6)
 * @returns {Array} Array of patient volume projection objects
 */
export function generatePatientVolumeProjections(months = 6) {
  // Array to store projection data points
  const projections = [];
  
  // Base patient volume - current monthly average across all locations
  // This represents the practice's current capacity and patient load
  const baseVolume = 1247;
  
  // Current date as starting point for future projections
  const currentDate = new Date();
  
  /*
   * PROJECTION GENERATION LOOP
   * ==========================
   * 
   * Unlike the revenue function, this loops forward into the future.
   * i = 1 is next month, i = 2 is two months out, etc.
   */
  for (let i = 1; i <= months; i++) {
    // Create date object for this future month
    const date = new Date(currentDate);
    date.setMonth(date.getMonth() + i);
    
    /*
     * ACCELERATING GROWTH MODEL
     * =========================
     * 
     * Successful medical practices often experience accelerating growth as:
     * - Word-of-mouth referrals compound over time
     * - Marketing efforts build momentum
     * - Practice reputation grows in the community
     * - New service offerings attract different patient segments
     * 
     * GROWTH CALCULATION:
     * - Base growth rate: 10% annually
     * - Acceleration factor: +1% per month into the future
     * - This creates increasingly optimistic projections (realistic for growing practices)
     */
    const growthRate = 0.10 + (i * 0.01); // Accelerating growth pattern
    
    /*
     * SEASONAL FACTOR FOR PATIENT VOLUME
     * ==================================
     * 
     * Patient volume has similar seasonal patterns to revenue but slightly different:
     * - Cosmetic procedures: Peak in spring/summer (weddings, vacations)
     * - Medical procedures: More consistent year-round
     * - Skin cancer screenings: Peak in late summer (post-vacation awareness)
     * 
     * MATHEMATICAL IMPLEMENTATION:
     * - Same sine wave approach as revenue
     * - Slightly higher variation (12% vs 15%) for patient volume
     * - Patients are more sensitive to seasons than revenue (procedure mix changes)
     */
    const seasonalFactor = 1 + 0.12 * Math.sin(((date.getMonth() + 3) / 12) * 2 * Math.PI);
    
    /*
     * PROJECTED VOLUME CALCULATION
     * ============================
     * 
     * Combine base volume with growth and seasonal factors:
     * Volume = Base × Seasonal × (1 + Growth Rate × Time Period)
     * 
     * The (1 + growthRate * i / 12) formula applies annual growth rate
     * proportionally to the number of months projected.
     */
    const projectedVolume = Math.round(baseVolume * seasonalFactor * (1 + growthRate * i / 12));
    
    /*
     * CONFIDENCE LEVEL CALCULATION
     * ============================
     * 
     * Forecasting confidence decreases over time due to:
     * - Increasing uncertainty about external factors
     * - Compounding of small errors in assumptions
     * - Market volatility and unpredictable events
     * 
     * CONFIDENCE FORMULA:
     * - Start at 95% confidence for next month
     * - Decrease by 5% each month out
     * - Minimum confidence of 65% (even long-term forecasts have some value)
     * 
     * Math.max(0.65, calculation) ensures we never go below 65%
     */
    const confidenceLevel = Math.max(0.65, 0.95 - (i * 0.05));
    
    /*
     * GROWTH RATE PERCENTAGE CALCULATION
     * ==================================
     * 
     * Calculate percentage growth compared to current baseline.
     * This helps users understand the magnitude of projected change.
     * 
     * FORMULA:
     * Growth % = ((Projected - Current) / Current) × 100
     * 
     * .toFixed(1) rounds to 1 decimal place for clean display
     */
    const growthPercentage = ((projectedVolume - baseVolume) / baseVolume * 100).toFixed(1) + '%';
    
    // Add this projection to the results array
    projections.push({
      // ISO date format for consistent parsing
      month: date.toISOString().slice(0, 7),
      
      // Full month name for user-friendly display (e.g., "March 2025")
      monthName: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      
      // Core projection metrics
      projectedPatients: projectedVolume,
      
      // Revenue projection based on patient volume
      // Uses same $340 average revenue per patient as other calculations
      projectedRevenue: projectedVolume * 340,
      
      // Confidence level (0.0 to 1.0, where 1.0 = 100% confident)
      confidenceLevel: confidenceLevel,
      
      // Growth rate as formatted percentage string
      growthRate: growthPercentage,
      
      // Full date object for complex date operations
      date: date
    });
  }
  
  // Return array of projection objects
  return projections;
}

/**
 * Eye specialist practice locations data
 */
export const practiceLocations = [
  {
    id: "fairfax",
    name: "Fairfax",
    address: "10721 Main St, Suite 2200",
    city: "Fairfax",
    state: "VA",
    zipCode: "22030",
    phone: "571-445-0001",
    isActive: true,
    patientVolume: 650,
    monthlyRevenue: 1592500
  },
  {
    id: "gainesville",
    name: "Gainesville",
    address: "7601 Heritage Dr, Suite 330",
    city: "Gainesville",
    state: "VA",
    zipCode: "20155",
    phone: "571-445-0002",
    isActive: true,
    patientVolume: 350,
    monthlyRevenue: 857500
  }
];

/**
 * Real ophthalmology procedures with actual CPT codes and revenue data
 */
export const topRevenueProcedures = [
  {
    id: "cataract-surgery-66984",
    cptCode: "66984",
    name: "Cataract Surgery (66984)",
    description: "With IOL insertion",
    category: "medical",
    basePrice: 3500.00,
    monthlyVolume: 85,
    monthlyRevenue: 297500,
    growth: "+18.5%",
    icon: "eye",
    rvuValue: 15.57
  },
  {
    id: "intravitreal-injection-67028",
    cptCode: "67028",
    name: "Intravitreal Injection (67028)",
    description: "Medication injection",
    category: "medical",
    basePrice: 1200.00,
    monthlyVolume: 145,
    monthlyRevenue: 174000,
    growth: "+22.3%",
    icon: "syringe",
    rvuValue: 3.25
  },
  {
    id: "lasik-surgery",
    cptCode: "LASIK",
    name: "LASIK Surgery",
    description: "Refractive surgery",
    category: "refractive",
    basePrice: 4500.00,
    monthlyVolume: 28,
    monthlyRevenue: 126000,
    growth: "+15.7%",
    icon: "zap",
    rvuValue: 0.00
  },
  {
    id: "blepharoplasty-15823",
    cptCode: "15823",
    name: "Blepharoplasty (15823)",
    description: "Upper eyelid surgery",
    category: "cosmetic",
    basePrice: 2500.00,
    monthlyVolume: 32,
    monthlyRevenue: 80000,
    growth: "+12.1%",
    icon: "scissors",
    rvuValue: 8.45
  },
  {
    id: "oct-scan-92134",
    cptCode: "92134",
    name: "OCT Scan (92134)",
    description: "Retinal imaging",
    category: "medical",
    basePrice: 320.00,
    monthlyVolume: 235,
    monthlyRevenue: 75200,
    growth: "+8.9%",
    icon: "camera",
    rvuValue: 0.84
  },
  {
    id: "trabeculoplasty-65855",
    cptCode: "65855",
    name: "Trabeculoplasty (65855)",
    description: "Laser glaucoma treatment",
    category: "medical",
    basePrice: 850.00,
    monthlyVolume: 65,
    monthlyRevenue: 55250,
    growth: "+18.3%",
    icon: "target",
    rvuValue: 4.12
  },
  {
    id: "comprehensive-exam-92004",
    cptCode: "92004",
    name: "Comprehensive Exam (92004)",
    description: "New patient exam",
    category: "medical",
    basePrice: 250.00,
    monthlyVolume: 185,
    monthlyRevenue: 46250,
    growth: "+7.2%",
    icon: "search",
    rvuValue: 2.11
  },
  {
    id: "new-patient-99204",
    cptCode: "99204",
    name: "New Patient (99204)",
    description: "45-59 minutes",
    category: "medical",
    basePrice: 420.00,
    monthlyVolume: 67,
    monthlyRevenue: 28140,
    growth: "+11.4%",
    icon: "user-plus",
    rvuValue: 2.75
  }
];

/**
 * Insurance payer breakdown with real-world data
 */
export const insurancePayerBreakdown = [
  {
    name: "Blue Cross Blue Shield",
    percentage: 32.4,
    arDays: 24.2,
    revenue: 136800,
    claimRate: 96.2,
    color: "blue"
  },
  {
    name: "Aetna",
    percentage: 18.7,
    arDays: 31.5,
    revenue: 78900,
    claimRate: 94.1,
    color: "red"
  },
  {
    name: "Self-Pay",
    percentage: 15.2,
    arDays: 0,
    revenue: 64200,
    claimRate: 100.0,
    color: "green"
  },
  {
    name: "Medicare",
    percentage: 12.8,
    arDays: 45.3,
    revenue: 54000,
    claimRate: 91.8,
    color: "purple"
  },
  {
    name: "Cigna",
    percentage: 8.9,
    arDays: 28.7,
    revenue: 37600,
    claimRate: 95.3,
    color: "orange"
  },
  {
    name: "United Healthcare",
    percentage: 7.3,
    arDays: 33.1,
    revenue: 30800,
    claimRate: 93.7,
    color: "indigo"
  },
  {
    name: "Other",
    percentage: 4.7,
    arDays: 35.8,
    revenue: 19800,
    claimRate: 92.4,
    color: "gray"
  }
];

/**
 * Key performance indicators for the practice
 */
export const keyPerformanceIndicators = {
  monthlyPatients: 1247,
  monthlyRevenue: 423000,
  arDays: 28.4,
  cleanClaimRate: 94.2,
  patientGrowth: "+8.2%",
  revenueGrowth: "+12.5%",
  averageRevenuePerPatient: 340,
  noShowRate: 6.8,
  cancellationRate: 4.2,
  newPatientRate: 18.5,
  referralRate: 23.7
};

/**
 * Popular AI assistant questions with metadata
 */
export const popularQuestions = [
  {
    id: "patient-forecast",
    question: "Patient forecast for next month",
    icon: "chart-line",
    category: "forecasting",
    usage: 245
  },
  {
    id: "top-revenue",
    question: "Top revenue procedures this quarter",
    icon: "dollar-sign",
    category: "revenue",
    usage: 198
  },
  {
    id: "ar-days",
    question: "AR days by insurance payer",
    icon: "clock",
    category: "operations",
    usage: 167
  },
  {
    id: "lasik-analytics",
    question: "LASIK surgery analytics",
    icon: "zap",
    category: "procedures",
    usage: 134
  },
  {
    id: "refractive-vs-medical",
    question: "Bad debt analysis",
    icon: "balance-scale",
    category: "revenue",
    usage: 122
  },
  {
    id: "best-location",
    question: "Best performing location",
    icon: "trophy",
    category: "locations",
    usage: 98
  }
];

/**
 * Chart configuration templates for different visualization types
 */
export const chartConfigurations = {
  revenueChart: {
    type: 'line',
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          titleColor: '#1f2937',
          bodyColor: '#6b7280',
          borderColor: '#e5e7eb',
          borderWidth: 1
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          ticks: {
            callback: function(value) {
              return '$' + (value / 1000) + 'K';
            }
          },
          grid: {
            color: '#f3f4f6'
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      },
      elements: {
        point: {
          radius: 4,
          hoverRadius: 6
        },
        line: {
          tension: 0.4
        }
      }
    }
  },
  
  procedureChart: {
    type: 'doughnut',
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  }
};

/**
 * Utility function to filter data by location
 * @param {Array} data - The data array to filter
 * @param {string} locationId - The location ID to filter by (or 'all')
 * @returns {Array} Filtered data array
 */
export function filterDataByLocation(data, locationId) {
  if (locationId === 'all' || !locationId) {
    return data;
  }
  
  return data.filter(item => item.locationId === locationId);
}

/**
 * Utility function to aggregate data across all locations
 * @param {Array} data - Array of location-specific data
 * @param {string} valueField - Field name to aggregate
 * @returns {number} Aggregated value
 */
export function aggregateAcrossLocations(data, valueField) {
  return data.reduce((total, item) => total + (item[valueField] || 0), 0);
}

/**
 * Generate sample chat conversation for the AI assistant
 */
export const sampleChatHistory = [
  {
    id: "welcome",
    type: "ai",
    message: "Hi Dr. Rao! I'm your AI business analytics assistant. Ask me anything about your practice performance, forecasts, or key metrics across your 5 locations.",
    timestamp: new Date(Date.now() - 30000).toISOString()
  }
];

/*
 * INSURANCE CLAIMS BREAKDOWN GENERATOR
 * ====================================
 * 
 * This function generates realistic insurance claims data organized by status
 * and insurance provider for the Insurance Claims Tracker widget.
 */
export function generateInsuranceClaimsBreakdown(locationId: string = 'all'): ClaimsBreakdown[] {
  return [
    {
      status: 'Pending',
      totalClaims: 156,
      totalAmount: 89500,
      providers: [
        { name: 'Blue Cross Blue Shield', claimCount: 45, amount: 32000 },
        { name: 'Aetna', claimCount: 38, amount: 28500 },
        { name: 'Medicare', claimCount: 73, amount: 29000 }
      ]
    },
    {
      status: 'Submitted',
      totalClaims: 89,
      totalAmount: 45600,
      providers: [
        { name: 'United Healthcare', claimCount: 32, amount: 18200 },
        { name: 'Cigna', claimCount: 28, amount: 15600 },
        { name: 'Humana', claimCount: 29, amount: 11800 }
      ]
    },
    {
      status: 'Denied',
      totalClaims: 23,
      totalAmount: 12800,
      providers: [
        { name: 'Blue Cross Blue Shield', claimCount: 8, amount: 4200 },
        { name: 'Aetna', claimCount: 7, amount: 3800 },
        { name: 'Medicare', claimCount: 8, amount: 4800 }
      ]
    }
  ];
}

/*
 * AR BUCKETS DATA GENERATOR
 * =========================
 * 
 * This function generates accounts receivable aging data for the AR Buckets widget.
 */
export function generateARBucketsData(locationId: string = 'all') {
  return {
    buckets: [
      {
        ageRange: '0-30',
        amount: 125000,
        claimCount: 89,
        color: {
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-800'
        }
      },
      {
        ageRange: '31-60',
        amount: 78000,
        claimCount: 45,
        color: {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-800'
        }
      },
      {
        ageRange: '61-90',
        amount: 42000,
        claimCount: 23,
        color: {
          bg: 'bg-orange-50',
          border: 'border-orange-200',
          text: 'text-orange-800'
        }
      },
      {
        ageRange: '90+',
        amount: 18000,
        claimCount: 12,
        color: {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-800'
        }
      }
    ],
    totalAR: 263000,
    currentAR: 125000,
    agedAR: 138000
  };
}

/*
 * KEY METRICS DATA GENERATOR
 * ==========================
 * 
 * This function generates key performance indicators for the Practice Insights widget.
 */
export function generateKeyMetrics(locationId: string = 'all', timeRange: string = '1') {
  return {
    monthlyPatients: 1247,
    monthlyRevenue: 245000,
    arDays: 28.4,
    cleanClaimRate: 94.2,
    patientGrowth: "+8.2%",
    revenueGrowth: "+12.5%",
    averageRevenuePerPatient: 196,
    noShowRate: 6.8,
    cancellationRate: 4.2,
    newPatientRate: 18.5,
    referralRate: 23.7
  };
}

/*
 * PATIENT BILLING ANALYTICS DATA GENERATOR
 * ========================================
 * 
 * This function generates patient billing analytics data for the PatientBillingAnalytics widget.
 */
export function generatePatientBillingData(locationId: string = 'all') {
  return {
    totalRevenue: 125000,
    totalPaid: 109125,  // 87.3% collection rate
    totalOutstanding: 15875
  };
}
