/*
 * DEFAULT SUBHEADINGS FOR FINANCIAL WIDGETS
 * ==========================================
 * 
 * This file defines all the default subheading labels for financial widgets.
 * These can be customized per user through the settings interface.
 */

export const DEFAULT_REVENUE_SUBHEADINGS = {
  'Office Visits': 'Office Visits',
  'Drug Acquisition (injections)': 'Drug Acquisition (injections)',
  'Procedures': 'Procedures',
  'Other Revenue': 'Other Revenue'
};

export const DEFAULT_EXPENSES_SUBHEADINGS = {
  'Salaries & Wages': 'Salaries & Wages',
  'Rent & Utilities': 'Rent & Utilities',
  'Medical Supplies': 'Medical Supplies',
  'Insurance': 'Insurance',
  'Marketing': 'Marketing',
  'Equipment': 'Equipment',
  'Other Expenses': 'Other Expenses'
};

export const DEFAULT_CASH_IN_SUBHEADINGS = {
  'Patient Payments': 'Patient Payments',
  'Insurance Payments': 'Insurance Payments',
  'Other Income': 'Other Income'
};

export const DEFAULT_CASH_OUT_SUBHEADINGS = {
  'Payroll': 'Payroll',
  'Rent': 'Rent',
  'Supplies': 'Supplies',
  'Utilities': 'Utilities',
  'Other Payments': 'Other Payments'
};

export const DEFAULT_CASH_FLOW_SUBHEADINGS = {
  'Operating Activities': 'Operating Activities',
  'Investing Activities': 'Investing Activities',
  'Financing Activities': 'Financing Activities'
};

export const DEFAULT_AR_SUBHEADINGS = {
  '0-30': '0-30 days',
  '31-60': '31-60 days',
  '61-90': '61-90 days',
  '90+': '90+ days'
};

/**
 * Get all default subheadings for a widget type
 */
export function getDefaultSubheadings(widgetType: string): Record<string, string> {
  switch (widgetType) {
    case 'revenue':
      return { ...DEFAULT_REVENUE_SUBHEADINGS };
    case 'expenses':
      return { ...DEFAULT_EXPENSES_SUBHEADINGS };
    case 'cashIn':
      return { ...DEFAULT_CASH_IN_SUBHEADINGS };
    case 'cashOut':
      return { ...DEFAULT_CASH_OUT_SUBHEADINGS };
    case 'cashFlow':
      return { ...DEFAULT_CASH_FLOW_SUBHEADINGS };
    case 'ar':
      return { ...DEFAULT_AR_SUBHEADINGS };
    default:
      return {};
  }
}

/**
 * Apply user overrides to default subheadings
 */
export function applySubheadingOverrides(
  defaults: Record<string, string>,
  overrides: Record<string, string>
): Record<string, string> {
  const result = { ...defaults };
  
  // Apply overrides
  for (const [key, value] of Object.entries(overrides)) {
    if (value && value.trim()) {
      result[key] = value;
    }
  }
  
  return result;
}

