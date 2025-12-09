/**
 * Camera Module Constants
 *
 * Error codes, default labels, and configuration constants.
 */

import type { CameraCaptureLabels } from "./types/camera.types";

/**
 * Default labels for internationalization (English)
 */
export const DEFAULT_LABELS: Required<CameraCaptureLabels> = {
  permissionTitle: "Camera Access",
  permissionDescription: "We need camera access to take your photo",
  allowCamera: "Allow Camera",
  capture: "Take Photo",
  flipCamera: "Switch Camera",
  openLibrary: "Choose from Library",
  retake: "Retake",
  confirm: "Use Photo",
  cancel: "Cancel",
  permissionDenied: "Camera access denied",
  permissionDeniedHint: "Please enable camera in your browser settings",
  cameraUnavailable: "Camera not available",
  cameraInUse: "Camera is in use by another application",
  captureError: "Failed to capture photo",
};

/**
 * Error messages mapped to error codes
 */
export const ERROR_MESSAGES: Record<string, string> = {
  PERMISSION_DENIED:
    "Camera permission denied. Please allow camera access to continue.",
  PERMISSION_DISMISSED: "Camera permission request was dismissed.",
  CAMERA_UNAVAILABLE: "No camera found on this device.",
  CAMERA_IN_USE: "Camera is already in use by another application.",
  CAPTURE_FAILED: "Failed to capture photo. Please try again.",
  INVALID_FILE_TYPE: "Please select an image file (JPEG, PNG, GIF, or WebP).",
  UNKNOWN: "An unexpected error occurred. Please try again.",
};

/**
 * Accepted image MIME types for file validation
 */
export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
] as const;

/**
 * Maximum file size (50MB)
 */
export const MAX_FILE_SIZE = 50 * 1024 * 1024;

/**
 * Camera constraints for getUserMedia
 *
 * We request high resolution without forcing orientation.
 * The browser will adapt based on device orientation:
 * - Desktop: typically landscape
 * - Mobile portrait: browser swaps to portrait automatically
 * - Mobile landscape: stays landscape
 *
 * The actual dimensions are in video.videoWidth/videoHeight.
 * We crop to the desired aspectRatio on capture.
 */
export const CAMERA_CONSTRAINTS = {
  width: { ideal: 1920 },
  height: { ideal: 1920 },
} as const;

/**
 * JPEG quality for canvas capture (0-1)
 */
export const CAPTURE_QUALITY = 0.9;
