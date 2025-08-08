/**
 * Mock Data Module for MDS AI Analytics
 * Provides structured time series and analytics data for development and testing
 * All data is modeled after real dermatology practice scenarios and CPT codes
 */

/**
 * Generate realistic time series data for revenue trends
 * @param {number} months - Number of months of data to generate
 * @param {number} baseRevenue - Base monthly revenue amount
 * @returns {Array} Array of monthly revenue data points
 */
export function generateRevenueTimeSeriesData(months = 24, baseRevenue = 420000) {
  const data = [];
  const currentDate = new Date();
  
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(currentDate);
    date.setMonth(date.getMonth() - i);
    
    // Add seasonal variation (higher in spring/summer for cosmetic procedures)
    const seasonalFactor = 1 + 0.15 * Math.sin(((date.getMonth() + 3) / 12) * 2 * Math.PI);
    
    // Add growth trend (8% annual growth)
    const growthFactor = Math.pow(1.08, (months - i - 1) / 12);
    
    // Add monthly variation (±15%)
    const monthlyVariation = 1 + (Math.random() * 0.3 - 0.15);
    
    const revenue = Math.round(baseRevenue * seasonalFactor * growthFactor * monthlyVariation);
    
    data.push({
      month: date.toISOString().slice(0, 7), // YYYY-MM format
      monthName: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      revenue: revenue,
      patientCount: Math.round(revenue / 340), // Average revenue per patient
      actualRevenue: i > 2 ? revenue : null, // Only actual data for past months
      projectedRevenue: i <= 2 ? revenue : null, // Projected data for current/future
      date: date,
      isProjected: i <= 2
    });
  }
  
  return data;
}

/**
 * Generate patient volume projection data
 * @param {number} months - Number of months to project
 * @returns {Array} Array of patient volume projections
 */
export function generatePatientVolumeProjections(months = 6) {
  const projections = [];
  const baseVolume = 1247; // Current monthly patient volume
  const currentDate = new Date();
  
  for (let i = 1; i <= months; i++) {
    const date = new Date(currentDate);
    date.setMonth(date.getMonth() + i);
    
    // Growth trend (10% annual growth with seasonal variation)
    const growthRate = 0.10 + (i * 0.01); // Accelerating growth
    const seasonalFactor = 1 + 0.12 * Math.sin(((date.getMonth() + 3) / 12) * 2 * Math.PI);
    const projectedVolume = Math.round(baseVolume * seasonalFactor * (1 + growthRate * i / 12));
    
    projections.push({
      month: date.toISOString().slice(0, 7),
      monthName: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      projectedPatients: projectedVolume,
      projectedRevenue: projectedVolume * 340,
      confidenceLevel: Math.max(0.65, 0.95 - (i * 0.05)), // Decreasing confidence
      growthRate: ((projectedVolume - baseVolume) / baseVolume * 100).toFixed(1) + '%',
      date: date
    });
  }
  
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
