"use client";

/**
 * useCamera Hook
 *
 * Manages MediaStream lifecycle with support for camera switching.
 * Enhanced version extracted from web/src/features/guest/hooks/useCamera.ts
 */

import { useState, useEffect, useRef, useCallback } from "react";
import type { CameraFacing, CameraCaptureError } from "../types";
import { CAMERA_CONSTRAINTS } from "../constants";

interface UseCameraOptions {
  /** Initial camera facing direction */
  initialFacing?: CameraFacing;
  /** Called when an error occurs */
  onError?: (error: CameraCaptureError) => void;
}

interface UseCameraReturn {
  /** Active MediaStream or null */
  stream: MediaStream | null;
  /** Current camera facing direction */
  facing: CameraFacing;
  /** Whether camera is loading/switching */
  isLoading: boolean;
  /** Video element ref callback - attach this to video element */
  videoRef: (element: HTMLVideoElement | null) => void;
  /** Start camera with specified facing */
  startCamera: (facing: CameraFacing) => Promise<MediaStream | null>;
  /** Stop camera and release resources */
  stopCamera: () => void;
  /** Switch to opposite camera */
  switchCamera: () => Promise<MediaStream | null>;
  /** Check if device has multiple cameras */
  hasMultipleCameras: boolean;
}

/**
 * Hook for managing camera MediaStream lifecycle
 *
 * @param options - Configuration options
 * @returns Camera state and control functions
 *
 * @example
 * ```tsx
 * const { stream, videoRef, startCamera, switchCamera, hasMultipleCameras } = useCamera({
 *   initialFacing: 'user',
 *   onError: (error) => console.error(error),
 * });
 *
 * useEffect(() => {
 *   startCamera('user');
 * }, [startCamera]);
 *
 * return <video ref={videoRef} autoPlay playsInline />;
 * ```
 */
export function useCamera(options: UseCameraOptions = {}): UseCameraReturn {
  const { initialFacing = "user", onError } = options;

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facing, setFacing] = useState<CameraFacing>(initialFacing);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  // Use refs to store both the video element and current stream
  // This allows the callback ref to access the latest stream value
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Check for multiple cameras on mount
  useEffect(() => {
    async function checkCameras() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter(
          (device) => device.kind === "videoinput"
        );
        setHasMultipleCameras(videoInputs.length > 1);
      } catch {
        // Ignore errors - assume single camera
        setHasMultipleCameras(false);
      }
    }
    checkCameras();
  }, []);

  // Start camera with specified facing
  const startCamera = useCallback(
    async (newFacing: CameraFacing): Promise<MediaStream | null> => {
      // Check if MediaDevices API is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        const error: CameraCaptureError = {
          code: "CAMERA_UNAVAILABLE",
          message:
            "Camera access not supported. Please use HTTPS or a supported browser.",
        };
        onError?.(error);
        return null;
      }

      setIsLoading(true);

      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: newFacing,
            ...CAMERA_CONSTRAINTS,
          },
          audio: false,
        });

        // Update ref immediately (before state update) so callback ref can access it
        streamRef.current = mediaStream;
        setStream(mediaStream);
        setFacing(newFacing);
        return mediaStream;
      } catch (err) {
        let error: CameraCaptureError;

        if (err instanceof Error) {
          if (err.name === "NotAllowedError") {
            error = {
              code: "PERMISSION_DENIED",
              message:
                "Camera permission denied. Please allow camera access to continue.",
            };
          } else if (err.name === "NotFoundError") {
            error = {
              code: "CAMERA_UNAVAILABLE",
              message: "No camera found on this device.",
            };
          } else if (err.name === "NotReadableError") {
            error = {
              code: "CAMERA_IN_USE",
              message: "Camera is already in use by another application.",
            };
          } else {
            error = {
              code: "UNKNOWN",
              message: err.message,
            };
          }
        } else {
          error = {
            code: "UNKNOWN",
            message: "Failed to access camera. Please check your permissions.",
          };
        }

        onError?.(error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [onError]
  );

  // Stop camera and release resources
  // Uses streamRef so it can be safely called from stale closures
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setStream(null);
  }, []);

  // Switch to opposite camera
  const switchCamera = useCallback(async (): Promise<MediaStream | null> => {
    const newFacing = facing === "user" ? "environment" : "user";

    // Stop current stream first using ref
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setStream(null);

    // Start with new facing
    return startCamera(newFacing);
  }, [facing, startCamera]);

  // Helper to attach stream to a video element
  const attachStream = useCallback(
    (video: HTMLVideoElement, mediaStream: MediaStream) => {
      // Only attach if not already attached
      if (video.srcObject === mediaStream) {
        return;
      }

      video.srcObject = mediaStream;

      // Play when metadata is loaded
      const handleLoadedMetadata = () => {
        video.play().catch((err) => {
          console.error("Error playing video:", err);
        });
      };

      // If metadata is already loaded, play immediately
      if (video.readyState >= 1) {
        video.play().catch((err) => {
          console.error("Error playing video:", err);
        });
      } else {
        video.addEventListener("loadedmetadata", handleLoadedMetadata, {
          once: true,
        });
      }
    },
    []
  );

  // Callback ref for video element - called when element mounts/unmounts
  const videoRef = useCallback(
    (element: HTMLVideoElement | null) => {
      videoElementRef.current = element;

      // When video element mounts and we have a stream, attach it immediately
      if (element && streamRef.current) {
        attachStream(element, streamRef.current);
      }
    },
    [attachStream]
  );

  // Also attach stream when it changes (for when video is already mounted)
  useEffect(() => {
    if (stream && videoElementRef.current) {
      attachStream(videoElementRef.current, stream);
    }
  }, [stream, attachStream]);

  // Handle tab visibility change - pause/resume camera when tab loses/gains focus
  useEffect(() => {
    if (!stream) return;

    const handleVisibilityChange = () => {
      if (!videoElementRef.current) return;

      if (document.hidden) {
        // Pause video when tab is hidden (saves resources)
        videoElementRef.current.pause();
      } else {
        // Resume video when tab is visible
        videoElementRef.current.play().catch((err) => {
          console.error("Error resuming video:", err);
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [stream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Use ref instead of stale closure
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return {
    stream,
    facing,
    isLoading,
    videoRef,
    startCamera,
    stopCamera,
    switchCamera,
    hasMultipleCameras,
  };
}
