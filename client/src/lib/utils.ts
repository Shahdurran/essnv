import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Universal helper function for dynamic label overrides
 * @param id - The unique identifier/key for the label (from raw data line_item)
 * @param defaultName - The default display name if no override exists
 * @param overrides - Record of custom label overrides (from user config)
 * @returns The overridden label if it exists and is not empty, otherwise the default name
 */
export function getDynamicLabel(
  id: string,
  defaultName: string,
  overrides?: Record<string, string> | null | undefined
): string {
  if (!overrides) {
    return defaultName
  }
  const override = overrides[id]
  if (override && typeof override === 'string' && override.trim() !== '') {
    return override.trim()
  }
  return defaultName
}
