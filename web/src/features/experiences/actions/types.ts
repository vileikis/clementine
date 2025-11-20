/**
 * Shared types for experience Server Actions
 *
 * Part of 003-experience-schema implementation (Phase 6 - Action File Reorganization).
 *
 * This module defines:
 * - ActionResponse type for consistent error handling
 * - Error codes for experience operations
 * - Shared types used across action files
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
  // Authentication errors
  PERMISSION_DENIED: "PERMISSION_DENIED",

  // Resource not found errors
  EVENT_NOT_FOUND: "EVENT_NOT_FOUND",
  EXPERIENCE_NOT_FOUND: "EXPERIENCE_NOT_FOUND",
  STEP_NOT_FOUND: "STEP_NOT_FOUND",

  // Validation errors
  VALIDATION_ERROR: "VALIDATION_ERROR",
  MIGRATION_ERROR: "MIGRATION_ERROR",

  // Storage/upload errors
  UPLOAD_ERROR: "UPLOAD_ERROR",
  DELETE_ERROR: "DELETE_ERROR",

  // Generic errors
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
} as const;

/**
 * Type for error codes
 */
export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
