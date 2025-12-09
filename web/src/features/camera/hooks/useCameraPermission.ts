"use client";

/**
 * useCameraPermission Hook
 *
 * Manages camera permission state with automatic permission checking on mount.
 * Auto-starts camera if permission was previously granted.
 */

import { useState, useCallback, useEffect } from "react";
import type { PermissionState, CameraCaptureError, CameraFacing } from "../types";
import { CAMERA_CONSTRAINTS } from "../constants";
import {
  parseMediaError,
  createUnavailableError,
  isMediaDevicesAvailable,
} from "../lib";

interface UseCameraPermissionOptions {
  /** Initial camera facing direction */
  facing?: CameraFacing;
  /** Whether to auto-check permission on mount */
  autoCheck?: boolean;
  /** Called when permission is granted with stream */
  onGranted?: (stream: MediaStream) => void;
  /** Called when permission is denied or error occurs */
  onDenied?: (error: CameraCaptureError) => void;
}

interface UseCameraPermissionReturn {
  /** Current permission state */
  permissionState: PermissionState;
  /** Request camera permission - call on user action */
  requestPermission: () => Promise<MediaStream | null>;
  /** Reset to initial prompt state */
  reset: () => void;
}

/**
 * Request camera stream with specified facing
 */
async function requestCameraStream(
  facing: CameraFacing
): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: facing,
      ...CAMERA_CONSTRAINTS,
    },
    audio: false,
  });
}

/**
 * Check current camera permission status via Permissions API
 */
async function checkPermissionStatus(): Promise<PermissionStatus | null> {
  if (!navigator.permissions?.query) {
    return null;
  }

  try {
    return await navigator.permissions.query({
      name: "camera" as PermissionName,
    });
  } catch {
    return null;
  }
}

/**
 * Hook for managing camera permission state
 *
 * @param options - Configuration options
 * @returns Permission state and request function
 *
 * @example
 * ```tsx
 * const { permissionState, requestPermission } = useCameraPermission({
 *   autoCheck: true,
 *   onGranted: (stream) => setStream(stream),
 *   onDenied: (error) => setError(error),
 * });
 *
 * if (permissionState === 'checking') {
 *   return <LoadingSpinner />;
 * }
 *
 * return (
 *   <button onClick={requestPermission} disabled={permissionState === 'requesting'}>
 *     Allow Camera
 *   </button>
 * );
 * ```
 */
export function useCameraPermission(
  options: UseCameraPermissionOptions = {}
): UseCameraPermissionReturn {
  const { facing = "user", autoCheck = false, onGranted, onDenied } = options;

  const [permissionState, setPermissionState] = useState<PermissionState>(
    autoCheck ? "checking" : "prompt"
  );

  const handleError = useCallback(
    (err: unknown) => {
      const error = parseMediaError(err);
      const newState = error.code === "CAMERA_UNAVAILABLE" ? "unavailable" : "denied";
      setPermissionState(newState);
      onDenied?.(error);
    },
    [onDenied]
  );

  const requestPermission = useCallback(async (): Promise<MediaStream | null> => {
    if (!isMediaDevicesAvailable()) {
      const error = createUnavailableError();
      setPermissionState("unavailable");
      onDenied?.(error);
      return null;
    }

    setPermissionState("requesting");

    try {
      const stream = await requestCameraStream(facing);
      setPermissionState("granted");
      onGranted?.(stream);
      return stream;
    } catch (err) {
      handleError(err);
      return null;
    }
  }, [facing, onGranted, onDenied, handleError]);

  const reset = useCallback(() => {
    setPermissionState("prompt");
  }, []);

  // Auto-check permission on mount if enabled
  useEffect(() => {
    if (!autoCheck) return;
    if (permissionState !== "checking") return;

    async function checkAndRequestPermission() {
      if (!isMediaDevicesAvailable()) {
        setPermissionState("prompt");
        return;
      }

      const status = await checkPermissionStatus();

      // Permissions API not available, show prompt
      if (!status) {
        setPermissionState("prompt");
        return;
      }

      // Permission not granted, show prompt
      if (status.state !== "granted") {
        setPermissionState("prompt");
        return;
      }

      // Permission granted, auto-start camera
      try {
        const stream = await requestCameraStream(facing);
        setPermissionState("granted");
        onGranted?.(stream);
      } catch {
        // Failed despite permission, show prompt
        setPermissionState("prompt");
      }
    }

    checkAndRequestPermission();
  }, [autoCheck, permissionState, facing, onGranted]);

  return {
    permissionState,
    requestPermission,
    reset,
  };
}
