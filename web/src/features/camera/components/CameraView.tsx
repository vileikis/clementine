"use client";

/**
 * CameraView Component
 *
 * Displays live video preview from camera stream.
 * Supports aspect ratio guides and front camera mirroring.
 *
 * Exposes imperative methods via ref following Expo CameraView pattern:
 * - takePhoto(): Captures a photo from the current video frame
 *
 * Future extensions:
 * - startRecording(): Begin video recording
 * - stopRecording(): End video recording and return result
 */

import { forwardRef, useRef, useImperativeHandle } from "react";
import { cn } from "@/lib/utils";
import type { AspectRatio, CameraFacing, CapturedPhoto } from "../types";
import {
  captureFromVideo,
  captureFromVideoMirrored,
  createCaptureFile,
  getVideoDimensions,
} from "../lib";

/**
 * Imperative methods exposed by CameraView via ref
 */
export interface CameraViewRef {
  /** Capture photo from current video frame */
  takePhoto: () => Promise<CapturedPhoto | null>;
  // Future:
  // startRecording: () => Promise<void>;
  // stopRecording: () => Promise<RecordedVideo | null>;
  // isRecording: boolean;
}

interface CameraViewProps {
  /** Current camera facing direction (for mirroring) */
  facing?: CameraFacing;
  /** Aspect ratio guide overlay */
  aspectRatio?: AspectRatio;
  /** Additional CSS classes */
  className?: string;
  /** Callback ref for video element (used by useCamera hook) */
  videoRef?: (element: HTMLVideoElement | null) => void;
}

/**
 * Aspect ratio to CSS value mapping
 */
const ASPECT_RATIOS: Record<AspectRatio, string> = {
  "3:4": "3 / 4",
  "1:1": "1 / 1",
  "9:16": "9 / 16",
};

/**
 * Live camera view with aspect ratio guide
 *
 * Uses forwardRef + useImperativeHandle to expose capture methods
 * following the Expo CameraView pattern.
 *
 * @example
 * ```tsx
 * const cameraViewRef = useRef<CameraViewRef>(null);
 *
 * const handleCapture = async () => {
 *   const photo = await cameraViewRef.current?.takePhoto();
 *   if (photo) {
 *     // Use photo.previewUrl for display
 *     // Use photo.file for upload
 *   }
 * };
 *
 * return (
 *   <CameraView
 *     ref={cameraViewRef}
 *     videoRef={videoRef}
 *     facing="user"
 *   />
 * );
 * ```
 */
export const CameraView = forwardRef<CameraViewRef, CameraViewProps>(
  function CameraView({ facing = "user", aspectRatio, className, videoRef }, ref) {
    // Internal ref for the video element (used for capture)
    const internalVideoRef = useRef<HTMLVideoElement | null>(null);

    // Combined ref callback - updates both internal ref and external callback
    const setVideoRef = (element: HTMLVideoElement | null) => {
      internalVideoRef.current = element;
      videoRef?.(element);
    };

    // Expose imperative methods via ref
    useImperativeHandle(ref, () => ({
      takePhoto: async (): Promise<CapturedPhoto | null> => {
        const video = internalVideoRef.current;
        if (!video) return null;

        try {
          // Use mirrored capture for front camera (natural selfie appearance)
          const blob =
            facing === "user"
              ? await captureFromVideoMirrored(video)
              : await captureFromVideo(video);

          const file = createCaptureFile(blob);
          const dimensions = getVideoDimensions(video);
          const previewUrl = URL.createObjectURL(file);

          return {
            previewUrl,
            file,
            method: "camera",
            width: dimensions.width,
            height: dimensions.height,
          };
        } catch (err) {
          console.error("Failed to capture photo:", err);
          return null;
        }
      },
    }), [facing]);

    // Mirror front camera for natural selfie appearance
    const shouldMirror = facing === "user";

    return (
      <div className={cn("relative w-full h-full bg-black", className)}>
        {/* Video element */}
        <video
          ref={setVideoRef}
          autoPlay
          playsInline
          muted
          webkit-playsinline="true"
          className={cn(
            "absolute inset-0 w-full h-full object-cover",
            shouldMirror && "scale-x-[-1]"
          )}
        />

        {/* Aspect ratio guide overlay */}
        {aspectRatio && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className="border-2 border-dashed border-white/50 max-w-full max-h-full"
              style={{
                aspectRatio: ASPECT_RATIOS[aspectRatio],
                width: "100%",
                height: "100%",
                maxWidth: aspectRatio === "9:16" ? "56.25%" : "100%",
                maxHeight: aspectRatio === "3:4" ? "100%" : "75%",
              }}
            />
          </div>
        )}
      </div>
    );
  }
);
