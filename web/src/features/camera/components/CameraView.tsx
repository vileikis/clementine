"use client";

/**
 * CameraView Component
 *
 * Displays live video preview from camera stream.
 * Supports aspect ratio guides and front camera mirroring.
 */

import { cn } from "@/lib/utils";
import type { AspectRatio, CameraFacing } from "../types";

interface CameraViewProps {
  /** Current camera facing direction (for mirroring) */
  facing?: CameraFacing;
  /** Aspect ratio guide overlay */
  aspectRatio?: AspectRatio;
  /** Additional CSS classes */
  className?: string;
  /** Callback ref for video element */
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
 */
export function CameraView({
  facing = "user",
  aspectRatio,
  className,
  videoRef,
}: CameraViewProps) {
  // Mirror front camera for natural selfie appearance
  const shouldMirror = facing === "user";

  return (
    <div className={cn("relative w-full h-full bg-black", className)}>
      {/* Video element */}
      <video
        ref={videoRef}
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
