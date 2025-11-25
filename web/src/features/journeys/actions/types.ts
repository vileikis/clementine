/**
 * Shared types for journey Server Actions
 */

/**
 * Standard action response type.
 * All Server Actions should return this type for consistent error handling.
 */
export type ActionResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

/**
 * Error codes for journey operations
 */
export const ErrorCodes = {
  PERMISSION_DENIED: "PERMISSION_DENIED",
  EVENT_NOT_FOUND: "EVENT_NOT_FOUND",
  JOURNEY_NOT_FOUND: "JOURNEY_NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  EVENT_ARCHIVED: "EVENT_ARCHIVED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
