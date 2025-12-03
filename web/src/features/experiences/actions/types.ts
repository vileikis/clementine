/**
 * Shared types for experience Server Actions
 */

/**
 * Standard action response type.
 * All Server Actions should return this type for consistent error handling.
 */
export type ActionResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

/**
 * Error codes for experience operations
 */
export const ErrorCodes = {
  PERMISSION_DENIED: "PERMISSION_DENIED",
  COMPANY_NOT_FOUND: "COMPANY_NOT_FOUND",
  EXPERIENCE_NOT_FOUND: "EXPERIENCE_NOT_FOUND",
  STEP_NOT_FOUND: "STEP_NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  MAX_STEPS_EXCEEDED: "MAX_STEPS_EXCEEDED",
  INVALID_STEP_ORDER: "INVALID_STEP_ORDER",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
