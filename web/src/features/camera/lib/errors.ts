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

/**
 * Check if MediaDevices API is available
 */
export function isMediaDevicesAvailable(): boolean {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

/**
 * Check current camera permission status via Permissions API
 * Returns "granted", "prompt", "denied", or null if API unavailable
 */
export async function checkCameraPermission(): Promise<PermissionState | null> {
  if (!navigator.permissions?.query) {
    return null;
  }

  try {
    const status = await navigator.permissions.query({
      name: "camera" as PermissionName,
    });
    return status.state;
  } catch {
    return null;
  }
}
