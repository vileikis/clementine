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
 * Props for the CameraCapture container component
 */
export interface CameraCaptureProps {
  /** Called when photo taken/selected (enters review) */
  onPhoto?: (photo: CapturedPhoto) => void;
  /** Called when user confirms photo (required) */
  onSubmit: (photo: CapturedPhoto) => void;
  /** Called when user taps retake */
  onRetake?: () => void;
  /** Called when user wants to exit */
  onCancel?: () => void;
  /** Called on any error */
  onError?: (error: CameraCaptureError) => void;
  /** Show camera capture option */
  enableCamera?: boolean;
  /** Show library selection option */
  enableLibrary?: boolean;
  /** Available camera(s) - "user", "environment", or "both" */
  cameraFacing?: CameraFacingConfig;
  /** Starting camera when cameraFacing="both" */
  initialFacing?: CameraFacing;
  /** Aspect ratio guide overlay */
  aspectRatio?: AspectRatio;
  /** Container CSS class */
  className?: string;
  /** Custom labels for i18n */
  labels?: CameraCaptureLabels;
}

/**
 * Internal state machine states
 */
export type CameraStateStatus =
  | "permission-prompt"
  | "camera-active"
  | "photo-review"
  | "error"
  | "library-only";

/**
 * Internal state machine state (used by CameraCapture)
 */
export type CameraState =
  | { status: "permission-prompt" }
  | {
      status: "camera-active";
      stream: MediaStream | null;
      facing: CameraFacing;
    }
  | { status: "photo-review"; photo: CapturedPhoto }
  | { status: "error"; error: CameraCaptureError }
  | { status: "library-only" };

/**
 * Internal state machine actions
 */
export type CameraAction =
  | { type: "PERMISSION_GRANTED"; stream: MediaStream; facing: CameraFacing }
  | { type: "PERMISSION_DENIED"; error: CameraCaptureError }
  | { type: "PHOTO_CAPTURED"; photo: CapturedPhoto }
  | { type: "RETAKE"; facing?: CameraFacing }
  | { type: "FLIP_CAMERA"; stream: MediaStream; facing: CameraFacing }
  | { type: "ERROR"; error: CameraCaptureError }
  | { type: "LIBRARY_ONLY" }
  | { type: "RESET" };

/**
 * Permission state for useCameraPermission hook
 */
export type PermissionState =
  | "prompt"
  | "requesting"
  | "granted"
  | "denied"
  | "unavailable";
