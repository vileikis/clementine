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
  /** Video element ref to attach stream */
  videoRef: React.RefObject<HTMLVideoElement | null>;
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
  const videoRef = useRef<HTMLVideoElement>(null);

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

  // Stop all tracks in a stream
  const stopTracks = useCallback((mediaStream: MediaStream | null) => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
    }
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
  const stopCamera = useCallback(() => {
    stopTracks(stream);
    setStream(null);
  }, [stream, stopTracks]);

  // Switch to opposite camera
  const switchCamera = useCallback(async (): Promise<MediaStream | null> => {
    const newFacing = facing === "user" ? "environment" : "user";

    // Stop current stream first
    stopTracks(stream);
    setStream(null);

    // Start with new facing
    return startCamera(newFacing);
  }, [facing, stream, stopTracks, startCamera]);

  // Attach stream to video element
  useEffect(() => {
    if (!stream || !videoRef.current) return;

    const video = videoRef.current;
    video.srcObject = stream;

    const handleLoadedMetadata = () => {
      video.play().catch((err) => {
        console.error("Error playing video:", err);
      });
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, [stream]);

  // Handle tab visibility change - pause/resume camera when tab loses/gains focus
  useEffect(() => {
    if (!stream) return;

    const handleVisibilityChange = () => {
      if (!videoRef.current) return;

      if (document.hidden) {
        // Pause video when tab is hidden (saves resources)
        videoRef.current.pause();
      } else {
        // Resume video when tab is visible
        videoRef.current.play().catch((err) => {
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
      stopTracks(stream);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
