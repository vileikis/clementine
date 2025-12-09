/**
 * Camera Module Utilities
 *
 * Shared utility functions for camera-related operations.
 */

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
