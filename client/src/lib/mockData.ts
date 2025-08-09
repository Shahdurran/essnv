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
 * All mock data is based on real dermatology practice patterns:
 * - Actual CPT codes used in dermatology
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
 * Demo dermatology practice locations data
 */
export const practiceLocations = [
  {
    id: "manhattan-ny",
    name: "Manhattan, NY",
    address: "123 Demo Avenue, Suite 100",
    city: "New York",
    state: "NY",
    zipCode: "10001",
    phone: "555-001-0001",
    isActive: true,
    patientVolume: 425,
    monthlyRevenue: 178500
  },
  {
    id: "atlantic-highlands-nj",
    name: "Atlantic Highlands, NJ",
    address: "456 Sample Street",
    city: "Atlantic Highlands",
    state: "NJ",
    zipCode: "07700",
    phone: "555-002-0002",
    isActive: true,
    patientVolume: 298,
    monthlyRevenue: 125600
  },
  {
    id: "woodbridge-nj",
    name: "Woodbridge, NJ",
    address: "789 Example Blvd, Suite 200",
    city: "Woodbridge",
    state: "NJ",
    zipCode: "07090",
    phone: "555-003-0003",
    isActive: true,
    patientVolume: 312,
    monthlyRevenue: 134800
  },
  {
    id: "fresno-ca",
    name: "Fresno, CA",
    address: "321 Test Road, Suite 300",
    city: "Fresno",
    state: "CA",
    zipCode: "93700",
    phone: "555-004-0004",
    isActive: true,
    patientVolume: 156,
    monthlyRevenue: 89200
  },
  {
    id: "hanford-ca",
    name: "Hanford, CA",
    address: "654 Demo Plaza",
    city: "Hanford",
    state: "CA",
    zipCode: "93200",
    phone: "555-005-0005",
    isActive: true,
    patientVolume: 134,
    monthlyRevenue: 76400
  }
];

/**
 * Real dermatology procedures with actual CPT codes and revenue data
 */
export const topRevenueProcedures = [
  {
    id: "mohs-surgery-17311",
    cptCode: "17311",
    name: "Mohs Surgery (17311)",
    description: "First stage, head/neck",
    category: "medical",
    basePrice: 2500.00,
    monthlyVolume: 51,
    monthlyRevenue: 127450,
    growth: "+12.5%",
    icon: "cut",
    rvuValue: 10.85
  },
  {
    id: "excision-malignant-11603",
    cptCode: "11603",
    name: "Excision Malignant (11603)",
    description: "Trunk, arms, legs",
    category: "medical",
    basePrice: 850.00,
    monthlyVolume: 105,
    monthlyRevenue: 89320,
    growth: "+8.3%",
    icon: "search",
    rvuValue: 4.15
  },
  {
    id: "punch-biopsy-11104",
    cptCode: "11104",
    name: "Punch Biopsy (11104)",
    description: "Single lesion",
    category: "medical",
    basePrice: 320.00,
    monthlyVolume: 212,
    monthlyRevenue: 67890,
    growth: "+15.7%",
    icon: "microscope",
    rvuValue: 1.85
  },
  {
    id: "botox-injections",
    cptCode: "BOTOX",
    name: "Botox Injections",
    description: "Cosmetic treatment",
    category: "cosmetic",
    basePrice: 550.00,
    monthlyVolume: 82,
    monthlyRevenue: 45230,
    growth: "+22.1%",
    icon: "syringe",
    rvuValue: 0.00
  },
  {
    id: "destruction-lesions-17000",
    cptCode: "17000",
    name: "Destruction Lesions (17000)",
    description: "Premalignant lesions",
    category: "medical",
    basePrice: 250.00,
    monthlyVolume: 155,
    monthlyRevenue: 38670,
    growth: "+5.9%",
    icon: "fire",
    rvuValue: 1.25
  },
  {
    id: "dermal-fillers",
    cptCode: "FILLER",
    name: "Dermal Fillers",
    description: "Cosmetic enhancement",
    category: "cosmetic",
    basePrice: 750.00,
    monthlyVolume: 34,
    monthlyRevenue: 25500,
    growth: "+18.3%",
    icon: "magic",
    rvuValue: 0.00
  },
  {
    id: "established-visit-99214",
    cptCode: "99214",
    name: "Established Visit (99214)",
    description: "Moderate complexity",
    category: "medical",
    basePrice: 275.00,
    monthlyVolume: 156,
    monthlyRevenue: 42900,
    growth: "+7.2%",
    icon: "user-md",
    rvuValue: 1.75
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
    id: "mohs-analytics",
    question: "Mohs surgery analytics",
    icon: "cut",
    category: "procedures",
    usage: 134
  },
  {
    id: "cosmetic-vs-medical",
    question: "Cosmetic vs Medical revenue",
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
