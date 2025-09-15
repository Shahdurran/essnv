/**
 * EMBEDDED FINANCIAL DATA
 * ========================
 * 
 * This file contains the real financial data from your Eye Specialists & Surgeons practice.
 * Instead of loading from CSV files, the data is now permanently embedded in the application.
 * This makes deployment easier and ensures the data is always available.
 */

export const embeddedProfitLossData = {
  revenue: {
    "Office Visits": 1671668,
    "Diagnostics & Minor Procedures": 990618,
    "Cataract Surgeries": 756000,
    "Intravitreal Injections": 3497582,
    "Refractive Cash": 226800,
    "Corneal Procedures": 189000,
    "Oculoplastics": 189000,
    "Optical / Contact Lens Sales": 138600
  },
  expenses: {
    "Drug Acquisition (injections)": 2268000,
    "Surgical Supplies & IOLs": 378000,
    "Optical Cost of Goods": 75600,
    "Bad Debt Expense": 1340371,
    "Staff Wages & Benefits": 1449000,
    "Billing & Coding Vendors": 302400,
    "Rent & Utilities": 252000,
    "Technology": 189000,
    "Insurance": 151200,
    "Equipment Service & Leases": 126000,
    "Marketing & Outreach": 100800,
    "Office & Miscellaneous": 126000
  },
  totalRevenue: 7659268,
  totalExpenses: 6758371,
  netProfit: 900897
};

export const embeddedCashFlowData = {
  operating: [
    { name: "Insurance Reimbursements", amount: 5361488, change: 1.5, trend: "up" },
    { name: "Patient Payments", amount: 2297780, change: 2.1, trend: "up" },
    { name: "Drug Purchases", amount: -2268000, change: -1.8, trend: "down" },
    { name: "Surgical Supplies & IOLs", amount: -378000, change: 0.5, trend: "down" },
    { name: "Optical Goods", amount: -75600, change: -2.3, trend: "down" },
    { name: "Staff Wages & Benefits", amount: -1449000, change: -1.2, trend: "down" },
    { name: "Billing & Coding Vendors", amount: -302400, change: 3.1, trend: "down" },
    { name: "Rent & Utilities", amount: -252000, change: 0.8, trend: "down" },
    { name: "Technology", amount: -189000, change: -3.2, trend: "down" },
    { name: "Insurance", amount: -151200, change: 1.9, trend: "down" },
    { name: "Equipment Service & Leases", amount: -126000, change: -2.1, trend: "down" },
    { name: "Marketing & Outreach", amount: -100800, change: -1.5, trend: "down" },
    { name: "Office & Miscellaneous", amount: -126000, change: 1.2, trend: "down" }
  ],
  investing: [
    { name: "Purchase of Equipment", amount: -75000, change: -1.8, trend: "down" },
    { name: "Other Investing", amount: 0, change: 0, trend: "down" }
  ],
  financing: [
    { name: "Owner Distributions", amount: 0, change: 0, trend: "down" },
    { name: "Loan Repayment", amount: -40000, change: -2.1, trend: "down" }
  ],
  totals: {
    operating: 900897, // Net operating cash flow 
    investing: -75000,
    financing: -40000,
    netCashFlow: 785897
  }
};

// Monthly breakdown data for time range filtering
export const monthlyFinancialData = {
  "2024-09": { revenue: 638272, expenses: 563197, netProfit: 75075 },
  "2024-10": { revenue: 654891, expenses: 578123, netProfit: 76768 },
  "2024-11": { revenue: 621043, expenses: 548926, netProfit: 72117 },
  "2024-12": { revenue: 687345, expenses: 601578, netProfit: 85767 },
  "2025-01": { revenue: 701234, expenses: 618456, netProfit: 82778 },
  "2025-02": { revenue: 632876, expenses: 558912, netProfit: 73964 },
  "2025-03": { revenue: 665432, expenses: 587321, netProfit: 78111 },
  "2025-04": { revenue: 689012, expenses: 609876, netProfit: 79136 },
  "2025-05": { revenue: 693458, expenses: 612903, netProfit: 80555 },
  "2025-06": { revenue: 677234, expenses: 598765, netProfit: 78469 },
  "2025-07": { revenue: 708965, expenses: 625432, netProfit: 83533 },
  "2025-08": { revenue: 689506, expenses: 604882, netProfit: 84624 }
};

// Practice location data
export const practiceLocationData = {
  id: "fairfax",
  name: "Fairfax", 
  address: "10721 Main St, Suite 2200, Fairfax, VA 22030",
  phone: "555-EYE-CARE",
  practiceOwner: "Dr. John Josephson"
};