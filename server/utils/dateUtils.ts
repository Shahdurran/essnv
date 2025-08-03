/**
 * Date utilities for consistent date handling across the application
 */

/**
 * Get the current application date - August 3, 2025
 * This serves as the "today" for the application's data context
 */
export function getCurrentAppDate(): Date {
  return new Date(2025, 7, 3); // August 3, 2025 (month is 0-indexed)
}

/**
 * Get the current month string in YYYY-MM format
 */
export function getCurrentMonthString(): string {
  return getCurrentAppDate().toISOString().slice(0, 7);
}

/**
 * Check if a date is in the future relative to the current app date
 */
export function isFutureDate(date: Date): boolean {
  const current = getCurrentAppDate();
  return date > current;
}

/**
 * Check if a month string (YYYY-MM) represents a future month
 */
export function isFutureMonth(monthStr: string): boolean {
  const date = new Date(monthStr + '-01');
  const current = getCurrentAppDate();
  
  // Consider same month as current if we're at the beginning of the month
  return date.getFullYear() > current.getFullYear() || 
         (date.getFullYear() === current.getFullYear() && date.getMonth() > current.getMonth());
}

/**
 * Determine if data for a given month should be marked as projected
 * Current month (August 2025) and later are projected
 */
export function isProjectedMonth(monthStr: string): boolean {
  const date = new Date(monthStr + '-01');
  const current = getCurrentAppDate();
  
  return date.getFullYear() > current.getFullYear() || 
         (date.getFullYear() === current.getFullYear() && date.getMonth() >= current.getMonth());
}