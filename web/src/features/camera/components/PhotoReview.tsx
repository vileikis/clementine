"use client";

/**
 * PhotoReview Component
 *
 * Displays captured photo with confirm and retake actions.
 */

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CapturedPhoto, CameraCaptureLabels } from "../types";
import { DEFAULT_LABELS } from "../constants";

interface PhotoReviewProps {
  /** The captured photo to review */
  photo: CapturedPhoto;
  /** Custom labels for i18n */
  labels?: CameraCaptureLabels;
  /** Whether submission is in progress */
  isSubmitting?: boolean;
  /** Called when user confirms photo */
  onConfirm: () => void;
  /** Called when user wants to retake */
  onRetake?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Photo review screen with confirm/retake actions
 */
export function PhotoReview({
  photo,
  labels = {},
  isSubmitting = false,
  onConfirm,
  onRetake,
  className,
}: PhotoReviewProps) {
  const mergedLabels = { ...DEFAULT_LABELS, ...labels };

  return (
    <div className={cn("flex flex-col h-full bg-black", className)}>
      {/* Photo preview */}
      <div className="flex-1 relative">
        <Image
          src={photo.previewUrl}
          alt="Captured photo preview"
          fill
          className="object-contain"
          priority
        />
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 p-4 bg-black/50">
        {onRetake && (
          <Button
            variant="outline"
            onClick={onRetake}
            disabled={isSubmitting}
            className="flex-1 min-h-[44px] text-white border-white/50 hover:bg-white/20"
          >
            {mergedLabels.retake}
          </Button>
        )}

        <Button
          onClick={onConfirm}
          disabled={isSubmitting}
          className="flex-1 min-h-[44px]"
        >
          {isSubmitting ? "Processing..." : mergedLabels.confirm}
        </Button>
      </div>
    </div>
  );
}
