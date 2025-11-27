/**
 * Server Action Contract: Step Media Upload
 *
 * This file documents the contract for the step media upload server action.
 * Implementation: web/src/features/steps/actions/step-media.ts
 */

import type { StepMediaType } from "../../../web/src/features/steps/types";

// ============================================================================
// Types
// ============================================================================

/**
 * Standard action response type
 */
type ActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

/**
 * Upload result data
 */
interface UploadResultData {
  /** Public URL to the uploaded file */
  publicUrl: string;
  /** Detected media type */
  mediaType: StepMediaType;
  /** File size in bytes */
  sizeBytes: number;
}

// ============================================================================
// Server Actions
// ============================================================================

/**
 * Upload media to shared company storage
 *
 * @param companyId - Company ID for storage path
 * @param file - File to upload (from form input)
 * @returns Public URL and detected media type
 *
 * @example
 * ```typescript
 * const result = await uploadStepMedia(companyId, file);
 * if (result.success) {
 *   form.setValue("mediaUrl", result.data.publicUrl);
 *   form.setValue("mediaType", result.data.mediaType);
 * }
 * ```
 *
 * Storage path: media/{companyId}/{mediaType}/{timestamp}-{filename}
 *
 * Validation:
 * - Images (JPG, PNG, WebP): max 10MB
 * - GIFs: max 10MB
 * - Videos (MP4, WebM): max 25MB
 * - Lottie (JSON): max 5MB, validates structure
 *
 * Error codes:
 * - PERMISSION_DENIED: User not authenticated
 * - VALIDATION_ERROR: Invalid file type or size
 * - INVALID_LOTTIE: JSON file is not valid Lottie format
 * - UPLOAD_ERROR: Firebase Storage error
 */
declare function uploadStepMedia(
  companyId: string,
  file: File
): Promise<ActionResponse<UploadResultData>>;

// ============================================================================
// Component Props
// ============================================================================

/**
 * StepMediaUpload component props
 */
interface StepMediaUploadProps {
  /** Company ID for storage path */
  companyId: string;
  /** Current media URL (if any) */
  mediaUrl?: string | null;
  /** Current media type (if any) */
  mediaType?: StepMediaType | null;
  /** Callback when media is uploaded */
  onUpload: (url: string, type: StepMediaType) => void;
  /** Callback when media is removed (unlink only) */
  onRemove: () => void;
  /** Disable upload/remove buttons */
  disabled?: boolean;
}

/**
 * StepMediaUpload component
 *
 * Provides:
 * - File input for selecting media files
 * - Type detection and validation
 * - Upload progress indicator
 * - Preview rendering based on media type
 * - Remove button (unlinks only, does not delete from storage)
 *
 * Supported file types:
 * - Images: JPG, PNG, WebP (10MB max)
 * - GIFs: animated GIFs (10MB max)
 * - Videos: MP4, WebM (25MB max)
 * - Lottie: JSON animations (5MB max)
 */
declare function StepMediaUpload(props: StepMediaUploadProps): JSX.Element;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Detect media type from file
 *
 * @param file - File to detect type from
 * @returns Media type or null if unsupported
 */
declare function detectMediaType(file: File): StepMediaType | null;

/**
 * Infer media type from URL extension (backward compatibility)
 *
 * @param url - URL to infer type from
 * @returns Media type (defaults to "image" if unknown)
 */
declare function inferMediaTypeFromUrl(url: string): StepMediaType;

/**
 * Validate Lottie JSON structure
 *
 * @param file - JSON file to validate
 * @returns true if valid Lottie format
 */
declare function validateLottieFile(file: File): Promise<boolean>;

/**
 * Check if Lottie JSON object is valid
 *
 * @param json - Parsed JSON object
 * @returns Type guard for LottieJSON
 */
declare function isValidLottie(json: unknown): boolean;

export type {
  ActionResponse,
  UploadResultData,
  StepMediaUploadProps,
};

export {
  uploadStepMedia,
  StepMediaUpload,
  detectMediaType,
  inferMediaTypeFromUrl,
  validateLottieFile,
  isValidLottie,
};
