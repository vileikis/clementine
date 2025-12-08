"use client";

/**
 * useCameraPermission Hook
 *
 * Manages camera permission state with user-initiated permission request.
 * Follows best practice of requesting permission only after user action.
 */

import { useState, useCallback } from "react";
import type {
  PermissionState,
  CameraCaptureError,
  CameraFacing,
} from "../types";
import { CAMERA_CONSTRAINTS } from "../constants";

interface UseCameraPermissionOptions {
  /** Initial camera facing direction */
  facing?: CameraFacing;
  /** Called when permission is granted with stream */
  onGranted?: (stream: MediaStream) => void;
  /** Called when permission is denied */
  onDenied?: (error: CameraCaptureError) => void;
  /** Called when camera is unavailable */
  onUnavailable?: (error: CameraCaptureError) => void;
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
 * Hook for managing camera permission state
 *
 * @param options - Configuration options
 * @returns Permission state and request function
 *
 * @example
 * ```tsx
 * const { permissionState, requestPermission } = useCameraPermission({
 *   onGranted: (stream) => setStream(stream),
 *   onDenied: (error) => setError(error),
 * });
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
  const { facing = "user", onGranted, onDenied, onUnavailable } = options;

  const [permissionState, setPermissionState] =
    useState<PermissionState>("prompt");

  const requestPermission = useCallback(async (): Promise<MediaStream | null> => {
    // Check if MediaDevices API is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const error: CameraCaptureError = {
        code: "CAMERA_UNAVAILABLE",
        message:
          "Camera access not supported. Please use HTTPS or a supported browser.",
      };
      setPermissionState("unavailable");
      onUnavailable?.(error);
      return null;
    }

    setPermissionState("requesting");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          ...CAMERA_CONSTRAINTS,
        },
        audio: false,
      });

      setPermissionState("granted");
      onGranted?.(stream);
      return stream;
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === "NotAllowedError") {
          const error: CameraCaptureError = {
            code: "PERMISSION_DENIED",
            message:
              "Camera permission denied. Please allow camera access to continue.",
          };
          setPermissionState("denied");
          onDenied?.(error);
        } else if (err.name === "NotFoundError") {
          const error: CameraCaptureError = {
            code: "CAMERA_UNAVAILABLE",
            message: "No camera found on this device.",
          };
          setPermissionState("unavailable");
          onUnavailable?.(error);
        } else if (err.name === "NotReadableError") {
          const error: CameraCaptureError = {
            code: "CAMERA_IN_USE",
            message: "Camera is already in use by another application.",
          };
          setPermissionState("denied");
          onDenied?.(error);
        } else {
          const error: CameraCaptureError = {
            code: "UNKNOWN",
            message: err.message,
          };
          setPermissionState("denied");
          onDenied?.(error);
        }
      } else {
        const error: CameraCaptureError = {
          code: "UNKNOWN",
          message: "Failed to access camera. Please check your permissions.",
        };
        setPermissionState("denied");
        onDenied?.(error);
      }
      return null;
    }
  }, [facing, onGranted, onDenied, onUnavailable]);

  const reset = useCallback(() => {
    setPermissionState("prompt");
  }, []);

  return {
    permissionState,
    requestPermission,
    reset,
  };
}
