/**
 * Camera Module Types
 *
 * Type definitions for the camera capture feature module.
 * All types are runtime-only (no Firestore persistence).
 */

/**
 * How the photo was obtained
 */
export type CaptureMethod = 'camera' | 'library'

/**
 * Typed error codes for exhaustive handling
 */
export type CameraCaptureErrorCode =
  | 'PERMISSION_DENIED'
  | 'PERMISSION_DISMISSED'
  | 'CAMERA_UNAVAILABLE'
  | 'CAMERA_IN_USE'
  | 'CAPTURE_FAILED'
  | 'INVALID_FILE_TYPE'
  | 'UNKNOWN'

/**
 * Error object with typed code and message
 */
export interface CameraCaptureError {
  code: CameraCaptureErrorCode
  message: string
}

/**
 * Result of a photo capture or library selection
 */
export interface CapturedPhoto {
  /** Object URL for immediate display (created via URL.createObjectURL) */
  previewUrl: string
  /** Raw file object for upload to storage */
  file: File
  /** How the photo was obtained */
  method: CaptureMethod
  /** Image width in pixels */
  width: number
  /** Image height in pixels */
  height: number
}

/**
 * Camera facing direction
 */
export type CameraFacing = 'user' | 'environment'

/**
 * Camera facing configuration prop
 */
export type CameraFacingConfig = 'user' | 'environment' | 'both'

/**
 * Aspect ratio guide options
 */
export type AspectRatio = '3:4' | '1:1' | '9:16'

/**
 * Customizable labels for internationalization
 */
export interface CameraCaptureLabels {
  /** Permission prompt title */
  permissionTitle?: string
  /** Permission prompt description */
  permissionDescription?: string
  /** Permission button text */
  allowCamera?: string
  /** Capture button aria-label */
  capture?: string
  /** Flip button aria-label */
  flipCamera?: string
  /** Library button aria-label */
  openLibrary?: string
  /** Retake button text */
  retake?: string
  /** Confirm button text */
  confirm?: string
  /** Cancel button text */
  cancel?: string
  /** Retry button text */
  retry?: string
  /** Denied error title */
  permissionDenied?: string
  /** Denied error hint */
  permissionDeniedHint?: string
  /** Dismissed error title */
  permissionDismissed?: string
  /** Unavailable error title */
  cameraUnavailable?: string
  /** Unavailable error hint */
  cameraUnavailableHint?: string
  /** In-use error title */
  cameraInUse?: string
  /** In-use error hint */
  cameraInUseHint?: string
  /** Capture error title */
  captureError?: string
  /** Invalid file type error title */
  invalidFileType?: string
  /** Unknown error title */
  unknownError?: string
}

/**
 * Internal state machine states for CameraCapture UI
 *
 * Note: Permission states are handled by useCameraPermission hook.
 * This reducer only tracks UI state after permission is granted.
 */
export type CameraStateStatus = 'camera-active' | 'photo-review' | 'error'

/**
 * Internal state machine state (used by CameraCapture)
 */
export type CameraState =
  | { status: 'camera-active' }
  | { status: 'photo-review'; photo: CapturedPhoto }
  | { status: 'error'; error: CameraCaptureError }

/**
 * Internal state machine actions
 */
export type CameraAction =
  | { type: 'CAMERA_READY' }
  | { type: 'PHOTO_CAPTURED'; photo: CapturedPhoto }
  | { type: 'RETAKE' }
  | { type: 'ERROR'; error: CameraCaptureError }

/**
 * Permission state for useCameraPermission hook
 *
 * - unknown: Initial state, permission check in progress
 * - undetermined: Permission not yet requested by user
 * - granted: Permission granted
 * - denied: Permission denied by user
 * - unavailable: No camera hardware available
 */
export type PermissionState =
  | 'unknown'
  | 'undetermined'
  | 'granted'
  | 'denied'
  | 'unavailable'
