"use client";

/**
 * CameraControls Component
 *
 * Capture, flip camera, and library selection buttons.
 * 64x64px capture button for easy touch targeting.
 */

import { Camera, SwitchCamera, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CameraCaptureLabels } from "../types";
import { DEFAULT_LABELS } from "../constants";

interface CameraControlsProps {
  /** Custom labels for i18n */
  labels?: CameraCaptureLabels;
  /** Whether capture is in progress */
  isCapturing?: boolean;
  /** Whether to show flip camera button */
  showFlipButton?: boolean;
  /** Whether to show library button */
  showLibraryButton?: boolean;
  /** Called when user taps capture button */
  onCapture: () => void;
  /** Called when user taps flip camera button */
  onFlipCamera?: () => void;
  /** Called when user taps library button */
  onOpenLibrary?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Camera control buttons (capture, flip, library)
 */
export function CameraControls({
  labels = {},
  isCapturing = false,
  showFlipButton = false,
  showLibraryButton = true,
  onCapture,
  onFlipCamera,
  onOpenLibrary,
  className,
}: CameraControlsProps) {
  const mergedLabels = { ...DEFAULT_LABELS, ...labels };

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-6 p-4 bg-black/50",
        className
      )}
    >
      {/* Library button (left) */}
      {showLibraryButton ? (
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenLibrary}
          disabled={isCapturing}
          className="size-12 rounded-full text-white hover:bg-white/20 min-h-[44px] min-w-[44px]"
          aria-label={mergedLabels.openLibrary}
        >
          <ImageIcon className="size-6" />
        </Button>
      ) : (
        // Spacer to maintain layout
        <div className="size-12" />
      )}

      {/* Capture button (center) - 64x64px for easy touch */}
      <button
        onClick={onCapture}
        disabled={isCapturing}
        className={cn(
          "size-16 rounded-full bg-white border-4 border-white/50",
          "flex items-center justify-center",
          "transition-all duration-150",
          "hover:scale-105 active:scale-95",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
        )}
        aria-label={mergedLabels.capture}
      >
        <Camera className="size-7 text-black" />
      </button>

      {/* Flip camera button (right) */}
      {showFlipButton && onFlipCamera ? (
        <Button
          variant="ghost"
          size="icon"
          onClick={onFlipCamera}
          disabled={isCapturing}
          className="size-12 rounded-full text-white hover:bg-white/20 min-h-[44px] min-w-[44px]"
          aria-label={mergedLabels.flipCamera}
        >
          <SwitchCamera className="size-6" />
        </Button>
      ) : (
        // Spacer to maintain layout
        <div className="size-12" />
      )}
    </div>
  );
}
