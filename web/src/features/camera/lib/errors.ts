/**
 * Camera Error Utilities
 *
 * Shared error handling for camera-related operations.
 */

import type { CameraCaptureError } from "../types";

/**
 * Parse a getUserMedia error into a typed CameraCaptureError
 */
export function parseMediaError(err: unknown): CameraCaptureError {
  if (!(err instanceof Error)) {
    return {
      code: "UNKNOWN",
      message: "Failed to access camera. Please check your permissions.",
    };
  }

  if (err.name === "NotAllowedError") {
    return {
      code: "PERMISSION_DENIED",
      message:
        "Camera permission denied. Please allow camera access to continue.",
    };
  }

  if (err.name === "NotFoundError") {
    return {
      code: "CAMERA_UNAVAILABLE",
      message: "No camera found on this device.",
    };
  }

  if (err.name === "NotReadableError") {
    return {
      code: "CAMERA_IN_USE",
      message: "Camera is already in use by another application.",
    };
  }

  return {
    code: "UNKNOWN",
    message: err.message,
  };
}

/**
 * Create a camera unavailable error (for when MediaDevices API is missing)
 */
export function createUnavailableError(): CameraCaptureError {
  return {
    code: "CAMERA_UNAVAILABLE",
    message:
      "Camera access not supported. Please use HTTPS or a supported browser.",
  };
}
