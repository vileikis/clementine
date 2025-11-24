/**
 * Company validation constraints and configuration values
 * Used across schemas, UI components, and error messages
 */

export const COMPANY_CONSTRAINTS = {
  NAME_LENGTH: { min: 1, max: 100 },
} as const;

export const COMPANY_CACHE = {
  TTL_MS: 60_000, // 60 seconds
  CLEANUP_INTERVAL_MS: 60_000, // 60 seconds
} as const;
