/**
 * Camera Module Types
 *
 * Type definitions for the camera capture feature module.
 * All types are runtime-only (no Firestore persistence).
 */

/**
 * How the photo was obtained
 */
export type CaptureMethod = "camera" | "library";

/**
 * Typed error codes for exhaustive handling
 */
export type CameraCaptureErrorCode =
  | "PERMISSION_DENIED"
  | "PERMISSION_DISMISSED"
  | "CAMERA_UNAVAILABLE"
  | "CAMERA_IN_USE"
  | "CAPTURE_FAILED"
  | "INVALID_FILE_TYPE"
  | "UNKNOWN";

/**
 * Error object with typed code and message
 */
export interface CameraCaptureError {
  code: CameraCaptureErrorCode;
  message: string;
}

/**
 * Result of a photo capture or library selection
 */
export interface CapturedPhoto {
  /** Object URL for immediate display (created via URL.createObjectURL) */
  previewUrl: string;
  /** Raw file object for upload to storage */
  file: File;
  /** How the photo was obtained */
  method: CaptureMethod;
  /** Image width in pixels */
  width: number;
  /** Image height in pixels */
  height: number;
}

/**
 * Camera facing direction
 */
export type CameraFacing = "user" | "environment";

/**
 * Camera facing configuration prop
 */
export type CameraFacingConfig = "user" | "environment" | "both";

/**
 * Aspect ratio guide options
 */
export type AspectRatio = "3:4" | "1:1" | "9:16";

/**
 * Customizable labels for internationalization
 */
export interface CameraCaptureLabels {
  /** Permission prompt title */
  permissionTitle?: string;
  /** Permission prompt description */
  permissionDescription?: string;
  /** Permission button text */
  allowCamera?: string;
  /** Capture button aria-label */
  capture?: string;
  /** Flip button aria-label */
  flipCamera?: string;
  /** Library button aria-label */
  openLibrary?: string;
  /** Retake button text */
  retake?: string;
  /** Confirm button text */
  confirm?: string;
  /** Cancel button text */
  cancel?: string;
  /** Denied error title */
  permissionDenied?: string;
  /** Denied error hint */
  permissionDeniedHint?: string;
  /** Unavailable error title */
  cameraUnavailable?: string;
  /** In-use error title */
  cameraInUse?: string;
  /** Capture error message */
  captureError?: string;
}

/**
 * Internal state machine states
 */
export type CameraStateStatus =
  | "checking-permission"
  | "permission-prompt"
  | "camera-active"
  | "photo-review"
  | "error";

/**
 * Internal state machine state (used by CameraCapture)
 *
 * Note: Camera hardware state (stream, facing) is managed by useCamera hook.
 * The reducer only tracks UI state to avoid duplication and sync issues.
 */
export type CameraState =
  | { status: "checking-permission" }
  | { status: "permission-prompt" }
  | { status: "camera-active" }
  | { status: "photo-review"; photo: CapturedPhoto }
  | { status: "error"; error: CameraCaptureError };

/**
 * Internal state machine actions
 *
 * Note: FLIP_CAMERA removed - handled internally by useCamera hook,
 * no UI state change needed.
 */
export type CameraAction =
  | { type: "SHOW_PERMISSION_PROMPT" }
  | { type: "PERMISSION_GRANTED" }
  | { type: "PERMISSION_DENIED"; error: CameraCaptureError }
  | { type: "PHOTO_CAPTURED"; photo: CapturedPhoto }
  | { type: "RETAKE" }
  | { type: "ERROR"; error: CameraCaptureError }
  | { type: "RESET" };

/**
 * Permission state for useCameraPermission hook
 */
export type PermissionState =
  | "checking"
  | "prompt"
  | "requesting"
  | "granted"
  | "denied"
  | "unavailable";
