"use client";

/**
 * usePhotoCapture Hook
 *
 * Combines camera capture and library selection into a unified interface.
 * Returns CapturedPhoto with metadata for both capture methods.
 */

import { useCallback } from "react";
import type { CapturedPhoto, CameraFacing, CameraCaptureError } from "../types";
import {
  captureFromVideo,
  captureFromVideoMirrored,
  createCaptureFile,
  getVideoDimensions,
  getImageDimensions,
} from "../lib";
import { validateImageFile } from "../schemas";

interface UsePhotoCaptureOptions {
  /** Called when capture/selection succeeds */
  onCapture?: (photo: CapturedPhoto) => void;
  /** Called when an error occurs */
  onError?: (error: CameraCaptureError) => void;
}

interface UsePhotoCaptureReturn {
  /** Capture photo from video element */
  capturePhoto: (
    video: HTMLVideoElement,
    facing: CameraFacing
  ) => Promise<CapturedPhoto | null>;
  /** Process file selected from library */
  processLibraryFile: (file: File) => Promise<CapturedPhoto | null>;
}

/**
 * Hook for capturing photos from camera or library
 *
 * @param options - Configuration options
 * @returns Capture functions
 *
 * @example
 * ```tsx
 * const { capturePhoto, processLibraryFile } = usePhotoCapture({
 *   onCapture: (photo) => setPhoto(photo),
 *   onError: (error) => showError(error),
 * });
 *
 * // From camera
 * const handleCapture = () => capturePhoto(videoRef.current, 'user');
 *
 * // From library
 * const handleFileSelect = (e) => processLibraryFile(e.target.files[0]);
 * ```
 */
export function usePhotoCapture(
  options: UsePhotoCaptureOptions = {}
): UsePhotoCaptureReturn {
  const { onCapture, onError } = options;

  // Capture photo from video element
  const capturePhoto = useCallback(
    async (
      video: HTMLVideoElement,
      facing: CameraFacing
    ): Promise<CapturedPhoto | null> => {
      try {
        // Use mirrored capture for front camera (natural selfie appearance)
        const blob =
          facing === "user"
            ? await captureFromVideoMirrored(video)
            : await captureFromVideo(video);

        const file = createCaptureFile(blob);
        const dimensions = getVideoDimensions(video);
        const previewUrl = URL.createObjectURL(file);

        const photo: CapturedPhoto = {
          previewUrl,
          file,
          method: "camera",
          width: dimensions.width,
          height: dimensions.height,
        };

        onCapture?.(photo);
        return photo;
      } catch (err) {
        const error: CameraCaptureError = {
          code: "CAPTURE_FAILED",
          message:
            err instanceof Error ? err.message : "Failed to capture photo",
        };
        onError?.(error);
        return null;
      }
    },
    [onCapture, onError]
  );

  // Process file selected from library
  const processLibraryFile = useCallback(
    async (file: File): Promise<CapturedPhoto | null> => {
      // Validate file type and size
      const validation = validateImageFile(file);
      if (!validation.success) {
        const error: CameraCaptureError = {
          code: "INVALID_FILE_TYPE",
          message: validation.error ?? "Please select an image file",
        };
        onError?.(error);
        return null;
      }

      try {
        const dimensions = await getImageDimensions(file);
        const previewUrl = URL.createObjectURL(file);

        const photo: CapturedPhoto = {
          previewUrl,
          file,
          method: "library",
          width: dimensions.width,
          height: dimensions.height,
        };

        onCapture?.(photo);
        return photo;
      } catch (err) {
        const error: CameraCaptureError = {
          code: "CAPTURE_FAILED",
          message:
            err instanceof Error ? err.message : "Failed to process image",
        };
        onError?.(error);
        return null;
      }
    },
    [onCapture, onError]
  );

  return {
    capturePhoto,
    processLibraryFile,
  };
}
